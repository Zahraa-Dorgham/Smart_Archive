# archives/views.py (version complète)

import json

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.http import HttpResponse
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
from .gemini_service import GeminiDocumentExtractionError, GeminiDocumentExtractionService
from .pdf_utils import SimplePdfDocument

User = get_user_model()

# ========== GROUPES ==========
class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [EstAdministrateur]

# ========== UTILISATEURS ==========
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related('profile', 'profile__direction').prefetch_related('groups', 'user_permissions')
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

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser], url_path='extract-metadata')
    def extract_metadata(self, request):
        dossier_id = request.data.get('dossier')
        uploaded_file = request.FILES.get('file')
        dossier_options_raw = request.data.get('dossiers')

        if not uploaded_file:
            return Response({'error': 'Aucun fichier a analyser n a ete envoye.'}, status=400)

        dossier = None
        if dossier_id:
            try:
                dossier = Dossier.objects.select_related('calendrier').get(idDossier=dossier_id)
            except Dossier.DoesNotExist:
                return Response({'error': 'Dossier introuvable.'}, status=404)

        dossier_options = None
        if dossier_options_raw:
            try:
                dossier_options = json.loads(dossier_options_raw)
            except json.JSONDecodeError:
                return Response({'error': 'La liste des dossiers envoyee est invalide.'}, status=400)

        try:
            extraction_service = GeminiDocumentExtractionService()
            extracted = extraction_service.extract_document_metadata(uploaded_file, dossier, dossier_options=dossier_options)
            return Response(extracted)
        except GeminiDocumentExtractionError as exc:
            return Response({'error': str(exc)}, status=400)
        except Exception as exc:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception(f"Error extracting document metadata: {str(exc)}")
            return Response({'error': 'Erreur pendant l analyse du fichier.', 'type': type(exc).__name__}, status=500)

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
        if self.action in ['list', 'retrieve', 'bordereau_pdf']:
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
        transfer_type = request.query_params.get('type_transfer')
        linked_boitiers = TransfertBoitier.objects.all()

        current_ids = []
        if transfert_id:
            current_ids = list(
                TransfertBoitier.objects.filter(transfert_id=transfert_id).values_list('boitier_id', flat=True)
            )

        if transfer_type:
            linked_boitiers = linked_boitiers.filter(transfert__typeTransfer=transfer_type)

        if transfert_id:
            linked_boitiers = linked_boitiers.exclude(transfert_id=transfert_id)

        unavailable_ids = list(linked_boitiers.values_list('boitier_id', flat=True))
        available_filter = ~Q(id__in=unavailable_ids)
        if current_ids:
            available_filter = Q(id__in=current_ids) | available_filter

        boitiers = Boitier.objects.filter(available_filter).distinct().order_by('idboit')

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

    @action(detail=True, methods=['get'])
    def bordereau_pdf(self, request, pk=None):
        transfert = (
            Transfert.objects.filter(pk=pk)
            .prefetch_related('transfert_boitiers__boitier__dossiers__documents')
            .first()
        )

        if transfert is None:
            return Response({'error': 'Transfert introuvable.'}, status=404)

        if transfert.statut != 'VALIDE':
            return Response({'error': 'Le bordereau ne peut etre genere que pour un transfert valide.'}, status=400)

        tree = self._build_bordereau_tree(transfert)
        pdf_bytes = self._build_bordereau_pdf(transfert, tree)
        filename = f"bordereau_transfert_{transfert.reference or transfert.id}.pdf"

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response

    def _build_bordereau_tree(self, transfert):
        tree = []

        for link in (
            transfert.transfert_boitiers.select_related('boitier')
            .prefetch_related('boitier__dossiers__documents')
            .all()
        ):
            boitier = link.boitier
            dossiers = []

            for dossier in boitier.dossiers.all().order_by('idDossier'):
                dossiers.append({
                    'idDossier': dossier.idDossier,
                    'nomDos': dossier.nomDos,
                    'documents': list(dossier.documents.all().order_by('idDoc')),
                })

            tree.append({
                'id': boitier.id,
                'idboit': boitier.idboit,
                'titre': boitier.titre,
                'dossiers': dossiers,
            })

        return tree

    def _build_bordereau_pdf(self, transfert, tree):
        page_width = 595
        page_height = 842
        margin_left = 40
        margin_right = 40
        top_start = 790
        bottom_limit = 70
        line_height = 16

        document = SimplePdfDocument(title=f"Bordereau {transfert.reference or transfert.id}")
        pages = []
        current_lines = []
        y = top_start

        def format_dt(value):
            if not value:
                return '-'
            local_value = timezone.localtime(value) if timezone.is_aware(value) else value
            return local_value.strftime('%d/%m/%Y %H:%M')

        def truncate(value, limit=95):
            text = (value or '').strip()
            if len(text) <= limit:
                return text
            return text[: limit - 3] + '...'

        def push_page():
            nonlocal current_lines, y
            current_lines.append((margin_left, 40, 'Unite responsable'))
            current_lines.append((page_width - margin_right - 65, 40, 'Archiviste'))
            pages.append(current_lines)
            current_lines = []
            y = top_start

        def add_line(text, x=margin_left):
            nonlocal y
            if y < bottom_limit:
                push_page()
            current_lines.append((x, y, text))
            y -= line_height

        add_line('BORDEREAU DE TRANSFERT')
        y -= 8
        add_line(f"Reference : {transfert.reference or f'TR-{transfert.id}'}")
        add_line(f"Type : {transfert.typeTransfer or '-'}")
        add_line(f"Date demande : {format_dt(transfert.date_demande)}")
        add_line(f"Date execution : {format_dt(transfert.date_execution)}")
        y -= 8
        add_line('Arborescence du contenu')
        add_line('-' * 72)

        if not tree:
            add_line('Aucun boitier lie a ce transfert.')
        else:
            for boitier in tree:
                add_line(f"Boitier : {boitier['idboit']} - {truncate(boitier['titre'], 68)}")
                if not boitier['dossiers']:
                    add_line('  Aucun dossier lie.')
                    continue

                for dossier in boitier['dossiers']:
                    add_line(f"  Dossier : #{dossier['idDossier']} - {truncate(dossier['nomDos'] or 'Sans nom', 63)}")
                    if not dossier['documents']:
                        add_line('    Aucun document lie.')
                        continue

                    for doc in dossier['documents']:
                        doc_ref = doc.reference or doc.idDoc or str(doc.pk)
                        add_line(f"    Document : {truncate(f'{doc_ref} - {doc.titre}', 70)}")

        push_page()

        for page_lines in pages:
            document.add_page(page_lines, page_width=page_width, page_height=page_height)

        return document.render()

# ========== BORDEREAUX ==========
class BordereauViewSet(viewsets.ModelViewSet):
    queryset = Bordereau.objects.all()
    serializer_class = BordereauSerializer
    permission_classes = [EstArchiviste]

# ========== DASHBOARD STATS ==========
from django.db.models import Count

class DashboardStatsView(viewsets.ViewSet):
    permission_classes = [EstLectureAutorisee]

    def list(self, request):
        # 1. Total users
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()

        # 2. Stats per Batiment
        batiment_stats = []
        batiments = Batiment.objects.all()

        for bat in batiments:
            # We need to count dossiers/documents linked to this batiment
            # Path: Batiment -> Salle -> Armoire -> Boitier -> Dossier -> Document
            # Also Boitier -> Dossier
            
            # Count boitiers in this batiment
            boitier_count = Boitier.objects.filter(armoire__salle__batiment=bat).count()
            
            # Count dossiers in this batiment
            dossier_count = Dossier.objects.filter(boitier__armoire__salle__batiment=bat).count()
            
            # Count documents in this batiment
            document_count = Document.objects.filter(dossier__boitier__armoire__salle__batiment=bat).count()

            batiment_stats.append({
                'id': bat.id,
                'nom': bat.nom,
                'code': bat.code,
                'boitiers': boitier_count,
                'dossiers': dossier_count,
                'documents': document_count
            })

        # 3. Global totals
        global_stats = {
            'total_documents': Document.objects.count(),
            'total_dossiers': Dossier.objects.count(),
            'total_boitiers': Boitier.objects.count(),
            'total_batiments': batiments.count(),
            'total_users': total_users,
            'active_users': active_users
        }

        return Response({
            'global': global_stats,
            'batiments': batiment_stats
        })
