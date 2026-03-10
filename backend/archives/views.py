from rest_framework import viewsets, filters, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import Role, Batiment, Salle, Armoire, Etagere, PhaseArchive
from .serializers import (
    RoleSerializer, BatimentSerializer, SalleSerializer,
    ArmoireSerializer, EtagereSerializer, PhaseArchiveSerializer
)
from .permissions import EstAdministrateur, EstArchiviste, EstEmploye
from django.contrib.auth.models import Group
from .serializers import GroupSerializer
from .permissions import EstAdministrateur

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [EstAdministrateur]

    
class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['nom', 'description']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [EstEmploye]
        else:
            permission_classes = [EstAdministrateur]
        return [permission() for permission in permission_classes]


class BatimentViewSet(viewsets.ModelViewSet):
    queryset = Batiment.objects.all()
    serializer_class = BatimentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['nom', 'code', 'adresse']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [EstEmploye]
        else:
            permission_classes = [EstArchiviste]
        return [permission() for permission in permission_classes]


class SalleViewSet(viewsets.ModelViewSet):
    queryset = Salle.objects.all()
    serializer_class = SalleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['batiment', 'etage']
    search_fields = ['nom', 'code']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [EstEmploye]
        else:
            permission_classes = [EstArchiviste]
        return [permission() for permission in permission_classes]


class ArmoireViewSet(viewsets.ModelViewSet):
    queryset = Armoire.objects.all()
    serializer_class = ArmoireSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['salle', 'type_armoire']
    search_fields = ['code', 'code_barres']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [EstEmploye]
        else:
            permission_classes = [EstArchiviste]
        return [permission() for permission in permission_classes]


class EtagereViewSet(viewsets.ModelViewSet):
    queryset = Etagere.objects.all()
    serializer_class = EtagereSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['armoire']
    search_fields = ['code_barres']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [EstEmploye]
        else:
            permission_classes = [EstArchiviste]
        return [permission() for permission in permission_classes]


class PhaseArchiveViewSet(viewsets.ModelViewSet):
    queryset = PhaseArchive.objects.all()
    serializer_class = PhaseArchiveSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nom', 'code']
    ordering_fields = ['ordre', 'nom']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [EstEmploye]
        else:
            permission_classes = [EstArchiviste]
        return [permission() for permission in permission_classes]
    