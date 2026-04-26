from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    ArchiveCourant,
    ArchiveDefinitive,
    ArchiveIntermediaire,
    Armoire,
    Batiment,
    Boitier,
    Bordereau,
    Consultation,
    Document,
    Dossier,
    Etagere,
    PhaseArchive,
    Salle,
    Transfert,
)
from .permissions import EstAdministrateur, EstArchiviste, EstLectureAutorisee, EstResponsable
from .serializers import (
    ArchiveCourantSerializer,
    ArchiveDefinitiveSerializer,
    ArchiveIntermediaireSerializer,
    ArmoireSerializer,
    BatimentSerializer,
    BoitierSerializer,
    BordereauSerializer,
    ConsultationSerializer,
    DocumentSerializer,
    DossierSerializer,
    EtagereSerializer,
    GroupSerializer,
    PermissionSerializer,
    PhaseArchiveSerializer,
    RoleSerializer,
    RoleSummarySerializer,
    SalleSerializer,
    TransfertSerializer,
    UserReadSerializer,
    UserWriteSerializer,
)

User = get_user_model()

DEFAULT_ROLE_PERMISSIONS = {
    "Admin": "__all__",
    "Archiviste": [
        "view_batiment",
        "add_batiment",
        "change_batiment",
        "delete_batiment",
        "view_salle",
        "add_salle",
        "change_salle",
        "delete_salle",
        "view_armoire",
        "add_armoire",
        "change_armoire",
        "delete_armoire",
        "view_etagere",
        "add_etagere",
        "change_etagere",
        "delete_etagere",
        "view_boitier",
        "add_boitier",
        "change_boitier",
        "delete_boitier",
        "view_dossier",
        "add_dossier",
        "change_dossier",
        "delete_dossier",
        "view_document",
        "add_document",
        "change_document",
        "delete_document",
        "view_phasearchive",
        "add_phasearchive",
        "change_phasearchive",
        "delete_phasearchive",
        "view_consultation",
        "add_consultation",
        "change_consultation",
        "view_transfert",
        "add_transfert",
        "change_transfert",
    ],
    "Responsable": [
        "view_batiment",
        "view_salle",
        "view_armoire",
        "view_etagere",
        "view_boitier",
        "view_dossier",
        "view_document",
        "view_phasearchive",
        "view_consultation",
        "add_consultation",
        "change_consultation",
        "view_transfert",
        "add_transfert",
        "change_transfert",
    ],
    "Employe": [
        "view_batiment",
        "view_salle",
        "view_armoire",
        "view_etagere",
        "view_boitier",
        "view_dossier",
        "view_document",
        "view_phasearchive",
        "view_consultation",
    ],
}


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.select_related("content_type").all().order_by(
        "content_type__app_label", "content_type__model", "codename"
    )
    serializer_class = PermissionSerializer
    permission_classes = [EstAdministrateur]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["content_type__app_label", "content_type__model"]
    search_fields = ["name", "codename", "content_type__app_label", "content_type__model"]


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.prefetch_related("permissions__content_type").all().order_by("name")
    serializer_class = GroupSerializer
    permission_classes = [EstAdministrateur]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["name"]


class UserViewSet(viewsets.ModelViewSet):
    queryset = (
        User.objects.prefetch_related(
            "groups__permissions__content_type",
            "user_permissions__content_type",
        )
        .all()
        .order_by("id")
    )
    permission_classes = [EstAdministrateur]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["is_active", "groups"]
    search_fields = ["username", "email", "first_name", "last_name"]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return UserWriteSerializer
        return UserReadSerializer


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.prefetch_related("permissions__content_type").all().order_by("name")
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["name"]

    def get_permissions(self):
        if self.action in ["list", "retrieve", "summary"]:
            return [EstAdministrateur()]
        return [EstAdministrateur()]

    def get_serializer_class(self):
        if self.action == "summary":
            return RoleSummarySerializer
        return RoleSerializer

    @action(detail=False, methods=["get"])
    def summary(self, request):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def initialize_defaults(self, request):
        archives_permissions = Permission.objects.select_related("content_type").filter(
            content_type__app_label__in=["archives", "auth"]
        )
        created_roles = []

        for role_name, codenames in DEFAULT_ROLE_PERMISSIONS.items():
            group, created = Group.objects.get_or_create(name=role_name)
            if codenames == "__all__":
                group.permissions.set(archives_permissions)
            else:
                group.permissions.set(archives_permissions.filter(codename__in=codenames))
            created_roles.append({"name": group.name, "created": created})

        return Response({"roles": created_roles})


class BatimentViewSet(viewsets.ModelViewSet):
    queryset = Batiment.objects.all()
    serializer_class = BatimentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["nom", "code", "adresse"]

    def get_permissions(self):
        if self.action in ["list", "retrieve", "salles"]:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]

    @action(detail=True, methods=["get"])
    def salles(self, request, pk=None):
        batiment = self.get_object()
        serializer = SalleSerializer(batiment.salles.all(), many=True)
        return Response(serializer.data)


class SalleViewSet(viewsets.ModelViewSet):
    queryset = Salle.objects.all()
    serializer_class = SalleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["batiment", "etage"]
    search_fields = ["nom", "code"]

    def get_permissions(self):
        if self.action in ["list", "retrieve", "armoires"]:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]

    @action(detail=True, methods=["get"])
    def armoires(self, request, pk=None):
        salle = self.get_object()
        serializer = ArmoireSerializer(salle.armoires.all(), many=True)
        return Response(serializer.data)


class ArmoireViewSet(viewsets.ModelViewSet):
    queryset = Armoire.objects.all()
    serializer_class = ArmoireSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["salle"]
    search_fields = ["code", "code_barres"]

    def get_permissions(self):
        if self.action in ["list", "retrieve", "etageres"]:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]

    @action(detail=True, methods=["get"])
    def etageres(self, request, pk=None):
        armoire = self.get_object()
        serializer = EtagereSerializer(armoire.etageres.all(), many=True)
        return Response(serializer.data)


class EtagereViewSet(viewsets.ModelViewSet):
    queryset = Etagere.objects.all()
    serializer_class = EtagereSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["armoire"]
    search_fields = ["code_barres"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]


class PhaseArchiveViewSet(viewsets.ModelViewSet):
    queryset = PhaseArchive.objects.all()
    serializer_class = PhaseArchiveSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nom"]
    ordering_fields = ["id", "nom"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
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


class BoitierViewSet(viewsets.ModelViewSet):
    queryset = Boitier.objects.all().select_related("armoire", "etagere")
    serializer_class = BoitierSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["statut", "armoire", "etagere"]
    search_fields = ["idboit", "code_barre", "titre"]
    ordering_fields = ["idboit", "date_creation", "capacite"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]

    @action(detail=True, methods=["post"])
    def ajouter_dossier(self, request, pk=None):
        boitier = self.get_object()
        dossier_id = request.data.get("dossier_id")
        try:
            dossier = Dossier.objects.get(idDossier=dossier_id)
            success, message = boitier.ajouter_dossier(dossier)
            if success:
                return Response({"message": message})
            return Response({"error": message}, status=400)
        except Dossier.DoesNotExist:
            return Response({"error": "Dossier non trouve"}, status=404)

    @action(detail=True, methods=["post"])
    def retirer_dossier(self, request, pk=None):
        boitier = self.get_object()
        dossier_id = request.data.get("dossier_id")
        try:
            dossier = Dossier.objects.get(idDossier=dossier_id)
            success, message = boitier.retirer_dossier(dossier)
            if success:
                return Response({"message": message})
            return Response({"error": message}, status=400)
        except Dossier.DoesNotExist:
            return Response({"error": "Dossier non trouve"}, status=404)


class DossierViewSet(viewsets.ModelViewSet):
    queryset = Dossier.objects.all().select_related("boitier", "phaseArchive")
    serializer_class = DossierSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["phaseArchive", "boitier"]
    search_fields = ["idDossier", "nomDos"]
    ordering_fields = ["date_creation"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]

    @action(detail=True, methods=["post"])
    def ajouter_document(self, request, pk=None):
        dossier = self.get_object()
        doc_id = request.data.get("document_id")
        try:
            document = Document.objects.get(idDoc=doc_id)
            success, message = dossier.ajouter_document(document)
            if success:
                return Response({"message": message})
            return Response({"error": message}, status=400)
        except Document.DoesNotExist:
            return Response({"error": "Document non trouve"}, status=404)

    @action(detail=True, methods=["post"])
    def lier_boitier(self, request, pk=None):
        dossier = self.get_object()
        boitier_id = request.data.get("boitier_id")
        try:
            boitier = Boitier.objects.get(idboit=boitier_id)
            success, message = dossier.lier_boitier(boitier)
            if success:
                return Response({"message": message})
            return Response({"error": message}, status=400)
        except Boitier.DoesNotExist:
            return Response({"error": "Boitier non trouve"}, status=404)


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().select_related("dossier", "phase_archive")
    serializer_class = DocumentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["phase_archive", "dossier", "type_document", "niv_confidentialite"]
    search_fields = ["idDoc", "reference", "titre", "auteur"]
    ordering_fields = ["date_creation", "version"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]

    @action(detail=True, methods=["post"])
    def changer_phase(self, request, pk=None):
        document = self.get_object()
        phase_id = request.data.get("phase_id")
        try:
            nouvelle_phase = PhaseArchive.objects.get(pk=phase_id)
            success, message = document.changer_phase(nouvelle_phase)
            if success:
                return Response({"message": message})
            return Response({"error": message}, status=400)
        except PhaseArchive.DoesNotExist:
            return Response({"error": "Phase non trouvee"}, status=404)

    @action(detail=True, methods=["post"])
    def consulter(self, request, pk=None):
        document = self.get_object()
        document.consulter(utilisateur=request.user)
        return Response({"message": "Consultation enregistree"})


class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = Consultation.objects.all()
    serializer_class = ConsultationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["document", "allitemsReturned"]
    search_fields = ["direction", "poste"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [EstLectureAutorisee()]
        return [EstArchiviste()]


class TransfertViewSet(viewsets.ModelViewSet):
    queryset = Transfert.objects.all()
    serializer_class = TransfertSerializer
    permission_classes = [EstResponsable]

    @action(detail=True, methods=["post"])
    def valider(self, request, pk=None):
        transfert = self.get_object()
        transfert.statut = "VALIDE"
        transfert.date_execution = timezone.now()
        transfert.save()
        return Response({"status": "valide"})


class BordereauViewSet(viewsets.ModelViewSet):
    queryset = Bordereau.objects.all()
    serializer_class = BordereauSerializer
    permission_classes = [EstArchiviste]
