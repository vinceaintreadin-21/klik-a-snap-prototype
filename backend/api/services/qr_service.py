import qrcode
import uuid
from io import BytesIO
import cloudinary.uploader
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

# Generate QR code for multiple students
def bulk_generate_qr_codes(students, order_id):
    generated_count = 0
    failed_students = []

    for student in students:
        try:
            generate_student_qr(student, order_id)
            generated_count += 1
        except Exception as e:
            print(f"❌ QR FAILED for {student.student_id}: {e}")
            failed_students.append({'student_id': student.student_id, 'error': str(e)})

    return {
        'generated': generated_count,
        'failed': len(failed_students),
        'errors': failed_students
    }
