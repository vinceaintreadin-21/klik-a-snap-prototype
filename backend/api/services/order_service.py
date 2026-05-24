# api/services/order_service.py
from api.models.orders import Order
from api.models.students import Student
from django.db import transaction
from api.services.qr_service import bulk_generate_qr_codes

def create_full_order(school_name, batch_name, student_list, institution=None):
    # We use a transaction (like Laravel's DB::transaction)
    # This ensures that if one student fails, the whole order isn't created.
    with transaction.atomic():
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
            ) for s in student_list
        ]
        
        for obj in student_objs:
            obj.save()
        
        # Generate QR codes for all students
        students = Student.objects.filter(order_id=new_order.id)
        qr_result = bulk_generate_qr_codes(students, new_order.id)
        
    
        
        print(f"QR Generation: {qr_result['generated']} success, {qr_result['failed']} failed")
        if qr_result['errors']:
            print(f"QR Errors: {qr_result['errors']}")
            
        # Update order student count (fail safe just incase)
        new_order.student_count = qr_result['generated']
        new_order.save()
        
    return new_order