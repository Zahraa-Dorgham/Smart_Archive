from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CalendrierViewSet

router = DefaultRouter()
router.register(r'calendriers', CalendrierViewSet, basename='calendrier')

urlpatterns = [
    path('', include(router.urls)),
]
