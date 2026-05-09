from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views.order_views import order_controller, start_processing, complete_order
from api.views.student_views import (
    student_detail_controller, search_students, 
    quick_add_student, manual_link_photo
)
from api.views.layout_views import create_layout, get_layout
from api.views.auth_views import register_user, get_user_profile
from api.views.admin_views import (    
    get_operators, create_operator, operator_detail,
    update_operator, reset_password, delete_operator

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
]