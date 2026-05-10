#image_processor.py
import cv2
import mediapipe as mp
from api.models.students import Student

def process_student_photo(image_path):
    # Load Image
    img = cv2.imread(image_path)
    
    #  QR Code Detection (OpenCV)
    detector = cv2.QRCodeDetector()
    qr_data, bbox, _ = detector.detectAndDecode(img) #type: ignore
    
    
    if not qr_data:
        return {
            'status': 'manual_review',
            'reason': 'No QR code detected',
            'student_id': None
        }
        
    # Match QR code with database
    try:
        student = Student.objects.get(
            qr_code_data=qr_data,
            order_id=order_id
        )
    except Student.DoesNotExist:
        return {
            'status': "manual_review",
            "reason": f"QR code '{qr_data}' not found in database",
            "student_id": None
        }
    except Student.MultipleObjectsReturned:
        return {
            "status": "manual_review",
            "reason": f"Duplicate QR code '{qr_data}' found",
            "student_id": None
        }
        
    #  Face Alignment (MediaPipe)
    mp_face_detection = mp.solutions.face_detection #type: ignore
    with mp_face_detection.FaceDetection(
        model_selection=1, 
        min_detection_confidence=0.5
        ) as face_detection: #type: ignore
        
        results = face_detection.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)) #type: ignore
        
        if not results.detections:
            return {
                'status': 'manual_review',
                'reason': 'No face detected',
                'student_id': None
            }
        
        processed_path = f"processed_{student.id}.jpg"
        
    student.photo_status = Student.PhotoStatus.PROCESSED
    student.processed_photo = processed_path
    student.save()
        
    return {
        "status": "success",
        "student_id": student.id,
        "processed_image_path": processed_path
    }