from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Calendrier
from .serializers import CalendrierSerializer


class CalendrierViewSet(viewsets.ModelViewSet):
    queryset = Calendrier.objects.all()
    serializer_class = CalendrierSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['code', 'title', 'is_dossier', 'direction', 'sous_direction_id', 'is_active']
