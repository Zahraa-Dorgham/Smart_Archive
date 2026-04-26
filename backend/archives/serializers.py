from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from rest_framework import serializers

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
    Role,
    Salle,
    Transfert,
)

User = get_user_model()


def build_permission_payload(permission: Permission) -> dict:
    return {
        "id": permission.id,
        "name": permission.name,
        "codename": permission.codename,
        "app_label": permission.content_type.app_label,
        "model": permission.content_type.model,
        "label": f"{permission.content_type.app_label}.{permission.codename}",
    }


def group_permissions_by_module(permissions) -> list[dict]:
    modules: dict[str, list[dict]] = {}
    for permission in permissions:
        module_name = permission.content_type.model
        modules.setdefault(module_name, []).append(build_permission_payload(permission))

    return [
        {
            "module": module,
            "count": len(items),
            "permissions": sorted(items, key=lambda item: item["codename"]),
        }
        for module, items in sorted(modules.items())
    ]


class PermissionSerializer(serializers.ModelSerializer):
    app_label = serializers.CharField(source="content_type.app_label", read_only=True)
    model = serializers.CharField(source="content_type.model", read_only=True)
    label = serializers.SerializerMethodField()

    class Meta:
        model = Permission
        fields = ["id", "name", "codename", "app_label", "model", "label"]

    def get_label(self, obj):
        return f"{obj.content_type.app_label}.{obj.codename}"


class GroupSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permission.objects.select_related("content_type").all(),
        source="permissions",
        write_only=True,
        required=False,
    )
    permissions_by_module = serializers.SerializerMethodField()
    total_permissions = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            "id",
            "name",
            "permissions",
            "permission_ids",
            "permissions_by_module",
            "total_permissions",
        ]

    def get_permissions_by_module(self, obj):
        permissions = obj.permissions.select_related("content_type").all()
        return group_permissions_by_module(permissions)

    def get_total_permissions(self, obj):
        return obj.permissions.count()


class UserReadSerializer(serializers.ModelSerializer):
    groups = GroupSerializer(many=True, read_only=True)
    direct_permissions = serializers.SerializerMethodField()
    role_permissions = serializers.SerializerMethodField()
    effective_permissions = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    primary_role = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
            "last_login",
            "groups",
            "roles",
            "primary_role",
            "direct_permissions",
            "role_permissions",
            "effective_permissions",
        ]

    def get_roles(self, obj):
        return [group.name for group in obj.groups.all()]

    def get_primary_role(self, obj):
        first_group = obj.groups.order_by("name").first()
        return first_group.name if first_group else None

    def get_full_name(self, obj):
        full_name = obj.get_full_name().strip()
        return full_name or obj.username

    def get_direct_permissions(self, obj):
        permissions = obj.user_permissions.select_related("content_type").all()
        return [build_permission_payload(permission) for permission in permissions]

    def get_role_permissions(self, obj):
        permissions = (
            Permission.objects.filter(group__user=obj)
            .select_related("content_type")
            .distinct()
            .order_by("content_type__app_label", "content_type__model", "codename")
        )
        return [build_permission_payload(permission) for permission in permissions]

    def get_effective_permissions(self, obj):
        permissions = (
            obj.get_all_permissions()
            if hasattr(obj, "get_all_permissions")
            else set()
        )
        return sorted(permissions)


class UserWriteSerializer(serializers.ModelSerializer):
    groups = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Group.objects.all(),
        required=False,
    )
    user_permissions = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permission.objects.select_related("content_type").all(),
        required=False,
    )
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "groups",
            "user_permissions",
            "password",
        ]

    def validate(self, attrs):
        email = attrs.get("email")
        username = attrs.get("username")

        if email and not username:
            attrs["username"] = email

        return attrs

    def validate_email(self, value):
        queryset = User.objects.filter(email__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Un utilisateur avec cet email existe deja.")
        return value

    def validate_username(self, value):
        queryset = User.objects.filter(username__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Un utilisateur avec ce username existe deja.")
        return value

    def create(self, validated_data):
        groups = validated_data.pop("groups", [])
        user_permissions = validated_data.pop("user_permissions", [])
        password = validated_data.pop("password", None)

        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()

        if groups:
            user.groups.set(groups)
        if user_permissions:
            user.user_permissions.set(user_permissions)

        return user

    def update(self, instance, validated_data):
        groups = validated_data.pop("groups", None)
        user_permissions = validated_data.pop("user_permissions", None)
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if groups is not None:
            instance.groups.set(groups)
        if user_permissions is not None:
            instance.user_permissions.set(user_permissions)

        return instance


class RoleSerializer(GroupSerializer):
    class Meta(GroupSerializer.Meta):
        fields = GroupSerializer.Meta.fields


class RoleSummarySerializer(serializers.ModelSerializer):
    total_permissions = serializers.SerializerMethodField()
    permissions_by_module = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ["id", "name", "total_permissions", "permissions_by_module"]

    def get_total_permissions(self, obj):
        return obj.permissions.count()

    def get_permissions_by_module(self, obj):
        return group_permissions_by_module(obj.permissions.select_related("content_type").all())


class EtagereSerializer(serializers.ModelSerializer):
    armoire_code = serializers.CharField(source="armoire.code", read_only=True)

    class Meta:
        model = Etagere
        fields = [
            "id",
            "armoire",
            "armoire_code",
            "numero",
            "code_barres",
            "capacite_max_boites",
            "occupation_actuelle",
            "description",
        ]


class ArmoireSerializer(serializers.ModelSerializer):
    salle_nom = serializers.CharField(source="salle.nom", read_only=True)
    etageres = EtagereSerializer(many=True, read_only=True)
    nombre_etageres = serializers.IntegerField(source="etageres.count", read_only=True)

    class Meta:
        model = Armoire
        fields = [
            "id",
            "code",
            "salle",
            "salle_nom",
            "code_barres",
            "etageres",
            "nombre_etageres",
            "description",
            "type_armoire",
            "date_installation",
        ]


class SalleSerializer(serializers.ModelSerializer):
    batiment_nom = serializers.CharField(source="batiment.nom", read_only=True)
    armoires = ArmoireSerializer(many=True, read_only=True)
    nombre_armoires = serializers.IntegerField(source="armoires.count", read_only=True)

    class Meta:
        model = Salle
        fields = [
            "id",
            "nom",
            "code",
            "batiment",
            "batiment_nom",
            "etage",
            "type_salle",
            "description",
            "dimensions",
            "volume",
            "armoires",
            "nombre_armoires",
        ]


class BatimentSerializer(serializers.ModelSerializer):
    nombre_salles = serializers.SerializerMethodField()
    salles = SalleSerializer(many=True, read_only=True)

    class Meta:
        model = Batiment
        fields = [
            "id",
            "nom",
            "code",
            "adresse",
            "ville",
            "description",
            "date_creation",
            "nombre_salles",
            "salles",
        ]

    def get_nombre_salles(self, obj):
        return obj.salles.count()


class PhaseArchiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhaseArchive
        fields = "__all__"


class ArchiveCourantSerializer(serializers.ModelSerializer):
    phase_detail = PhaseArchiveSerializer(source="phase", read_only=True)

    class Meta:
        model = ArchiveCourant
        fields = "__all__"


class ArchiveIntermediaireSerializer(serializers.ModelSerializer):
    phase_detail = PhaseArchiveSerializer(source="phase", read_only=True)

    class Meta:
        model = ArchiveIntermediaire
        fields = "__all__"


class ArchiveDefinitiveSerializer(serializers.ModelSerializer):
    phase_detail = PhaseArchiveSerializer(source="phase", read_only=True)

    class Meta:
        model = ArchiveDefinitive
        fields = "__all__"


class BoitierSerializer(serializers.ModelSerializer):
    armoire_nom = serializers.CharField(source="armoire.code", read_only=True)
    etagere_numero = serializers.IntegerField(source="etagere.numero", read_only=True)
    localisation = serializers.SerializerMethodField()
    taux_remplissage = serializers.FloatField(read_only=True)

    class Meta:
        model = Boitier
        fields = [
            "id",
            "idboit",
            "code_barre",
            "titre",
            "capacite",
            "armoire",
            "armoire_nom",
            "etagere",
            "etagere_numero",
            "statut",
            "date_creation",
            "date_modification",
            "localisation",
            "taux_remplissage",
            "description",
        ]

    def get_localisation(self, obj):
        return obj.localisation_complete()


class DossierSerializer(serializers.ModelSerializer):
    nombre_documents = serializers.IntegerField(read_only=True)
    volume_total = serializers.IntegerField(read_only=True)
    phase_archive_nom = serializers.CharField(source="phaseArchive.nom", read_only=True)

    class Meta:
        model = Dossier
        fields = "__all__"


class DocumentSerializer(serializers.ModelSerializer):
    dossier_reference = serializers.SerializerMethodField()
    phase_archive_nom = serializers.CharField(source="phase_archive.nom", read_only=True)
    taille_fichier_lisible = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id",
            "idDoc",
            "reference",
            "titre",
            "dossier",
            "dossier_reference",
            "phase_archive",
            "phase_archive_nom",
            "date_creation",
            "niv_confidentialite",
            "version",
            "type_document",
            "auteur",
            "description",
            "fichier",
            "taille_fichier",
            "taille_fichier_lisible",
            "hash_fichier",
            "date_entree",
            "date_modification",
        ]
        read_only_fields = ["date_entree", "date_modification", "hash_fichier"]

    def get_dossier_reference(self, obj):
        return getattr(obj.dossier, "idDossier", None)

    def get_taille_fichier_lisible(self, obj):
        if obj.taille_fichier:
            size = obj.taille_fichier
            for unit in ["o", "Ko", "Mo", "Go"]:
                if size < 1024:
                    return f"{size:.2f} {unit}"
                size /= 1024
            return f"{size:.2f} To"
        return None


class ConsultationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consultation
        fields = "__all__"


class TransfertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transfert
        fields = "__all__"


class BordereauSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bordereau
        fields = "__all__"


class RoleModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = "__all__"
