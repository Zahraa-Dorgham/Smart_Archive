from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from archives.permissions import EstAdministrateur, EstLectureAutorisee, user_has_any_role
from .models import Calendrier
from .serializers import CalendrierSerializer

class CalendrierViewSet(viewsets.ModelViewSet):
    queryset = Calendrier.objects.all()
    serializer_class = CalendrierSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstAdministrateur()]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['code', 'title', 'is_dossier', 'direction', 'sous_direction_id', 'is_active']
    search_fields = ['code', 'title']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return qs.none()
            
        if user_has_any_role(user, ["admin", "archiviste"]):
            return qs
            
        if user_has_any_role(user, ["responsable", "employe"]):
            try:
                if hasattr(user, 'profile') and user.profile.direction:
                    # Filter for their specific direction calendars
                    # OR global calendars (if direction is null)
                    from django.db.models import Q
                    return qs.filter(Q(direction=user.profile.direction) | Q(direction__isnull=True))
            except Exception:
                pass
            return qs.none()
            
        return qs.none()
