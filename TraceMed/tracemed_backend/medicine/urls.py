from django.urls import path
from . import views
from . import auth_views

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
]
