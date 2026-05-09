# archives/views.py (version complète)

import json
from io import BytesIO
from pathlib import Path

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
        table_header_height = 8 * mm
        content_padding = 4 * mm

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
                table_bottom + table_height - table_header_height,
                table_left + table_width,
                table_bottom + table_height - table_header_height
            )
            pdf.setFont('Helvetica-Bold', 13)
            pdf.drawCentredString(
                table_left + (table_width / 2),
                table_bottom + table_height - (table_header_height / 2) - 4,
                'Details du transfert'
            )

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

        content_lines = []
        if not tree:
            content_lines.append((0, 'Aucun boitier lie a ce transfert.'))
        else:
            for boitier in tree:
                content_lines.append((0, f"Boitier : {boitier['idboit']} - {boitier['titre'] or ''}"))
                if not boitier['dossiers']:
                    content_lines.append((1, 'Aucun dossier lie.'))
                    continue
                for dossier in boitier['dossiers']:
                    content_lines.append((1, f"Dossier : #{dossier['idDossier']} - {dossier['nomDos'] or 'Sans nom'}"))
                    if not dossier['documents']:
                        content_lines.append((2, 'Aucun document lie.'))
                        continue
                    for doc in dossier['documents']:
                        doc_ref = doc.reference or doc.idDoc or str(doc.pk)
                        content_lines.append((2, f"Document : {doc_ref} - {doc.titre}"))

        pdf.setTitle(f"Bordereau {transfert.reference or transfert.id}")
        line_height = 6 * mm
        content_top = table_bottom + table_height - table_header_height - content_padding
        content_bottom = table_bottom + content_padding

        def start_page():
            draw_header()
            draw_table_shell()
            draw_footer()
            return content_top

        y = start_page()
        for level, raw_text in content_lines:
            base_x = table_left + content_padding + (level * 8 * mm)
            available_width = (table_left + table_width - content_padding) - base_x
            wrapped = wrap_line(raw_text, 'Helvetica', 11, available_width)

            needed_height = len(wrapped) * line_height
            if y - needed_height < content_bottom:
                pdf.showPage()
                y = start_page()

            pdf.setFont('Helvetica', 11)
            for line in wrapped:
                pdf.drawString(base_x, y, line)
                y -= line_height

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
