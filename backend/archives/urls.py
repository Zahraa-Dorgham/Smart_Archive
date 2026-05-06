# archives/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'roles', views.RoleViewSet)
router.register(r'batiments', views.BatimentViewSet)
router.register(r'directions', views.DirectionViewSet)
router.register(r'salles', views.SalleViewSet)
router.register(r'armoires', views.ArmoireViewSet)
router.register(r'etageres', views.EtagereViewSet)
router.register(r'phases-archive', views.PhaseArchiveViewSet)
router.register(r'archives-courantes', views.ArchiveCourantViewSet)
router.register(r'archives-intermediaires', views.ArchiveIntermediaireViewSet)
router.register(r'archives-definitives', views.ArchiveDefinitiveViewSet)
router.register(r'groups', views.GroupViewSet)
router.register(r'boitiers', views.BoitierViewSet)
router.register(r'dossiers', views.DossierViewSet)
router.register(r'documents', views.DocumentViewSet)
# router.register(r'demandes-consultation', views.DemandeConsultationViewSet)
router.register(r'consultations', views.ConsultationViewSet)
router.register(r'transferts', views.TransfertViewSet)
router.register(r'bordereaux', views.BordereauViewSet)
router.register(r'users', views.UserViewSet)
router.register(r'stats', views.DashboardStatsView, basename='stats')


urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include('archives.auth_urls')), 
]
