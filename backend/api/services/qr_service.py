import qrcode
import uuid
from io import BytesIO
import cloudinary.uploader
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.core.files.base import ContentFile
from django.conf import settings
from django.core.files.uploadedfile import InMemoryUploadedFile
import os

#generate unique QR code payload
def generate_qr_code_data(order_id, student_id):
    return str(uuid.uuid4())

def upload_qr_to_cloudinary(qr_data, student_id):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color='black', back_color='white')

    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    upload_result = cloudinary.uploader.upload(
        buffer,
        folder="qr_codes",
        public_id=f"student_{student_id}_{qr_data}",
        resource_type="image",
        format="png"
    )

    return upload_result['secure_url']
    

#Generate and save QR code for a student
def generate_student_qr(student, order_id):
    qr_data = generate_qr_code_data(order_id, student.student_id)
    qr_url = upload_qr_to_cloudinary(qr_data, student.id)

    student.qr_code_data = qr_data
    student.qr_code_url = qr_url
    student.save()

    return qr_data

def _process_single_student(student, order_id):
    """Generate QR data, upload to Cloudinary, return update tuple."""
    qr_data = generate_qr_code_data(order_id, student.student_id)
    qr_url = upload_qr_to_cloudinary(qr_data, student.id)
    return student.id, qr_data, qr_url


# Generate QR codes for multiple students in parallel
def bulk_generate_qr_codes(students, order_id):
    from api.models.students import Student

    student_list = list(students)  # evaluate queryset once
    generated_count = 0
    failed_students = []
    updates = []

    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {
            executor.submit(_process_single_student, student, order_id): student
            for student in student_list
        }

        for future in as_completed(futures):
            student = futures[future]
            try:
                student_id, qr_data, qr_url = future.result()
                updates.append((student_id, qr_data, qr_url))
                generated_count += 1
            except Exception as e:
                print(f"❌ QR FAILED for {student.student_id}: {e}")
                failed_students.append({'student_id': student.student_id, 'error': str(e)})

    # Single bulk DB update instead of 400+ individual saves
    student_map = {s.id: s for s in student_list}
    students_to_update = []
    for student_id, qr_data, qr_url in updates:
        s = student_map[student_id]
        s.qr_code_data = qr_data
        s.qr_code_url = qr_url
        students_to_update.append(s)

    if students_to_update:
        Student.objects.bulk_update(students_to_update, ['qr_code_data', 'qr_code_url'])

    return {
        'generated': generated_count,
        'failed': len(failed_students),
        'errors': failed_students
    }
