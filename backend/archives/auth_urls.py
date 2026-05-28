# archives/auth_urls.py
from django.urls import path
from . import auth_views
from .auth_views import CustomTokenObtainPairView, Verify2FAView

# IMPORTANT: Ne pas répéter 'auth/' ici car déjà dans urls.py
urlpatterns = [
    path('register/', auth_views.RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('verify-2fa/', Verify2FAView.as_view(), name='verify-2fa'),
    path('refresh/', auth_views.TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('profile/', auth_views.UserProfileView.as_view(), name='profile'),
    path('change-password/', auth_views.ChangePasswordView.as_view(), name='change-password'),
    path('verify-email/', auth_views.VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', auth_views.ResendVerificationView.as_view(), name='resend-verification'),
]
