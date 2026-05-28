# archives/views.py (version complète)

import json
from datetime import date
from io import BytesIO
from pathlib import Path

from rest_framework import viewsets, filters, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Q, Count
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

from .models import (
    Role, Direction, Batiment, Salle, Armoire, Etagere, PhaseArchive,
    ArchiveCourant, ArchiveIntermediaire, ArchiveDefinitive,
    Boitier, Dossier, Document, Transfert, TransfertBoitier,
    Consultation, LoginHistory,
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
    EstAdministrateur, EstArchiviste, EstEmploye, EstLectureAutorisee, EstResponsableValidateur,
    user_has_any_role
)
from .gemini_service import GeminiDocumentExtractionError, GeminiDocumentExtractionService
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

User = get_user_model()

# ========== GROUPES ==========
class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [EstAdministrateur]

# ========== UTILISATEURS ==========
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related('profile', 'profile__direction').prefetch_related('groups', 'user_permissions').order_by('id')
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
        return [EstEmploye()]


# ========== DIRECTIONS ==========
class DirectionViewSet(viewsets.ModelViewSet):
    queryset = Direction.objects.all()
    serializer_class = DirectionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['nom', 'code']
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstEmploye()]

# ========== BÂTIMENTS, SALLES, ARMOIRES, ÉTAGÈRES ==========
class BatimentViewSet(viewsets.ModelViewSet):
    queryset = Batiment.objects.all()
    serializer_class = BatimentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['nom', 'code', 'adresse']
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstEmploye()]

class SalleViewSet(viewsets.ModelViewSet):
    queryset = Salle.objects.all()
    serializer_class = SalleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['batiment', 'etage']
    search_fields = ['nom', 'code']
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstEmploye()]

class ArmoireViewSet(viewsets.ModelViewSet):
    queryset = Armoire.objects.all()
    serializer_class = ArmoireSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['salle']
    search_fields = ['code', 'code_barres']
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstEmploye()]

class EtagereViewSet(viewsets.ModelViewSet):
    queryset = Etagere.objects.all()
    serializer_class = EtagereSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['armoire']
    search_fields = ['code_barres']
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstEmploye()]

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
        return [EstEmploye()]

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
                    # Un boîtier est visible si au moins un de ses dossiers appartient à la direction
                    # OU si le boîtier lui-même est lié à la direction (si on ajoute le champ plus tard)
                    return qs.filter(dossiers__direction=user.profile.direction).distinct()
            except Exception:
                pass
            return qs.none()
            
        return qs.none() # Par défaut, rien si non admin/archiviste/responsable/employe

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstEmploye()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.dossiers.exists():
            return Response(
                {"error": "Suppression impossible car ce boîtier contient des dossiers."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

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
    def perform_create(self, serializer):
        user = self.request.user
        if user_has_any_role(user, ["responsable", "employe"]) and not user.is_superuser:
            if hasattr(user, "profile") and user.profile.direction:
                serializer.save(direction=user.profile.direction)
            else:
                serializer.save()
        else:
            serializer.save()
    queryset = Dossier.objects.all().select_related('boitier', 'calendrier', 'phaseArchive')
    serializer_class = DossierSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['phaseArchive', 'boitier', 'calendrier']
    search_fields = ['idDossier', 'nomDos']
    ordering_fields = ['date_creation']

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
                    direction = user.profile.direction
                    return qs.filter(Q(direction=direction) | Q(calendrier__direction=direction)).distinct()
            except Exception:
                pass
            return qs.none()
            
        return qs.none()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstEmploye()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.documents.exists():
            return Response(
                {"error": "Suppression impossible car ce dossier contient des documents."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

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
    def perform_create(self, serializer):
        user = self.request.user
        if user_has_any_role(user, ["responsable", "employe"]) and not user.is_superuser:
            if hasattr(user, "profile") and user.profile.direction:
                serializer.save(direction=user.profile.direction)
            else:
                serializer.save()
        else:
            serializer.save()
    queryset = Document.objects.all().select_related('dossier', 'phase_archive', 'calendrier')
    serializer_class = DocumentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['phase_archive', 'dossier', 'type_document', 'niv_confidentialite', 'calendrier']
    search_fields = ['idDoc', 'reference', 'titre', 'auteur']
    ordering_fields = ['date_creation', 'version']

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
                    direction = user.profile.direction
                    return qs.filter(Q(direction=direction) | Q(calendrier__direction=direction)).distinct()
            except Exception:
                pass
            return qs.none()
            
        return qs.none()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [EstLectureAutorisee()]
        return [EstEmploye()]

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
        return [EstEmploye()]

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
    queryset = Transfert.objects.all().select_related('archiviste', 'responsable').prefetch_related('transfert_boitiers__boitier')
    serializer_class = TransfertSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['statut', 'typeTransfer']
    search_fields = ['reference', 'bordereauxReference']
    ordering_fields = ['date_demande', 'date_execution', 'reference']

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
                    direction = user.profile.direction
                    return qs.filter(
                        Q(transfert_boitiers__boitier__dossiers__direction=direction) |
                        Q(transfert_boitiers__boitier__dossiers__calendrier__direction=direction) |
                        Q(responsable=user)
                    ).distinct()
            except Exception:
                pass
            return qs.none()
        
        return qs.none()

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'bordereau_pdf']:
            return [EstLectureAutorisee()]
        if self.action == 'valider':
            return [EstResponsableValidateur()]
        return [EstEmploye()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)
        serializer.save(archiviste=request.user)
        return Response(serializer.data, status=201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=400)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.statut == 'VALIDE':
            return Response({'error': 'Un transfert valide ne peut pas etre supprime.'}, status=400)
        return super().destroy(request, *args, **kwargs)

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
        transfert.responsable = request.user
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
        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        page_width, page_height = A4
        logo_path = Path(__file__).resolve().parent / 'assets' / 'logo-brord.png'

        left_margin = 25 * mm
        right_margin = 25 * mm
        table_left = 25 * mm
        table_bottom = 55 * mm
        table_width = page_width - (50 * mm)
        table_height = 95 * mm
        table_title_height = 8 * mm
        table_column_header_height = 8 * mm
        content_padding = 4 * mm
        row_padding = 1.5 * mm
        row_line_height = 5 * mm
        col_widths = [0.30 * table_width, 0.33 * table_width, 0.37 * table_width]
        col_x = [
            table_left,
            table_left + col_widths[0],
            table_left + col_widths[0] + col_widths[1],
            table_left + table_width,
        ]

        def format_dt(value):
            if not value:
                return ''
            local_value = timezone.localtime(value) if timezone.is_aware(value) else value
            return local_value.strftime('%d/%m/%Y %H:%M')

        def draw_header():
            pdf.setFont('Helvetica-Bold', 14)
            pdf.drawString(left_margin, page_height - 32 * mm, "Entreprise Tunisienne d'Activites")
            pdf.drawString(left_margin, page_height - 44 * mm, 'Petrolieres')

            if logo_path.exists():
                pdf.drawImage(
                    str(logo_path),
                    page_width - right_margin - (22 * mm),
                    page_height - 36 * mm,
                    width=18 * mm,
                    height=18 * mm,
                    preserveAspectRatio=True,
                    mask='auto'
                )

            pdf.setFont('Helvetica-Bold', 24)
            pdf.drawCentredString(page_width / 2, page_height - 70 * mm, 'BORDEREAU DE TRANSFERT')

            pdf.setFont('Helvetica', 16)
            start_y = page_height - 92 * mm
            line_gap = 12 * mm
            pdf.drawString(left_margin, start_y, f"Reference : {transfert.reference or f'TR-{transfert.id}'}")
            pdf.drawString(left_margin, start_y - line_gap, f"Type : {transfert.typeTransfer or ''}")
            pdf.drawString(left_margin, start_y - (2 * line_gap), f"Date demande : {format_dt(transfert.date_demande)}")
            pdf.drawString(left_margin, start_y - (3 * line_gap), f"Date execution : {format_dt(transfert.date_execution)}")

        def draw_footer():
            pdf.setFont('Helvetica-Bold', 14)
            pdf.drawString(left_margin, 48 * mm, 'Unite responsable')
            pdf.drawRightString(page_width - right_margin, 48 * mm, 'Archiviste')

        def draw_table_shell():
            pdf.rect(table_left, table_bottom, table_width, table_height, stroke=1, fill=0)
            pdf.line(
                table_left,
                table_bottom + table_height - table_title_height,
                table_left + table_width,
                table_bottom + table_height - table_title_height
            )
            pdf.line(
                table_left,
                table_bottom + table_height - table_title_height - table_column_header_height,
                table_left + table_width,
                table_bottom + table_height - table_title_height - table_column_header_height
            )
            pdf.line(
                col_x[1],
                table_bottom,
                col_x[1],
                table_bottom + table_height - table_title_height
            )
            pdf.line(
                col_x[2],
                table_bottom,
                col_x[2],
                table_bottom + table_height - table_title_height
            )
            pdf.setFont('Helvetica-Bold', 13)
            pdf.drawCentredString(
                table_left + (table_width / 2),
                table_bottom + table_height - (table_title_height / 2) - 4,
                'Details du transfert'
            )
            pdf.setFont('Helvetica-Bold', 11)
            header_y = table_bottom + table_height - table_title_height - (table_column_header_height / 2) - 3
            pdf.drawCentredString((col_x[0] + col_x[1]) / 2, header_y, 'Boitier')
            pdf.drawCentredString((col_x[1] + col_x[2]) / 2, header_y, 'Dossier')
            pdf.drawCentredString((col_x[2] + col_x[3]) / 2, header_y, 'Document')

        def wrap_line(text, font_name, font_size, max_width):
            words = text.split()
            if not words:
                return ['']

            lines = []
            current = words[0]
            for word in words[1:]:
                candidate = f'{current} {word}'
                if pdf.stringWidth(candidate, font_name, font_size) <= max_width:
                    current = candidate
                else:
                    lines.append(current)
                    current = word
            lines.append(current)
            return lines

        data_rows = []
        if not tree:
            data_rows.append({
                'boitier_key': '__empty__',
                'dossier_key': '__empty__',
                'boitier': 'Aucun boitier lie a ce transfert.',
                'dossier': '',
                'document': '',
            })
        else:
            for boitier in tree:
                boitier_label = f"{boitier['idboit']} - {boitier['titre'] or ''}".strip(' -')
                if not boitier['dossiers']:
                    data_rows.append({
                        'boitier_key': f"b-{boitier['id']}",
                        'dossier_key': f"b-{boitier['id']}-empty",
                        'boitier': boitier_label,
                        'dossier': 'Aucun dossier lie.',
                        'document': '',
                    })
                    continue
                for dossier in boitier['dossiers']:
                    dossier_label = f"#{dossier['idDossier']} - {dossier['nomDos'] or 'Sans nom'}"
                    if not dossier['documents']:
                        data_rows.append({
                            'boitier_key': f"b-{boitier['id']}",
                            'dossier_key': f"d-{dossier['idDossier']}",
                            'boitier': boitier_label,
                            'dossier': dossier_label,
                            'document': 'Aucun document lie.',
                        })
                        continue
                    for doc in dossier['documents']:
                        doc_ref = doc.reference or doc.idDoc or str(doc.pk)
                        data_rows.append({
                            'boitier_key': f"b-{boitier['id']}",
                            'dossier_key': f"d-{dossier['idDossier']}",
                            'boitier': boitier_label,
                            'dossier': dossier_label,
                            'document': f"{doc_ref} - {doc.titre}",
                        })

        pdf.setTitle(f"Bordereau {transfert.reference or transfert.id}")
        content_top = table_bottom + table_height - table_title_height - table_column_header_height - content_padding
        content_bottom = table_bottom + content_padding

        def start_page():
            draw_header()
            draw_table_shell()
            draw_footer()
            return content_top

        font_name = 'Helvetica'
        font_size = 10.5
        prepared_rows = []
        for row in data_rows:
            boitier_lines = wrap_line(row['boitier'], font_name, font_size, col_widths[0] - (2 * content_padding))
            dossier_lines = wrap_line(row['dossier'], font_name, font_size, col_widths[1] - (2 * content_padding))
            document_lines = wrap_line(row['document'], font_name, font_size, col_widths[2] - (2 * content_padding))
            line_count = max(len(boitier_lines), len(dossier_lines), len(document_lines), 1)
            prepared_rows.append({
                **row,
                'boitier_lines': boitier_lines,
                'dossier_lines': dossier_lines,
                'document_lines': document_lines,
                'height': max((line_count * row_line_height) + row_padding, 7 * mm),
            })

        page_chunks = []
        current_chunk = []
        current_height = 0
        max_chunk_height = content_top - content_bottom
        for row in prepared_rows:
            if current_chunk and current_height + row['height'] > max_chunk_height:
                page_chunks.append(current_chunk)
                current_chunk = []
                current_height = 0
            current_chunk.append(row)
            current_height += row['height']
        if current_chunk:
            page_chunks.append(current_chunk)

        for page_index, rows_chunk in enumerate(page_chunks):
            if page_index > 0:
                pdf.showPage()

            y = start_page()
            pdf.setFont(font_name, font_size)

            for row_index, row in enumerate(rows_chunk):
                next_row = rows_chunk[row_index + 1] if row_index + 1 < len(rows_chunk) else None
                row_top = y
                row_bottom = y - row['height']
                text_y_start = row_top - row_line_height + 1

                show_boitier = row_index == 0 or rows_chunk[row_index - 1]['boitier_key'] != row['boitier_key']
                show_dossier = row_index == 0 or rows_chunk[row_index - 1]['dossier_key'] != row['dossier_key']

                if show_boitier:
                    text_y = text_y_start
                    for line in row['boitier_lines']:
                        pdf.drawString(col_x[0] + content_padding, text_y, line)
                        text_y -= row_line_height

                if show_dossier:
                    text_y = text_y_start
                    for line in row['dossier_lines']:
                        pdf.drawString(col_x[1] + content_padding, text_y, line)
                        text_y -= row_line_height

                text_y = text_y_start
                for line in row['document_lines']:
                    pdf.drawString(col_x[2] + content_padding, text_y, line)
                    text_y -= row_line_height

                if next_row is not None:
                    if next_row['boitier_key'] != row['boitier_key']:
                        pdf.line(table_left, row_bottom, table_left + table_width, row_bottom)
                    elif next_row['dossier_key'] != row['dossier_key']:
                        pdf.line(col_x[1], row_bottom, table_left + table_width, row_bottom)
                    else:
                        pdf.line(col_x[2], row_bottom, table_left + table_width, row_bottom)

                y = row_bottom

        pdf.save()
        return buffer.getvalue()

# ========== BORDEREAUX ==========
class BordereauViewSet(viewsets.ModelViewSet):
    queryset = Bordereau.objects.all()
    serializer_class = BordereauSerializer
    permission_classes = [EstArchiviste]

# ========== DASHBOARD STATS ==========
from django.db.models import Count

class DashboardStatsView(viewsets.ViewSet):
    permission_classes = [EstLectureAutorisee]

    def _add_months(self, value, months):
        month = value.month - 1 + months
        year = value.year + month // 12
        month = month % 12 + 1
        return date(year, month, 1)

    def _document_evolution(self, doc_qs=None):
        if doc_qs is None:
            doc_qs = Document.objects.all()
        today = timezone.localdate()
        current_month = date(today.year, today.month, 1)
        first_month = self._add_months(current_month, -11)
        months = [self._add_months(first_month, index) for index in range(12)]
        documents_before = doc_qs.filter(date_creation__lt=first_month).count()
        cumulative = documents_before
        evolution = []

        for month_start in months:
            next_month = self._add_months(month_start, 1)
            total = doc_qs.filter(
                date_creation__gte=month_start,
                date_creation__lt=next_month
            ).count()
            cumulative += total
            evolution.append({
                'period': month_start.isoformat(),
                'label': month_start.strftime('%m/%Y'),
                'total': total,
                'cumulative': cumulative
            })

        return evolution

    def _dashboard_scope(self, user):
        for scope in ['admin', 'archiviste', 'responsable', 'employe']:
            if user_has_any_role(user, [scope]):
                return scope
        return 'employe'

    def _get_user_direction(self, user):
        try:
            if hasattr(user, 'profile') and user.profile and user.profile.direction:
                return user.profile.direction
        except Exception:
            pass
        return None

    # ────────────────── ADMIN DASHBOARD ──────────────────
    def _build_admin_dashboard(self, request):
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        users_with_login = LoginHistory.objects.values('user').distinct().count()

        total_documents = Document.objects.count()
        total_dossiers = Dossier.objects.count()
        total_boitiers = Boitier.objects.count()
        total_salles = Salle.objects.count()
        total_armoires = Armoire.objects.count()
        total_etageres = Etagere.objects.count()
        total_transferts = Transfert.objects.count()
        pending_transfers = Transfert.objects.filter(statut='EN_ATTENTE').count()

        total_capacity = sum(Etagere.objects.values_list('capacite_max_boites', flat=True))
        occupied_locations = Boitier.objects.filter(etagere__isnull=False).count()
        empty_locations = max(total_capacity - occupied_locations, 0)
        empty_location_percentage = round((empty_locations / total_capacity) * 100, 1) if total_capacity else 0

        batiment_stats = self._build_batiment_stats()

        phase_distribution = self._build_phase_distribution()

        transfer_status = [
            {'statut': item['statut'] or 'NON_RENSEIGNE', 'total': item['total']}
            for item in Transfert.objects.values('statut').annotate(total=Count('id')).order_by('statut')
        ]

        recent_transfers = self._serialize_transfers(Transfert.objects.all(), limit=8)
        pending_transfer_list = self._serialize_transfers(Transfert.objects.filter(statut='EN_ATTENTE'), limit=6, include_statut=False)

        recent_logins = [
            {
                'id': login.id,
                'user_id': login.user_id,
                'username': login.user.username,
                'full_name': login.user.get_full_name() or login.user.username,
                'last_login': login.login_at,
                'ip_address': login.ip_address,
                'user_agent': login.user_agent,
                'is_active': login.user.is_active
            }
            for login in LoginHistory.objects.select_related('user').order_by('-login_at')[:8]
        ]

        document_evolution = self._document_evolution()

        batiments = Batiment.objects.all()
        global_stats = {
            'total_documents': total_documents,
            'total_dossiers': total_dossiers,
            'total_boitiers': total_boitiers,
            'total_transferts': total_transferts,
            'transferts_en_attente': pending_transfers,
            'total_batiments': batiments.count(),
            'total_salles': total_salles,
            'total_armoires': total_armoires,
            'total_etageres': total_etageres,
            'capacite_emplacements': total_capacity,
            'emplacements_occupes': occupied_locations,
            'emplacements_vides': empty_locations,
            'pourcentage_emplacements_vides': empty_location_percentage,
            'total_users': total_users,
            'active_users': active_users,
            'users_with_login': users_with_login,
            'total_logins': LoginHistory.objects.count()
        }

        return {
            'scope': 'admin',
            'global': global_stats,
            'batiments': batiment_stats,
            'phases': phase_distribution,
            'transferts': {
                'status': transfer_status,
                'recent': recent_transfers,
                'pending': pending_transfer_list
            },
            'logins': recent_logins,
            'document_evolution': document_evolution
        }

    # ────────────────── ARCHIVISTE DASHBOARD ──────────────────
    def _build_archiviste_dashboard(self, request):
        total_documents = Document.objects.count()
        total_dossiers = Dossier.objects.count()
        total_boitiers = Boitier.objects.count()
        total_salles = Salle.objects.count()
        total_armoires = Armoire.objects.count()
        total_etageres = Etagere.objects.count()
        total_transferts = Transfert.objects.count()
        pending_transfers = Transfert.objects.filter(statut='EN_ATTENTE').count()

        total_capacity = sum(Etagere.objects.values_list('capacite_max_boites', flat=True))
        occupied_locations = Boitier.objects.filter(etagere__isnull=False).count()
        empty_locations = max(total_capacity - occupied_locations, 0)
        empty_location_percentage = round((empty_locations / total_capacity) * 100, 1) if total_capacity else 0

        batiment_stats = self._build_batiment_stats()
        phase_distribution = self._build_phase_distribution()

        transfer_status = [
            {'statut': item['statut'] or 'NON_RENSEIGNE', 'total': item['total']}
            for item in Transfert.objects.values('statut').annotate(total=Count('id')).order_by('statut')
        ]

        recent_transfers = self._serialize_transfers(Transfert.objects.all(), limit=8)
        pending_transfer_list = self._serialize_transfers(Transfert.objects.filter(statut='EN_ATTENTE'), limit=6, include_statut=False)

        document_evolution = self._document_evolution()

        batiments = Batiment.objects.all()
        global_stats = {
            'total_documents': total_documents,
            'total_dossiers': total_dossiers,
            'total_boitiers': total_boitiers,
            'total_transferts': total_transferts,
            'transferts_en_attente': pending_transfers,
            'total_batiments': batiments.count(),
            'total_salles': total_salles,
            'total_armoires': total_armoires,
            'total_etageres': total_etageres,
            'capacite_emplacements': total_capacity,
            'emplacements_occupes': occupied_locations,
            'emplacements_vides': empty_locations,
            'pourcentage_emplacements_vides': empty_location_percentage,
            'total_users': 0,
            'active_users': 0,
            'users_with_login': 0,
            'total_logins': 0
        }

        return {
            'scope': 'archiviste',
            'global': global_stats,
            'batiments': batiment_stats,
            'phases': phase_distribution,
            'transferts': {
                'status': transfer_status,
                'recent': recent_transfers,
                'pending': pending_transfer_list
            },
            'logins': [],
            'document_evolution': document_evolution
        }

    # ────────────────── RESPONSABLE DASHBOARD ──────────────────
    def _build_responsable_dashboard(self, request):
        direction = self._get_user_direction(request.user)
        if not direction:
            return self._build_empty_dashboard('responsable', 'Direction non assignee')

        doc_qs = Document.objects.filter(Q(direction=direction) | Q(calendrier__direction=direction)).distinct()
        dos_qs = Dossier.objects.filter(Q(direction=direction) | Q(calendrier__direction=direction)).distinct()
        boitier_qs = Boitier.objects.filter(
            Q(dossiers__direction=direction) | Q(dossiers__calendrier__direction=direction)
        ).distinct()
        
        transfert_qs = Transfert.objects.filter(
            Q(transfert_boitiers__boitier__dossiers__direction=direction) |
            Q(transfert_boitiers__boitier__dossiers__calendrier__direction=direction) |
            Q(responsable=request.user)
        ).distinct()

        total_documents = doc_qs.count()
        total_dossiers = dos_qs.count()
        total_boitiers = boitier_qs.count()
        total_transferts = transfert_qs.count()
        pending_transfers = transfert_qs.filter(statut='EN_ATTENTE').count()

        transfer_status = [
            {'statut': item['statut'] or 'NON_RENSEIGNE', 'total': item['total']}
            for item in transfert_qs.values('statut').annotate(total=Count('id')).order_by('statut')
        ]

        recent_transfers = self._serialize_transfers(transfert_qs, limit=8)
        pending_transfer_list = self._serialize_transfers(transfert_qs.filter(statut='EN_ATTENTE'), limit=6, include_statut=False)

        phase_distribution = self._build_phase_distribution(doc_qs, dos_qs)
        document_evolution = self._document_evolution(doc_qs)

        direction_name = direction.nom if direction else 'Non assignee'
        global_stats = {
            'total_documents': total_documents,
            'total_dossiers': total_dossiers,
            'total_boitiers': total_boitiers,
            'total_transferts': total_transferts,
            'transferts_en_attente': pending_transfers,
            'total_batiments': 0,
            'total_salles': 0,
            'total_armoires': 0,
            'total_etageres': 0,
            'capacite_emplacements': 0,
            'emplacements_occupes': 0,
            'emplacements_vides': 0,
            'pourcentage_emplacements_vides': 0,
            'total_users': 0,
            'active_users': 0,
            'users_with_login': 0,
            'total_logins': 0
        }

        return {
            'scope': 'responsable',
            'direction': direction_name,
            'global': global_stats,
            'batiments': [],
            'phases': phase_distribution,
            'transferts': {
                'status': transfer_status,
                'recent': recent_transfers,
                'pending': pending_transfer_list
            },
            'logins': [],
            'document_evolution': document_evolution
        }

    # ────────────────── EMPLOYE DASHBOARD ──────────────────
    def _build_employe_dashboard(self, request):
        direction = self._get_user_direction(request.user)
        if not direction:
            return self._build_empty_dashboard('employe', 'Direction non assignee')

        doc_qs = Document.objects.filter(Q(direction=direction) | Q(calendrier__direction=direction)).distinct()
        dos_qs = Dossier.objects.filter(Q(direction=direction) | Q(calendrier__direction=direction)).distinct()
        
        total_documents = doc_qs.count()
        total_dossiers = dos_qs.count()

        phase_distribution = self._build_phase_distribution(doc_qs, dos_qs)
        document_evolution = self._document_evolution(doc_qs)

        global_stats = {
            'total_documents': total_documents,
            'total_dossiers': total_dossiers,
            'total_boitiers': Boitier.objects.filter(dossiers__in=dos_qs).distinct().count(),
            'total_transferts': 0,
            'transferts_en_attente': 0,
            'total_batiments': 0,
            'total_salles': 0,
            'total_armoires': 0,
            'total_etageres': 0,
            'capacite_emplacements': 0,
            'emplacements_occupes': 0,
            'emplacements_vides': 0,
            'pourcentage_emplacements_vides': 0,
            'total_users': 0,
            'active_users': 0,
            'users_with_login': 0,
            'total_logins': 0
        }

        return {
            'scope': 'employe',
            'direction': direction.nom if direction else 'Non assignee',
            'global': global_stats,
            'batiments': [],
            'phases': phase_distribution,
            'transferts': {'status': [], 'recent': [], 'pending': []},
            'logins': [],
            'document_evolution': document_evolution
        }

    def _build_empty_dashboard(self, scope, direction_name='Non assignee'):
        return {
            'scope': scope,
            'direction': direction_name,
            'global': {
                'total_documents': 0, 'total_dossiers': 0, 'total_boitiers': 0,
                'total_transferts': 0, 'transferts_en_attente': 0,
                'total_batiments': 0, 'total_salles': 0, 'total_armoires': 0, 'total_etageres': 0,
                'capacite_emplacements': 0, 'emplacements_occupes': 0, 'emplacements_vides': 0,
                'pourcentage_emplacements_vides': 0, 'total_users': 0, 'active_users': 0,
                'users_with_login': 0, 'total_logins': 0
            },
            'batiments': [],
            'phases': [],
            'transferts': {'status': [], 'recent': [], 'pending': []},
            'logins': [],
            'document_evolution': []
        }

    # ────────────────── SHARED HELPERS ──────────────────
    def _build_batiment_stats(self):
        batiment_stats = []
        batiments = Batiment.objects.all().prefetch_related('salles__armoires__etageres')

        for bat in batiments:
            boitier_count = Boitier.objects.filter(armoire__salle__batiment=bat).count()
            dossier_count = Dossier.objects.filter(boitier__armoire__salle__batiment=bat).count()
            document_count = Document.objects.filter(dossier__boitier__armoire__salle__batiment=bat).count()
            salles_count = Salle.objects.filter(batiment=bat).count()
            armoires_count = Armoire.objects.filter(salle__batiment=bat).count()
            etageres = Etagere.objects.filter(armoire__salle__batiment=bat)
            capacity = sum(etageres.values_list('capacite_max_boites', flat=True))
            occupied = Boitier.objects.filter(etagere__armoire__salle__batiment=bat).count()
            empty = max(capacity - occupied, 0)
            archive_items_count = boitier_count + dossier_count + document_count

            if capacity:
                empty_rate = round((empty / capacity) * 100, 1)
            else:
                empty_rate = 100 if archive_items_count == 0 else 0

            batiment_stats.append({
                'id': bat.id,
                'nom': bat.nom,
                'code': bat.code,
                'salles': salles_count,
                'armoires': armoires_count,
                'capacite': capacity,
                'occupes': occupied,
                'emplacements_vides': empty,
                'taux_vide': empty_rate,
                'boitiers': boitier_count,
                'dossiers': dossier_count,
                'documents': document_count
            })

        return batiment_stats

    def _build_phase_distribution(self, doc_qs=None, dos_qs=None):
        if doc_qs is None:
            doc_qs = Document.objects.all()
        if dos_qs is None:
            dos_qs = Dossier.objects.all()

        phase_distribution = []
        for phase in PhaseArchive.objects.all().order_by('nom'):
            documents_count = doc_qs.filter(phase_archive=phase).count()
            dossiers_count = dos_qs.filter(phaseArchive=phase).count()
            phase_distribution.append({
                'id': phase.id,
                'nom': phase.nom,
                'documents': documents_count,
                'dossiers': dossiers_count,
                'total': documents_count + dossiers_count
            })

        unclassified_documents = doc_qs.filter(phase_archive__isnull=True).count()
        unclassified_dossiers = dos_qs.filter(phaseArchive__isnull=True).count()
        if unclassified_documents or unclassified_dossiers:
            phase_distribution.append({
                'id': None,
                'nom': 'Non classe',
                'documents': unclassified_documents,
                'dossiers': unclassified_dossiers,
                'total': unclassified_documents + unclassified_dossiers
            })

        return phase_distribution

    def _serialize_transfers(self, qs, limit=8, include_statut=True):
        items = []
        for transfert in qs.prefetch_related('transfert_boitiers').order_by('-date_demande')[:limit]:
            item = {
                'id': transfert.id,
                'reference': transfert.reference or f'TR-{transfert.id}',
                'typeTransfer': transfert.typeTransfer,
                'date_demande': transfert.date_demande,
                'boitiers': transfert.transfert_boitiers.count()
            }
            if include_statut:
                item['statut'] = transfert.statut
                item['date_execution'] = transfert.date_execution
            items.append(item)
        return items

    # ────────────────── MAIN ENTRY POINT ──────────────────
    def list(self, request):
        scope = self._dashboard_scope(request.user)

        builders = {
            'admin': self._build_admin_dashboard,
            'archiviste': self._build_archiviste_dashboard,
            'responsable': self._build_responsable_dashboard,
            'employe': self._build_employe_dashboard,
        }

        builder = builders.get(scope, self._build_employe_dashboard)
        return Response(builder(request))

class ResponsableDashboardStatsView(viewsets.ViewSet):
    permission_classes = [EstResponsableValidateur]

    def list(self, request):
        view = DashboardStatsView()
        return Response(view._build_responsable_dashboard(request))
