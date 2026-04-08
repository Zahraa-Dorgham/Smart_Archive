from rest_framework import viewsets, filters, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import Role, Batiment, Salle, Armoire, Etagere, PhaseArchive, Transfert
from .serializers import (
    RoleSerializer, BatimentSerializer, SalleSerializer,
    ArmoireSerializer, EtagereSerializer, PhaseArchiveSerializer, TransfertSerializer
)
from .permissions import EstAdministrateur, EstArchiviste, EstEmploye, EstLectureAutorisee
from django.contrib.auth.models import Group
from .serializers import GroupSerializer
from .permissions import EstAdministrateur

from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

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
        permission_classes = [EstLectureAutorisee]  
     else:
        permission_classes = [EstArchiviste]  
     return [permission() for permission in permission_classes]


class BatimentViewSet(viewsets.ModelViewSet):
    queryset = Batiment.objects.all()
    serializer_class = BatimentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['nom', 'code', 'adresse']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            
            permission_classes = [EstLectureAutorisee]
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
            permission_classes = [EstLectureAutorisee]
        else:
            permission_classes = [EstArchiviste]
        return [permission() for permission in permission_classes]


class ArmoireViewSet(viewsets.ModelViewSet):
    queryset = Armoire.objects.all()
    serializer_class = ArmoireSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['salle']
    search_fields = ['code', 'code_barres']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [EstLectureAutorisee]
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
            permission_classes = [EstLectureAutorisee]
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
            permission_classes = [EstLectureAutorisee]
        else:
            permission_classes = [EstArchiviste]
        return [permission() for permission in permission_classes]
# archives/views.py
from .models import Boitier, Dossier, Document
from .serializers import BoitierSerializer, DossierSerializer, DocumentSerializer

class BoitierViewSet(viewsets.ModelViewSet):
    queryset = Boitier.objects.all().select_related('armoire', 'etagere')
    serializer_class = BoitierSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'armoire', 'etagere']
    search_fields = ['idboit', 'code_barre', 'titre']
    ordering_fields = ['idboit', 'date_creation', 'capacite']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [EstLectureAutorisee]
        else:
            permission_classes = [EstArchiviste]
        return [permission() for permission in permission_classes]
     
    def list(self, request, *args, **kwargs):
        print("Utilisateur:", request.user)
        print("Authentifié:", request.user.is_authenticated)
        return super().list(request, *args, **kwargs)

class DossierViewSet(viewsets.ModelViewSet):
    queryset = Dossier.objects.all().select_related('boitier', 'phase_archive')
    serializer_class = DossierSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'phase_archive', 'boitier', 'niveau_confidentialite']
    search_fields = ['idDossier', 'reference', 'titre']
    ordering_fields = ['date_creation', 'reference']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [EstLectureAutorisee]
        else:
            permission_classes = [EstArchiviste]
        return [permission() for permission in permission_classes]

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().select_related('dossier', 'phase_archive')
    serializer_class = DocumentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['phase_archive', 'dossier', 'type_document', 'niv_confidentialite']
    search_fields = ['idDoc', 'reference', 'titre', 'auteur']
    ordering_fields = ['date_creation', 'version']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
           permission_classes = [EstLectureAutorisee]
        else:
            permission_classes = [EstArchiviste]
        return [permission() for permission in permission_classes]
    
from .models import DemandeConsultation
from .serializers import DemandeConsultationSerializer
from .permissions import EstEmploye, EstResponsable 

class DemandeConsultationViewSet(viewsets.ModelViewSet):
    queryset = DemandeConsultation.objects.all()
    serializer_class = DemandeConsultationSerializer

    def get_permissions(self):
        # Seul l'employé peut créer une demande
        if self.action == 'create':
            return [EstEmploye()]
        return [EstEmploye()]  # ou une permission plus large
    
class TransfertViewSet(viewsets.ModelViewSet):
    queryset = Transfert.objects.all()
    serializer_class = TransfertSerializer
    permission_classes = [EstResponsable]  # ou EstArchiviste selon votre logique

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        transfert = self.get_object()
        transfert.statut = 'VALIDE'
        transfert.validateur = request.user
        transfert.date_validation = timezone.now()
        transfert.save()
        # Appliquer la logique métier (ex: déplacer le document, changer phase)
        return Response({'status': 'validé'})





# endpoints pour les utilisateurs 
from django.contrib.auth import get_user_model
from rest_framework import viewsets
from .serializers import UserSerializer
from .permissions import EstAdministrateur

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [EstAdministrateur]  # seul un admin peut y accéder