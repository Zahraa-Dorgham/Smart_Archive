# archives/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'roles', views.RoleViewSet, basename='role')
router.register(r'permissions', views.PermissionViewSet, basename='permission')
router.register(r'batiments', views.BatimentViewSet, basename='batiment')
router.register(r'salles', views.SalleViewSet, basename='salle')
router.register(r'armoires', views.ArmoireViewSet, basename='armoire')
router.register(r'etageres', views.EtagereViewSet, basename='etagere')
router.register(r'phases-archive', views.PhaseArchiveViewSet)
router.register(r'archives-courantes', views.ArchiveCourantViewSet)
router.register(r'archives-intermediaires', views.ArchiveIntermediaireViewSet)
router.register(r'archives-definitives', views.ArchiveDefinitiveViewSet)
router.register(r'groups', views.GroupViewSet, basename='group')
router.register(r'boitiers', views.BoitierViewSet, basename='boitier')
router.register(r'dossiers', views.DossierViewSet)
router.register(r'documents', views.DocumentViewSet)
# router.register(r'demandes-consultation', views.DemandeConsultationViewSet)
router.register(r'consultations', views.ConsultationViewSet)
router.register(r'transferts', views.TransfertViewSet)
router.register(r'bordereaux', views.BordereauViewSet)
router.register(r'users', views.UserViewSet, basename='user')


urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include('archives.auth_urls')), 
]
