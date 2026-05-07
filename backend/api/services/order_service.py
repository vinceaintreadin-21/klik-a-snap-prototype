# api/services/order_service.py
from api.models.orders import Order
from api.models.students import Student
from django.db import transaction

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
                grade_level=s['grade']
            ) for s in student_list
        ]
        Student.objects.bulk_create(student_objs)
        
    return new_order