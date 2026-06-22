from django.urls import path
from . import views
from . import auth_views
from . import blockchain_views
from . import admin_views

urlpatterns = [
    path('', views.index, name='index'),

    # Auth endpoints
    path('api/auth/login/', auth_views.login_view, name='auth_login'),
    path('api/auth/refresh/', auth_views.refresh_view, name='auth_refresh'),
    path('api/auth/me/', auth_views.me_view, name='auth_me'),

    # Medicine CRUD endpoints
    path('api/medicines/', views.medicine_list, name='medicine_list'),
    path('api/medicines/<str:medicine_id>/', views.medicine_detail, name='medicine_detail'),

    # Medicine records (supply chain tracking)
    path('api/records/', views.medicine_records, name='medicine_records'),
    path('api/records/<str:medicine_id>/', views.medicine_records, name='medicine_records_by_id'),

    # Search endpoint
    path('api/search/', views.medicine_search, name='medicine_search'),

    # Batch lookup endpoints for frontend / QR scanner
    path('api/batches/<str:batch_number>/history/', views.batch_history, name='batch_history'),
    path('api/batches/<str:batch_number>/qr/', views.batch_qr, name='batch_qr'),

    # Blockchain read & diagnostic endpoints
    path('api/blockchain/status/', blockchain_views.blockchain_status, name='blockchain_status'),
    path('api/blockchain/sync-audit/', blockchain_views.blockchain_sync_audit, name='blockchain_sync_audit'),
    path('api/blockchain/lots/<str:lot_id>/', blockchain_views.blockchain_lot_detail, name='blockchain_lot_detail'),
    path('api/blockchain/lots/<str:lot_id>/history/', blockchain_views.blockchain_lot_history, name='blockchain_lot_history'),

    # Blockchain role management (admin only)
    path('api/blockchain/roles/add/', blockchain_views.blockchain_role_add, name='blockchain_role_add'),
    path('api/blockchain/roles/revoke/', blockchain_views.blockchain_role_revoke, name='blockchain_role_revoke'),
    path('api/blockchain/roles/activate/', blockchain_views.blockchain_role_activate, name='blockchain_role_activate'),

    # Admin — user & role management (admin only)
    path('api/admin/users/', admin_views.user_list, name='admin_user_list'),
    path('api/admin/users/<int:user_id>/', admin_views.user_detail, name='admin_user_detail'),
    path('api/admin/users/<int:user_id>/set-password/', admin_views.user_set_password, name='admin_user_set_password'),
]
