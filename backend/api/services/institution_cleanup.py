"""Delete only assets owned by the terminating institution before deleting rows."""
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

import cloudinary
import cloudinary.api
import cloudinary.uploader
from django.conf import settings

from api.models.institution import Institution
from api.models.id_layout import IDLayout
from api.models.subjects import Subject


class AssetCleanupError(Exception):
    pass


def _delete_prefix(prefix):
    cursor = None
    while True:
        options = {'resource_type': 'image', 'type': 'upload', 'invalidate': True}
        if cursor:
            options['next_cursor'] = cursor
        result = cloudinary.api.delete_resources_by_prefix(prefix, **options)
        if not isinstance(result.get('deleted'), dict):
            raise AssetCleanupError('Cloudinary returned an invalid deletion response')
        if any(value not in ('deleted', 'not_found') for value in result.get('deleted', {}).values()):
            raise AssetCleanupError(f'Cloudinary did not delete all assets under {prefix}')
        next_cursor = result.get('next_cursor')
        if not result.get('partial') and not next_cursor:
            return
        if not next_cursor or next_cursor == cursor:
            raise AssetCleanupError(f'Incomplete Cloudinary cleanup under {prefix}')
        cursor = next_cursor


def _delete_reference(reference):
    if not reference:
        return
    parsed = urlsplit(reference)
    if parsed.netloc == 'res.cloudinary.com':
        # Only accept this application's original, versioned upload URLs.
        cloud_name = cloudinary.config().cloud_name
        prefix = f'/{cloud_name}/image/upload/'
        if not cloud_name or not parsed.path.startswith(prefix):
            raise AssetCleanupError('Asset is not an upload in the configured Cloudinary account')
        match = re.fullmatch(r'v\d+/(.+)\.[^/.]+', unquote(parsed.path[len(prefix):]))
        if not match:
            raise AssetCleanupError('Cannot identify the original Cloudinary asset')
        result = cloudinary.uploader.destroy(match.group(1), invalidate=True, resource_type='image')
        if result.get('result') not in ('ok', 'not found'):
            raise AssetCleanupError('Cloudinary asset deletion failed')
        return

    path = unquote(parsed.path)
    media_prefix = settings.MEDIA_URL.rstrip('/') + '/'
    if path.startswith(media_prefix):
        path = path[len(media_prefix):]
    elif parsed.scheme or parsed.netloc or path.startswith('/'):
        raise AssetCleanupError('Unsupported asset URL; records retained for retry')
    media_root = Path(settings.MEDIA_ROOT).resolve()
    target = (media_root / path).resolve()
    if target == media_root or media_root not in target.parents:
        raise AssetCleanupError('Asset path escapes media storage')
    target.unlink(missing_ok=True)


def _crop_references(subject):
    references = set()
    # Older development builds stored crops in a shared directory.
    if subject.original_photo_url:
        filename = urlsplit(subject.original_photo_url).path.rsplit('/', 1)[-1]
        references.add(f'cropped_faces/cropped_{filename}')
    # Only construct legacy filenames from safe single-component IDs.
    if re.fullmatch(r'[A-Za-z0-9_-]+', subject.student_id):
        references.add(f'cropped_faces/manual_crop_{subject.student_id}.jpg')
    return references


def purge_institution_assets(institution):
    orders = list(institution.orders.all())
    subjects = list(Subject.objects.filter(order__institution=institution))
    layouts = list(IDLayout.objects.filter(order__institution=institution))
    references = {institution.logo_url}
    for subject in subjects:
        references.update(_crop_references(subject))
        references.update((subject.original_photo_url, subject.processed_photo,
                           subject.processed_photo_back, subject.qr_code_url))
        if subject.photo:
            references.add(subject.photo.name)
    for layout in layouts:
        references.add(layout.background_image_url)
        if layout.background_image:
            references.add(layout.background_image.name)
    references.discard(None)
    references.discard('')

    # Do not destroy a shared background/logo referenced by another institution.
    shared = set(Institution.objects.exclude(pk=institution.pk).values_list('logo_url', flat=True))
    for layout in IDLayout.objects.exclude(order__institution=institution):
        shared.update((layout.background_image_url, layout.background_image.name))
    for subject in Subject.objects.exclude(order__institution=institution):
        shared.update(_crop_references(subject))
        shared.update((subject.original_photo_url, subject.processed_photo,
                       subject.processed_photo_back, subject.qr_code_url, subject.photo.name))

    for reference in sorted(references - shared):
        _delete_reference(reference)

    # Catch uploads not attached to subjects, including unreadable QR photos.
    # Delimit order IDs so order_1 never matches order_10.
    for order in orders:
        for folder in ('student_photos', 'final_ids', 'print_sheets', 'qr_codes'):
            prefix = f'{folder}/order_{order.id}/'
            if any(reference and prefix in unquote(urlsplit(reference).path)
                   for reference in shared):
                raise AssetCleanupError('An order asset is shared with another institution')
        for folder in ('student_photos', 'final_ids', 'print_sheets', 'qr_codes'):
            _delete_prefix(f'{folder}/order_{order.id}/')

        local_photos = Path(settings.MEDIA_ROOT) / 'student_photos' / f'order_{order.id}'
        if local_photos.is_dir() and not local_photos.is_symlink():
            for path in local_photos.rglob('*'):
                if path.is_file():
                    _delete_reference(path.relative_to(settings.MEDIA_ROOT).as_posix())
        sheet_dir = Path(settings.MEDIA_ROOT) / 'print_sheets'
        for path in sheet_dir.glob(f'order_{order.id}_sheet_*.png'):
            _delete_reference(path.relative_to(settings.MEDIA_ROOT).as_posix())

    # Legacy QR uploads used the literal folder "order_{order_id}".
    # Their stored URLs above are deleted individually, never by shared prefix.
