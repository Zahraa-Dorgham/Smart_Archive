# archives/views.py (version complète)

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

from .models import (
    Role, Direction, Batiment, Salle, Armoire, Etagere, PhaseArchive,
    ArchiveCourant, ArchiveIntermediaire, ArchiveDefinitive,
    Boitier, Dossier, Document, Transfert, TransfertBoitier,
    Consultation, 
    # DemandeConsultation, 
    Bordereau
)
from .serializers import (
    RoleSerializer, DirectionSerializer, BatimentSerializer, SalleSerializer, ArmoireSerializer,
    EtagereSerializer, PhaseArchiveSerializer, TransfertSerializer,
    ArchiveCourantSerializer, ArchiveIntermediaireSerializer, ArchiveDefinitiveSerializer,
    BoitierSerializer, DossierSerializer, DocumentSerializer,
    ConsultationSerializer, 
    # DemandeConsultationSerializer, 
    BordereauSerializer,
    GroupSerializer, UserSerializer
)
from .permissions import (
    EstAdministrateur, EstArchiviste, EstEmploye, EstLectureAutorisee, EstResponsable
)

User = get_user_model()

# ========== GROUPES ==========
class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [EstAdministrateur]

# ========== UTILISATEURS ==========
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [EstAdministrateur]

# ========== RÔLES ==========
class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['nom', 'description']
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]


# ========== DIRECTIONS ==========
class DirectionViewSet(viewsets.ModelViewSet):
    queryset = Direction.objects.all()
    serializer_class = DirectionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['nom', 'code']
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]

# ========== BÂTIMENTS, SALLES, ARMOIRES, ÉTAGÈRES ==========
class BatimentViewSet(viewsets.ModelViewSet):
    queryset = Batiment.objects.all()
    serializer_class = BatimentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['nom', 'code', 'adresse']
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]

class SalleViewSet(viewsets.ModelViewSet):
    queryset = Salle.objects.all()
    serializer_class = SalleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['batiment', 'etage']
    search_fields = ['nom', 'code']
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]

class ArmoireViewSet(viewsets.ModelViewSet):
    queryset = Armoire.objects.all()
    serializer_class = ArmoireSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['salle']
    search_fields = ['code', 'code_barres']
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]

class EtagereViewSet(viewsets.ModelViewSet):
    queryset = Etagere.objects.all()
    serializer_class = EtagereSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['armoire']
    search_fields = ['code_barres']
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]

# ========== PHASES D'ARCHIVAGE (GÉNÉRIQUE + SPÉCIFIQUES) ==========
class PhaseArchiveViewSet(viewsets.ModelViewSet):
    queryset = PhaseArchive.objects.all()
    serializer_class = PhaseArchiveSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nom']
    ordering_fields = ['idphase', 'nom']
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]

class ArchiveCourantViewSet(viewsets.ModelViewSet):
    queryset = ArchiveCourant.objects.all()
    serializer_class = ArchiveCourantSerializer
    permission_classes = [EstArchiviste]

class ArchiveIntermediaireViewSet(viewsets.ModelViewSet):
    queryset = ArchiveIntermediaire.objects.all()
    serializer_class = ArchiveIntermediaireSerializer
    permission_classes = [EstArchiviste]

class ArchiveDefinitiveViewSet(viewsets.ModelViewSet):
    queryset = ArchiveDefinitive.objects.all()
    serializer_class = ArchiveDefinitiveSerializer
    permission_classes = [EstArchiviste]

# ========== BOÎTIERS ==========
class BoitierViewSet(viewsets.ModelViewSet):
    queryset = Boitier.objects.all().select_related('armoire', 'etagere')
    serializer_class = BoitierSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'armoire', 'etagere']
    search_fields = ['idboit', 'code_barre', 'titre']
    ordering_fields = ['idboit', 'date_creation', 'capacite']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]

    @action(detail=True, methods=['post'])
    def ajouter_dossier(self, request, pk=None):
        boitier = self.get_object()
        dossier_id = request.data.get('dossier_id')
        try:
            dossier = Dossier.objects.get(idDossier=dossier_id)
            success, message = boitier.ajouter_dossier(dossier)
            if success:
                return Response({'message': message})
            return Response({'error': message}, status=400)
        except Dossier.DoesNotExist:
            return Response({'error': 'Dossier non trouvé'}, status=404)

    @action(detail=True, methods=['post'])
    def retirer_dossier(self, request, pk=None):
        boitier = self.get_object()
        dossier_id = request.data.get('dossier_id')
        try:
            dossier = Dossier.objects.get(idDossier=dossier_id)
            success, message = boitier.retirer_dossier(dossier)
            if success:
                return Response({'message': message})
            return Response({'error': message}, status=400)
        except Dossier.DoesNotExist:
            return Response({'error': 'Dossier non trouvé'}, status=404)

# ========== DOSSIERS ==========
class DossierViewSet(viewsets.ModelViewSet):
    queryset = Dossier.objects.all().select_related('boitier', 'calendrier', 'phaseArchive')
    serializer_class = DossierSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['phaseArchive', 'boitier', 'calendrier']
    search_fields = ['idDossier', 'nomDos']
    ordering_fields = ['date_creation']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                # Afficher les erreurs de validation en détail
                return Response({'errors': serializer.errors}, status=400)
            serializer.save()
            return Response(serializer.data, status=201)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception(f"Error creating dossier: {str(e)}")
            return Response({'error': str(e), 'type': type(e).__name__}, status=400)

    @action(detail=True, methods=['post'])
    def ajouter_document(self, request, pk=None):
        dossier = self.get_object()
        doc_id = request.data.get('document_id')
        try:
            document = Document.objects.get(idDoc=doc_id)
            success, message = dossier.ajouter_document(document)
            if success:
                return Response({'message': message})
            return Response({'error': message}, status=400)
        except Document.DoesNotExist:
            return Response({'error': 'Document non trouvé'}, status=404)

    @action(detail=True, methods=['post'])
    def lier_boitier(self, request, pk=None):
        dossier = self.get_object()
        boitier_id = request.data.get('boitier_id')
        try:
            boitier = Boitier.objects.get(idboit=boitier_id)
            success, message = dossier.lier_boitier(boitier)
            if success:
                return Response({'message': message})
            return Response({'error': message}, status=400)
        except Boitier.DoesNotExist:
            return Response({'error': 'Boîtier non trouvé'}, status=404)

# ========== DOCUMENTS ==========
class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().select_related('dossier', 'phase_archive', 'calendrier')
    serializer_class = DocumentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['phase_archive', 'dossier', 'type_document', 'niv_confidentialite', 'calendrier']
    search_fields = ['idDoc', 'reference', 'titre', 'auteur']
    ordering_fields = ['date_creation', 'version']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                # Afficher les erreurs de validation en détail
                return Response({'errors': serializer.errors}, status=400)
            serializer.save()
            return Response(serializer.data, status=201)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception(f"Error creating document: {str(e)}")
            return Response({'error': str(e), 'type': type(e).__name__}, status=400)

    @action(detail=True, methods=['post'])
    def changer_phase(self, request, pk=None):
        document = self.get_object()
        phase_id = request.data.get('phase_id')
        try:
            nouvelle_phase = PhaseArchive.objects.get(idphase=phase_id)
            success, message = document.changer_phase(nouvelle_phase)
            if success:
                return Response({'message': message})
            return Response({'error': message}, status=400)
        except PhaseArchive.DoesNotExist:
            return Response({'error': 'Phase non trouvée'}, status=404)

    @action(detail=True, methods=['post'])
    def consulter(self, request, pk=None):
        document = self.get_object()
        document.consulter(utilisateur=request.user)
        return Response({'message': 'Consultation enregistrée'})

# ========== CONSULTATIONS (diagramme) ==========
class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = Consultation.objects.all()
    serializer_class = ConsultationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['document', 'allitemsReturned']
    search_fields = ['direction', 'poste']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]

# ========== DEMANDES DE CONSULTATION (modèle existant) ==========
# class DemandeConsultationViewSet(viewsets.ModelViewSet):
#     queryset = DemandeConsultation.objects.all()
#     serializer_class = DemandeConsultationSerializer
#     def get_permissions(self):
#         if self.action == 'create':
#             return [EstEmploye()]
#         return [EstEmploye()]  # à affiner selon vos besoins

# ========== TRANSFERTS ==========
class TransfertViewSet(viewsets.ModelViewSet):
    queryset = Transfert.objects.all().prefetch_related('transfert_boitiers__boitier')
    serializer_class = TransfertSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'typeTransfer']
    search_fields = ['reference', 'bordereauxReference']
    ordering_fields = ['date_demande', 'date_execution', 'reference']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstResponsable()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)
        serializer.save()
        return Response(serializer.data, status=201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def available_boitiers(self, request):
        transfert_id = request.query_params.get('transfert_id')
        linked_boitiers = TransfertBoitier.objects.all()

        if transfert_id:
            linked_boitiers = linked_boitiers.exclude(transfert_id=transfert_id)
            current_ids = list(
                TransfertBoitier.objects.filter(transfert_id=transfert_id).values_list('boitier_id', flat=True)
            )
        else:
            current_ids = []

        unavailable_ids = list(linked_boitiers.values_list('boitier_id', flat=True))
        boitiers = Boitier.objects.filter(
            Q(id__in=current_ids) | ~Q(id__in=unavailable_ids)
        ).distinct().order_by('idboit')

        return Response(BoitierSerializer(boitiers, many=True).data)

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        transfert = self.get_object()
        transfert.statut = 'VALIDE'
        # Si vous avez un champ 'validateur', décommentez :
        # transfert.validateur = request.user
        transfert.date_execution = timezone.now()
        transfert.save()
        # Logique métier supplémentaire (changement de phase, etc.)
        return Response({'status': 'validé'})

# ========== BORDEREAUX ==========
class BordereauViewSet(viewsets.ModelViewSet):
    queryset = Bordereau.objects.all()
    serializer_class = BordereauSerializer
    permission_classes = [EstArchiviste]
