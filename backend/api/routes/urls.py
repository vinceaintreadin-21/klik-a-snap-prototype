from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views.order_views import order_controller, start_processing, complete_order, download_qr_codes, get_student_qr, upload_photos
from api.views.student_views import (
    student_detail_controller, search_students, 
    quick_add_student, manual_link_photo
)
from api.views.layout_views import create_layout, get_layout
from api.views.auth_views import register_user, get_user_profile
from api.views.admin_views import (    
    get_operators, create_operator, operator_detail,
    update_operator, reset_password, delete_operator, get_all_orders,
    assign_operator, override_order_status 

)
from api.views.institution_views import (
    get_institutions, create_institution, institution_detail,
    update_institution, get_institution_orders
)

from api.views.analytics_views import (
    get_analytics_overview, get_orders_per_month, get_manual_review_rate
)

from api.views.logs_views import (
    get_audit_logs, get_processing_logs, get_error_logs
)


urlpatterns = [
    # Order routes
    path('orders/', order_controller, name='orders-list-create'),

    # Auth routes
    path('auth/register/', register_user, name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', get_user_profile, name='user_profile'),

    # Student routes
    path('orders/<int:order_id>/students/', student_detail_controller, name='order-students'),
    path('orders/<int:pk>/process/', start_processing, name='process-order'),
    path('orders/<int:pk>/complete/', complete_order, name='complete-order'),
    
    path('orders/<int:order_id>/students/search/', search_students, name='student-search'),
    path('orders/<int:order_id>/students/quick-add/', quick_add_student, name='student-quick-add'),
    path('orders/<int:order_id>/students/manual-link/', manual_link_photo, name='student-manual-link'),
    
    path('orders/<int:order_id>/layout/create/', create_layout, name='create-layout'),
    path('orders/<int:order_id>/layout/', get_layout, name='get-layout'),
    
    #Operator Management for admin (tentative)
    path('admin/operators/', get_operators, name='get_operators'), #GET
    path('admin/create-operator/',  create_operator, name='create_operator'), #POST
    path('admin/operators/<int:id>/', operator_detail, name='operator_detail'), #GET
    path('admin/operators/<int:id>/update/', update_operator, name='update_operator'), #PATCH
    path('admin/operators/<int:id>/reset-password/', reset_password, name='reset_password'), #PATCH
    path('admin/operators/<int:id>/delete/', delete_operator, name='delete_operator'), #DELETE
    
    #Institution Management
    path('admin/institutions/', get_institutions, name='get_institutions'),
    path('admin/create-institution/', create_institution, name='create_institution'),
    path('admin/institutions/<int:id>/', institution_detail, name='institution_detail'),
    path('admin/institutions/<int:id>/update/', update_institution, name='update_institution'),
    path('admin/institutions/<int:id>/orders/', get_institution_orders, name='institution_orders'),

    #Analytics
    path('admin/analytics/overview/', get_analytics_overview, name='analytics-overview'),
    path('admin/analytics/orders-per-month/', get_orders_per_month, name='orders-per-month'),
    path('admin/analytics/manual-review-rate/', get_manual_review_rate, name='manual-review-rate'),

    #Logs
    path('admin/logs/audit/', get_audit_logs, name='audit-logs'),
    path('admin/logs/processing/', get_processing_logs, name='processing-logs'),
    path('admin/logs/errors/', get_error_logs, name='error-logs'),

    path('admin/orders/', get_all_orders, name='all-orders'),

    path('admin/orders/<int:order_id>/assign/', assign_operator, name='assign-operator'),

    path('admin/orders/<int:order_id>/override-status/', override_order_status, name='override-order-status'),

    #Operator
    path('orders/<int:order_id>/photos/upload/', upload_photos, name='upload-photos'),

    # QR code generation
    path('orders/<int:order_id>/qr-codes/download/', download_qr_codes, name='download_qr_codes'),
    path('students/<int:student_id>/qr-code/', get_student_qr, name='get_student_qr'),
]   