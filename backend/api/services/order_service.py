# api/services/order_service.py
from api.models.orders import Order
from api.models.students import Student
from django.db import transaction
from api.services.qr_service import bulk_generate_qr_codes

def create_full_order(school_name, batch_name, student_list, institution=None):
    # We use a transaction (like Laravel's DB::transaction)
    # This ensures that if one student fails, the whole order isn't created.
    with transaction.atomic():

        student_ids = [s['student_id'] for s in student_list] 
        if len (student_ids) != len(set(student_ids)):  
            raise ValueError("Duplicate student_id values found in the student list")
            
        new_order = Order.objects.create(
            school_name=school_name,
            batch_name=batch_name,
            student_count=len(student_list),
            institution=institution
        )
        
        # Bulk create for performance
        student_objs = [
            Student(
                order=new_order,
                full_name=s['name'],
                student_id=s['student_id'],
                grade_level=s['grade'],
                section=s.get('section', ''),
                extra_data=s.get('extra_fields', {})
            ) for s in student_list
        ]

        
        Student.objects.bulk_create(student_objs)

    # Run QR generation OUTSIDE the transaction — Cloudinary calls inside a
    # transaction hold the DB connection open for the full duration
    students = Student.objects.filter(order_id=new_order.id)
    qr_result = bulk_generate_qr_codes(students, new_order.id)

    print(f"QR Generation: {qr_result['generated']} success, {qr_result['failed']} failed")
    if qr_result['errors']:
        print(f"QR Errors: {qr_result['errors']}")

    new_order.student_count = qr_result['generated']
    new_order.save()

    return new_order