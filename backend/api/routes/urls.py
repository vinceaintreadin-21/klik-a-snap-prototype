from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from api.views.order_views import order_controller, start_processing, complete_order, download_qr_codes, get_student_qr, upload_photos, parse_order_file, update_order, check_duplicate_order, download_id_cards, generate_test_photos

from api.views.student_views import (
    student_detail_controller, search_students, 
    quick_add_student, manual_link_photo, approve_order,
    approve_student, request_revision
)
from api.views.layout_views import create_layout, get_layout, preview_layout
from api.views.auth_views import register_user, get_user_profile, login_user, logout_user
from api.views.admin_views import (    
    get_operators, create_operator, operator_detail,
    update_operator, reset_password, delete_operator, get_all_orders,
    assign_operator, override_order_status 

)
from api.views.institution_views import (
    get_institutions, create_institution, institution_detail,
    update_institution, get_institution_orders,
    get_my_institution, update_my_institution, change_my_password, 
    invite_coordinator, list_coordinators 
)

from api.views.analytics_views import (
    get_analytics_overview, get_orders_per_month, get_manual_review_rate,
    get_avg_turnaround,
)

from api.views.logs_views import (
    get_audit_logs, get_processing_logs, get_error_logs
)

from api.views.coordinator_views import (
    coordinator_orders, coordinator_search_students,
    validate_invite, accept_invite,
    coordinator_student_list, mark_photographed,
    coordinator_proofing_orders
)

urlpatterns = [
    # Order routes
    path('orders/', order_controller, name='orders-list-create'),
    path('orders/parse-file/', parse_order_file, name='parse-order-file'),
    path('orders/check-duplicate/', check_duplicate_order, name='check_duplicate_order'),
    path('orders/<int:order_id>/update/', update_order, name='update-order'),

    # Auth routes
    path('auth/register/', register_user, name='register'),
    path('auth/login/', login_user, name='login'),
    path('auth/logout/', logout_user, name='logout'),
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
    path('orders/<int:order_id>/layout/preview/', preview_layout, name='layout-preview'),
    
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

    path('admin/analytics/avg-turnaround/', get_avg_turnaround, name='avg-turnaround'),

    path('admin/orders/<int:order_id>/assign/', assign_operator, name='assign-operator'),
    path('admin/orders/<int:order_id>/override-status/', override_order_status, name='override-order-status'),

    path('admin/orders/', get_all_orders, name='all-orders'),

    path('orders/<int:order_id>/approve/', approve_order, name='approve-order'),
    path('students/<int:student_id>/approve/', approve_student, name='approve-student'),
    path('students/<int:student_id>/request-revision/', request_revision, name='request-revision'),

    #Operator
    path('orders/<int:order_id>/photos/upload/', upload_photos, name='upload-photos'),
    path('orders/<int:order_id>/students/<int:student_id>/manual-crop/', upload_photos, name='student-manual-crop'),

    # QR code generation
    path('orders/<int:order_id>/qr-codes/download/', download_qr_codes, name='download_qr_codes'),
    path('students/<int:student_id>/qr-code/', get_student_qr, name='get_student_qr'),

    path('orders/<int:order_id>/id-cards/download/', download_id_cards, name='download_id_cards'),

    path('institution/profile/', get_my_institution, name='my-institution'),
    path('institution/profile/update/', update_my_institution, name='update-my-institution'),
    path('institution/profile/change-password/', change_my_password, name='change-my-password'),

    path('coordinator/orders/', coordinator_orders, name='coordinator-orders'),
    path('coordinator/students/search/', coordinator_search_students, name='coordinator-student-search'),


    path('institution/coordinators/', list_coordinators, name='list-coordinators'),
    path('institution/coordinators/invite/', invite_coordinator, name='invite-coordinator'),

    path('coordinator/join/<uuid:token>/', validate_invite, name='validate-invite'),   # GET
    path('coordinator/join/<uuid:token>/accept/', accept_invite, name='accept-invite'),

    path('coordinator/proofing-orders/', coordinator_proofing_orders, name='coordinator-proofing-orders'),
    
    path('coordinator/orders/<int:order_id>/students/', coordinator_student_list, name='coordinator-student-list'),
    path('coordinator/students/<int:student_id>/mark-photographed/', mark_photographed, name='mark-photographed'),

    path('orders/<int:order_id>/generate-test-photos/', generate_test_photos, name='generate-test-photos'),
]       