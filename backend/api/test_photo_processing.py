"""Processing failures must preserve review records and source photos."""
from types import SimpleNamespace
from unittest.mock import Mock, patch
from tempfile import TemporaryDirectory

import cv2
import numpy as np
import requests
from django.test import SimpleTestCase, override_settings

from api.models.subjects import Subject
from api.services import id_engine, processing_service


class PhotoProcessingTests(SimpleTestCase):
    def setUp(self):
        self.url = "https://example.test/KAS-test_Ana.jpg"
        self.subject = Mock(
            original_photo_url="",
            photo_status=Subject.PhotoStatus.PENDING,
            fail_reason="",
        )

    def test_crop_returns_four_values_in_debug_and_production(self):
        image = np.zeros((100, 60, 3), dtype=np.uint8)
        cascade = Mock()
        cascade.detectMultiScale.return_value = [(20, 20, 30, 30)]
        for debug in (True, False):
            with self.subTest(debug=debug), TemporaryDirectory() as media_root, override_settings(
                DEBUG=debug, MEDIA_ROOT=media_root
            ), patch.dict("sys.modules", {"mediapipe": None}), patch.object(
                id_engine.os.path, "exists", return_value=True
            ), patch.object(id_engine.cv2, "CascadeClassifier", return_value=cascade), patch.object(
                processing_service, "broadcast_stage"
            ):
                crop, found, detector, confidence = id_engine._crop_face(42, image, self.url)
                self.assertIsInstance(crop, str if debug else bytes)
                self.assertTrue(found)
                self.assertEqual(detector, "haar")
                self.assertIsNone(confidence)

    def test_qr_fallback_enlarges_lower_half(self):
        detector = Mock()
        detector.detectAndDecode.side_effect = [
            ("", None, None), ("test-qr", None, None),
        ]
        image = np.zeros((100, 60, 3), dtype=np.uint8)
        with patch.object(id_engine.cv2, "QRCodeDetector", return_value=detector):
            self.assertEqual(id_engine._read_photo_qr(image), "test-qr")
        fallback = detector.detectAndDecode.call_args_list[1].args[0]
        self.assertEqual(fallback.shape, (100, 120))

    def test_crop_failure_preserves_source_and_marks_review(self):
        _, encoded = cv2.imencode(".jpg", np.zeros((100, 60, 3), dtype=np.uint8))
        response = Mock(content=encoded.tobytes())
        attempt = SimpleNamespace(subject=None, outcome="error", save=Mock())

        def fail_crop(*args):
            self.assertEqual(self.subject.original_photo_url, self.url)
            self.subject.save.assert_called_with(update_fields=["original_photo_url"])
            raise RuntimeError("crop failed")

        with patch.object(id_engine, "ProcessingAttempt", return_value=attempt), patch.object(
            id_engine.requests, "get", return_value=response
        ), patch.object(id_engine, "_read_photo_qr", return_value="test-qr"), patch.object(
            Subject.objects, "get", return_value=self.subject
        ), patch.object(id_engine, "_crop_face", side_effect=fail_crop), patch.object(
            processing_service, "broadcast_stage"
        ), self.assertLogs(id_engine.logger, level="ERROR"):
            subject, result = id_engine.process_single_photo(self.url, 42)

        self.assertIs(subject, self.subject)
        self.assertEqual(result, "manual_review")
        self.assertEqual(subject.photo_status, Subject.PhotoStatus.MANUAL_REVIEW)
        self.assertEqual(subject.fail_reason, "error")
        response.raise_for_status.assert_called_once()
        attempt.save.assert_called_once()
        self.assertEqual(attempt.outcome, "error")

    def test_failed_download_or_decode_preserves_review_source(self):
        for http_error in (True, False):
            with self.subTest(http_error=http_error):
                self.subject.original_photo_url = ""
                response = Mock(content=b"not an image")
                if http_error:
                    response.raise_for_status.side_effect = requests.HTTPError("404")
                with patch.object(id_engine.requests, "get", return_value=response), patch.object(
                    Subject.objects, "filter"
                ) as subjects, patch.object(processing_service, "broadcast_stage"):
                    subjects.return_value.first.return_value = self.subject
                    subject, result = id_engine._process_single_photo(
                        self.url, 42, SimpleNamespace(subject=None)
                    )
                self.assertEqual(result, "manual_review")
                self.assertEqual(subject.original_photo_url, self.url)
                self.assertEqual(subject.fail_reason, "error")

    def test_unmatched_exception_is_not_attached_to_arbitrary_subject(self):
        attempt = SimpleNamespace(subject=None, save=Mock())
        with patch.object(id_engine, "ProcessingAttempt", return_value=attempt), patch.object(
            id_engine, "_process_single_photo", side_effect=RuntimeError("scan failed")
        ), self.assertLogs(id_engine.logger, level="ERROR"), self.assertRaises(RuntimeError):
            id_engine.process_single_photo(self.url, 42)
        attempt.save.assert_called_once()


class ProcessingBroadcastTests(SimpleTestCase):
    def test_redis_failure_does_not_interrupt_processing(self):
        for broadcast, args in (
            (processing_service.broadcast_stage, (42, "read-qr")),
            (processing_service.broadcast_status, (42, "PROCESSING")),
        ):
            with self.subTest(broadcast=broadcast.__name__), patch.object(
                processing_service, "get_channel_layer", side_effect=ConnectionError("Redis down")
            ), self.assertLogs(processing_service.logger, level="ERROR"):
                broadcast(*args)

    def test_progress_event_is_preserved(self):
        with patch.object(processing_service, "get_channel_layer"), patch.object(
            processing_service, "async_to_sync"
        ) as send:
            processing_service.broadcast_status(42, "PROCESSING", {
                "action": "progress_update", "processed": 3,
            })
        send.return_value.assert_called_once_with("order_42", {
            "type": "post_update",
            "message": {
                "action": "progress_update", "id": 42,
                "status": "PROCESSING", "processed": 3,
            },
        })
