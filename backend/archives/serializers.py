# archives/serializers.py - Version avec uniquement les modèles existants
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from .models import (
    ArchiveDefinitive, ArchiveIntermediaire, ArchiveCourant, Bordereau, Role, Direction, Batiment, Salle, Armoire, Etagere, PhaseArchive, Transfert, TransfertBoitier, Consultation, UserProfile
    # Retirez Boitier, Dossier, Document, Service s'ils n'existent pas
)

# Serializer pour Role
class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'


# Serializer pour Direction
class DirectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Direction
        fields = ['id', 'nom', 'code']

# Serializer pour Batiment
class BatimentSerializer(serializers.ModelSerializer):
    nombre_salles = serializers.SerializerMethodField()

    class Meta:
        model = Batiment
        fields = ['id', 'nom', 'code', 'adresse', 'description', 'date_creation', 'nombre_salles','ville']

    def get_nombre_salles(self, obj):
        return obj.salles.count()

# Serializer pour Salle
class SalleSerializer(serializers.ModelSerializer):
    batiment_nom = serializers.CharField(source='batiment.nom', read_only=True)
    nombre_armoires = serializers.SerializerMethodField()
    
    class Meta:
        model = Salle
        fields = ['id', 'nom', 'code', 'batiment', 'batiment_nom', 
                  'etage', 'description', 'nombre_armoires']

    def get_nombre_armoires(self, obj):
        return obj.armoires.count()

# Serializer pour Armoire
class ArmoireSerializer(serializers.ModelSerializer):
    salle_nom = serializers.CharField(source='salle.nom', read_only=True)
    nombre_etageres = serializers.SerializerMethodField()
    
    class Meta:
        model = Armoire
        fields = ['id', 'code', 'salle', 'salle_nom', 
                  'code_barres', 'nombre_etageres']

    def get_nombre_etageres(self, obj):
        return obj.etageres.count()

# Serializer pour Etagere
class EtagereSerializer(serializers.ModelSerializer):
    armoire_code = serializers.CharField(source='armoire.code', read_only=True)
    
    class Meta:
        model = Etagere
        fields = ['id', 'armoire', 'armoire_code', 'numero', 'code_barres']

# Serializer pour PhaseArchive
class PhaseArchiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhaseArchive
        fields = '__all__'

class ArchiveCourantSerializer(serializers.ModelSerializer):
    phase_detail = PhaseArchiveSerializer(source='phase', read_only=True)

    class Meta:
        model = ArchiveCourant
        fields = '__all__'

class ArchiveIntermediaireSerializer(serializers.ModelSerializer):
    phase_detail = PhaseArchiveSerializer(source='phase', read_only=True)

    class Meta:
        model = ArchiveIntermediaire
        fields = '__all__'

class ArchiveDefinitiveSerializer(serializers.ModelSerializer):
    phase_detail = PhaseArchiveSerializer(source='phase', read_only=True)

    class Meta:
        model = ArchiveDefinitive
        fields = '__all__'
        
# archives/serializers.py
from rest_framework import serializers
from .models import Boitier, Dossier, Document, Armoire, Etagere, PhaseArchive, UserProfile
from calendrier.models import Calendrier


class NullablePrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        if data in ('', 'null', 'None', 'undefined'):
            return None
        return super().to_internal_value(data)

class BoitierSerializer(serializers.ModelSerializer):
    armoire_nom = serializers.CharField(source='armoire.code', read_only=True)
    etagere_numero = serializers.IntegerField(source='etagere.numero', read_only=True)
    localisation = serializers.SerializerMethodField()
    taux_remplissage = serializers.FloatField(read_only=True)  # property du modèle

    class Meta:
        model = Boitier
        fields = [
            'id', 'idboit', 'code_barre', 'titre', 'capacite',
            'armoire', 'armoire_nom', 'etagere', 'etagere_numero',
            'statut', 'date_creation', 'date_modification',
            'localisation', 'taux_remplissage', 'nombre_dossiers'
        ]

    def get_localisation(self, obj):
        return obj.localisation_complete()

class DossierSerializer(serializers.ModelSerializer):
    boitier_idboit = serializers.CharField(source='boitier.idboit', read_only=True)
    calendrier_code = serializers.CharField(source='calendrier.code', read_only=True)
    calendrier_title = serializers.CharField(source='calendrier.title', read_only=True)
    phaseArchive_nom = serializers.CharField(source='phaseArchive.nom', read_only=True)
    nombre_documents = serializers.IntegerField(read_only=True)
    volume_total = serializers.IntegerField(read_only=True)
    
    # Marquer date_creation comme optionnel
    date_creation = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = Dossier
        fields = [
            'idDossier', 'code', 'nomDos', 'date_creation', 'date_cloture',
            'boitier', 'boitier_idboit', 'calendrier', 'calendrier_code', 'calendrier_title',
            'phaseArchive', 'phaseArchive_nom',
            'phaseType', 'dureeCourant', 'dureeIntermediaire', 'dureeDefinitive',
            'date_pass_intermediaire', 'date_pass_final',
            'date_pass_intermediaire_real', 'date_pass_final_real',
            'conservation_active_period', 'conservation_semi_active_period',
            'sort_final_type', 'sort_final_comment', 'sort_final_security_years',
            'nombre_documents', 'volume_total'
        ]

class DocumentSerializer(serializers.ModelSerializer):
    dossier_reference = serializers.CharField(source='dossier.idDossier', read_only=True)
    dossier_nom = serializers.CharField(source='dossier.nomDos', read_only=True)
    phase_archive_nom = serializers.CharField(source='phase_archive.nom', read_only=True, required=False)
    taille_fichier_lisible = serializers.SerializerMethodField()
    calendrier_code = serializers.CharField(source='calendrier.code', read_only=True, required=False)
    calendrier_title = serializers.CharField(source='calendrier.title', read_only=True, required=False)
    
    # Marquer les champs optionnels
    reference = serializers.CharField(required=False, allow_blank=True)
    phase_archive = NullablePrimaryKeyRelatedField(queryset=PhaseArchive.objects.all(), required=False, allow_null=True)
    type_document = serializers.CharField(required=False, allow_blank=True)
    date_creation = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = Document
        fields = [
            'id', 'idDoc', 'reference', 'titre', 'dossier', 'dossier_reference', 'dossier_nom',
            'phase_archive', 'phase_archive_nom', 'date_creation',
            'calendrier', 'calendrier_code', 'calendrier_title',
            'niv_confidentialite', 'version', 'type_document', 'auteur',
            'description', 'date_pass_intermediaire', 'date_pass_final',
            'date_pass_intermediaire_real', 'date_pass_final_real',
            'conservation_active_period', 'conservation_semi_active_period',
            'sort_final_type', 'sort_final_comment', 'sort_final_security_years',
            'action_finale', 'fichier', 'taille_fichier', 'taille_fichier_lisible',
            'hash_fichier', 'date_entree', 'date_modification'
        ]
        read_only_fields = ['date_entree', 'date_modification', 'hash_fichier', 'id', 'version']

    def get_taille_fichier_lisible(self, obj):
        if obj.taille_fichier:
            size = obj.taille_fichier
            for unit in ['o', 'Ko', 'Mo', 'Go']:
                if size < 1024:
                    return f"{size:.2f} {unit}"
                size /= 1024
            return f"{size:.2f} To"
        return None

    def validate(self, attrs):
        attrs = super().validate(attrs)

        dossier = attrs.get('dossier') or getattr(self.instance, 'dossier', None)
        calendrier = attrs.get('calendrier', serializers.empty)

        if calendrier is serializers.empty:
            calendrier = getattr(self.instance, 'calendrier', None)

        if dossier and calendrier:
            allowed_ids = self._get_allowed_calendrier_ids(dossier)
            if str(calendrier.id) not in allowed_ids:
                raise serializers.ValidationError({
                    'calendrier': "Le calendrier selectionne doit appartenir au dossier choisi ou a l'un de ses calendriers descendants."
                })

        if dossier and calendrier is None and dossier.calendrier_id is None:
            return attrs

        return attrs

    def _get_allowed_calendrier_ids(self, dossier):
        if not dossier.calendrier_id:
            return set()

        allowed_ids = {str(dossier.calendrier_id)}
        pending_ids = [dossier.calendrier_id]

        while pending_ids:
            child_ids = list(
                Calendrier.objects.filter(parent_id__in=pending_ids).values_list('id', flat=True)
            )
            new_ids = [child_id for child_id in child_ids if str(child_id) not in allowed_ids]
            if not new_ids:
                break
            allowed_ids.update(str(child_id) for child_id in new_ids)
            pending_ids = new_ids

        return allowed_ids





# class DemandeConsultationSerializer(serializers.ModelSerializer):
#     employe_nom = serializers.CharField(source='employe.username', read_only=True)
#     document_titre = serializers.CharField(source='document.titre', read_only=True)

#     class Meta:
#         model = DemandeConsultation
#         fields = '__all__'
#         read_only_fields = ['date_demande', 'statut']


class ConsultationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consultation
        fields = '__all__'


# --- Transfert ---
class TransfertSerializer(serializers.ModelSerializer):
    PHASE_INTERMEDIAIRE_ID = 2
    PHASE_FINALE_ID = 3
    TYPE_TRANSFER_VALUES = {'INTERMEDIAIRE', 'FINAL'}
    boitier_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False
    )
    boitiers_detail = serializers.SerializerMethodField()
    archiviste_nom = serializers.SerializerMethodField()
    responsable_nom = serializers.SerializerMethodField()

    class Meta:
        model = Transfert
        fields = [
            'id', 'reference', 'bordereauxReference', 'typeTransfer',
            'date_demande', 'date_execution', 'statut',
            'boitier_ids', 'boitiers_detail',
            'archiviste', 'archiviste_nom', 'responsable', 'responsable_nom'
        ]
        read_only_fields = ['statut', 'date_execution', 'archiviste', 'responsable']

    def get_archiviste_nom(self, obj):
        return self._format_user_name(obj.archiviste)

    def get_responsable_nom(self, obj):
        return self._format_user_name(obj.responsable)

    def _format_user_name(self, user):
        if not user:
            return None
        full_name = user.get_full_name().strip()
        return full_name or user.username

    def get_boitiers_detail(self, obj):
        return [
            {
                'id': link.boitier.id,
                'idboit': link.boitier.idboit,
                'titre': link.boitier.titre,
                'code_barre': link.boitier.code_barre,
            }
            for link in obj.transfert_boitiers.select_related('boitier').all()
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['boitier_ids'] = list(
            instance.transfert_boitiers.values_list('boitier_id', flat=True)
        )
        return data

    def validate_boitier_ids(self, value):
        boitier_ids = list(dict.fromkeys(value))
        existing_ids = set(Boitier.objects.filter(id__in=boitier_ids).values_list('id', flat=True))
        missing_ids = [boitier_id for boitier_id in boitier_ids if boitier_id not in existing_ids]

        if missing_ids:
            raise serializers.ValidationError(f"Boitier(s) introuvable(s): {missing_ids}")

        transfer_type = self.initial_data.get('typeTransfer') or getattr(self.instance, 'typeTransfer', None)
        linked_elsewhere = TransfertBoitier.objects.filter(boitier_id__in=boitier_ids)
        if transfer_type:
            linked_elsewhere = linked_elsewhere.filter(transfert__typeTransfer=transfer_type)
        if self.instance:
            linked_elsewhere = linked_elsewhere.exclude(transfert=self.instance)

        conflict_ids = list(dict.fromkeys(linked_elsewhere.values_list('boitier_id', flat=True)))
        if conflict_ids:
            raise serializers.ValidationError(
                f"Boitier(s) deja lies a un autre transfert de type {transfer_type}: {conflict_ids}"
            )

        return boitier_ids

    def validate_typeTransfer(self, value):
        if value not in self.TYPE_TRANSFER_VALUES:
            raise serializers.ValidationError("Le type de transfert doit etre INTERMEDIAIRE ou FINAL.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        boitier_ids = attrs.get('boitier_ids')
        transfer_type = attrs.get('typeTransfer', getattr(self.instance, 'typeTransfer', None))

        if boitier_ids is None and self.instance:
            boitier_ids = list(self.instance.transfert_boitiers.values_list('boitier_id', flat=True))

        if boitier_ids and transfer_type:
            blocking_tree = self._build_blocking_tree(transfer_type, boitier_ids)
            if blocking_tree:
                raise serializers.ValidationError({
                    'blocking_transfer': {
                        'message': "Certains elements ne peuvent pas etre transferes pour le moment.",
                        'transfer_type': transfer_type,
                        'date_field': self._get_rule_config(transfer_type)['date_field'],
                        'today': timezone.localdate(),
                        'boitiers': blocking_tree,
                    }
                })

        return attrs

    def create(self, validated_data):
        boitier_ids = validated_data.pop('boitier_ids', [])
        with transaction.atomic():
            transfert = Transfert.objects.create(**validated_data)
            self._sync_boitiers(transfert, boitier_ids)
            self._apply_transfert_effects(transfert, validated_data.get('typeTransfer', transfert.typeTransfer), boitier_ids)
        return transfert

    def update(self, instance, validated_data):
        boitier_ids = validated_data.pop('boitier_ids', None)
        next_type = validated_data.get('typeTransfer', instance.typeTransfer)

        with transaction.atomic():
            previous_boitiers = list(instance.transfert_boitiers.values_list('boitier_id', flat=True))

            for attr, value in validated_data.items():
                setattr(instance, attr, value)

            instance.save()

            selected_boitiers = boitier_ids
            if boitier_ids is not None:
                removed_boitiers = [boitier_id for boitier_id in previous_boitiers if boitier_id not in boitier_ids]
                if removed_boitiers:
                    self._revert_removed_boitiers(next_type, removed_boitiers)
                self._sync_boitiers(instance, boitier_ids)
            else:
                selected_boitiers = list(instance.transfert_boitiers.values_list('boitier_id', flat=True))

            self._apply_transfert_effects(instance, next_type, selected_boitiers)

        return instance

    def _sync_boitiers(self, transfert, boitier_ids):
        TransfertBoitier.objects.filter(transfert=transfert).delete()
        if boitier_ids:
            TransfertBoitier.objects.bulk_create([
                TransfertBoitier(transfert=transfert, boitier_id=boitier_id)
                for boitier_id in boitier_ids
            ])

    def _get_rule_config(self, transfer_type):
        if transfer_type == 'INTERMEDIAIRE':
            return {
                'date_field': 'date_pass_intermediaire',
                'real_date_field': 'date_pass_intermediaire_real',
                'phase_field': 'phaseArchive_id',
                'document_phase_field': 'phase_archive_id',
                'phase_id': self.PHASE_INTERMEDIAIRE_ID,
                'rollback_date_field': 'date_pass_intermediaire_real',
                'rollback_phase_id': 1,
            }

        return {
            'date_field': 'date_pass_final',
            'real_date_field': 'date_pass_final_real',
            'phase_field': 'phaseArchive_id',
            'document_phase_field': 'phase_archive_id',
            'phase_id': self.PHASE_FINALE_ID,
            'rollback_date_field': 'date_pass_final',
            'rollback_phase_id': self.PHASE_INTERMEDIAIRE_ID,
        }

    def _build_blocking_tree(self, transfer_type, boitier_ids):
        config = self._get_rule_config(transfer_type)
        today = timezone.localdate()
        boitiers = Boitier.objects.filter(id__in=boitier_ids).prefetch_related('dossiers__documents')
        tree = []

        for boitier in boitiers:
            dossier_nodes = []
            for dossier in boitier.dossiers.all():
                dossier_date = getattr(dossier, config['date_field'], None)
                blocked_documents = []

                for document in dossier.documents.all():
                    document_date = getattr(document, config['date_field'], None)
                    if document_date is None or document_date >= today:
                        blocked_documents.append({
                            'id': document.id,
                            'idDoc': document.idDoc,
                            'reference': document.reference,
                            'titre': document.titre,
                            config['date_field']: document_date,
                        })

                dossier_blocked = dossier_date is None or dossier_date >= today
                if dossier_blocked or blocked_documents:
                    dossier_nodes.append({
                        'idDossier': dossier.idDossier,
                        'nomDos': dossier.nomDos,
                        config['date_field']: dossier_date,
                        'documents': blocked_documents,
                    })

            if dossier_nodes:
                tree.append({
                    'id': boitier.id,
                    'idboit': boitier.idboit,
                    'titre': boitier.titre,
                    'dossiers': dossier_nodes,
                })

        return tree

    def _apply_transfert_effects(self, transfert, transfer_type, boitier_ids):
        if not boitier_ids:
            return

        config = self._get_rule_config(transfer_type)
        today = timezone.localdate()

        for boitier in Boitier.objects.filter(id__in=boitier_ids).prefetch_related('dossiers__documents'):
            for dossier in boitier.dossiers.all():
                dossier_updates = {
                    config['real_date_field']: today,
                    config['phase_field']: config['phase_id'],
                }
                type(dossier).objects.filter(pk=dossier.pk).update(**dossier_updates)

                document_updates = {
                    config['real_date_field']: today,
                    config['document_phase_field']: config['phase_id'],
                }
                dossier.documents.update(**document_updates)

    def _revert_removed_boitiers(self, transfer_type, boitier_ids):
        if not boitier_ids:
            return

        config = self._get_rule_config(transfer_type)

        for boitier in Boitier.objects.filter(id__in=boitier_ids).prefetch_related('dossiers__documents'):
            for dossier in boitier.dossiers.all():
                dossier_updates = {
                    config['rollback_date_field']: None,
                    config['phase_field']: config['rollback_phase_id'],
                }
                type(dossier).objects.filter(pk=dossier.pk).update(**dossier_updates)

                document_updates = {
                    config['rollback_date_field']: None,
                    config['document_phase_field']: config['rollback_phase_id'],
                }
                dossier.documents.update(**document_updates)

# --- Bordereau ---
class BordereauSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bordereau
        fields = '__all__'




from django.contrib.auth.models import Group

class GroupSerializer(serializers.ModelSerializer):
    permissions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions', 'permissions_count']
        
    def get_permissions_count(self, obj):
        return obj.permissions.count()

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        from django.contrib.auth.models import Permission
        model = Permission
        fields = ['id', 'name', 'codename', 'content_type']




from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    groups_detail = GroupSerializer(source='groups', many=True, read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    direction = serializers.PrimaryKeyRelatedField(
        queryset=Direction.objects.all(),
        required=False,
        allow_null=True
    )
    direction_nom = serializers.SerializerMethodField()
    telephone = serializers.CharField(write_only=True, required=False, allow_null=True)
    adresse = serializers.CharField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'is_active', 'groups', 'groups_detail', 'password', 
            'user_permissions', 'direction', 'direction_nom',
            'telephone', 'adresse'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def get_direction_nom(self, obj):
        try:
            profile = getattr(obj, 'profile', None)
            if profile and profile.direction:
                return profile.direction.nom
        except Exception:
            pass
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Ensure direction ID is present for frontend dropdowns
        profile = getattr(instance, 'profile', None)
        data['direction'] = profile.direction.id if profile and profile.direction else None
        data['telephone'] = profile.telephone if profile else None
        data['adresse'] = profile.adresse if profile else None
        
        # Add initials and full_name if missing (for frontend)
        if 'first_name' in data and 'last_name' in data:
            data['full_name'] = f"{data['first_name']} {data['last_name']}".strip() or data['username']
            if data['first_name'] and data['last_name']:
                data['initials'] = (data['first_name'][0] + data['last_name'][0]).upper()
            else:
                data['initials'] = data['username'][:2].upper()
        
        return data

    def create(self, validated_data):
        direction = validated_data.pop('direction', None)
        telephone = validated_data.pop('telephone', None)
        adresse = validated_data.pop('adresse', None)
        groups_data = validated_data.pop('groups', [])
        permissions_data = validated_data.pop('user_permissions', [])
        password = validated_data.pop('password', None)
        
        user = User.objects.create_user(password=password, **validated_data)
        
        # Ensure profile exists and set direction, telephone, adresse
        UserProfile.objects.update_or_create(
            user=user,
            defaults={
                'direction': direction,
                'telephone': telephone,
                'adresse': adresse
            }
        )

        if groups_data:
            user.groups.set(groups_data)
            group_names = [g.name.lower() for g in user.groups.all()]
            if any(name in ['administrateur', 'admin'] for name in group_names):
                user.is_staff = True
                user.save()

        if permissions_data:
            user.user_permissions.set(permissions_data)
            
        return user

    def update(self, instance, validated_data):
        direction = validated_data.pop('direction', serializers.empty)
        telephone = validated_data.pop('telephone', serializers.empty)
        adresse = validated_data.pop('adresse', serializers.empty)
        groups_data = validated_data.pop('groups', None)
        permissions_data = validated_data.pop('user_permissions', None)
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            if attr != 'password':
                setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
            
        instance.save()

        # Handle profile (direction, telephone, adresse)
        profile_defaults = {}
        if direction is not serializers.empty:
            profile_defaults['direction'] = direction
        if telephone is not serializers.empty:
            profile_defaults['telephone'] = telephone
        if adresse is not serializers.empty:
            profile_defaults['adresse'] = adresse

        if profile_defaults:
            profile, _ = UserProfile.objects.update_or_create(
                user=instance,
                defaults=profile_defaults
            )
            # Update the in-memory relation
            instance.profile = profile
        
        if groups_data is not None:
            instance.groups.set(groups_data)
            group_names = [g.name.lower() for g in instance.groups.all()]
            if any(name in ['administrateur', 'admin'] for name in group_names):
                instance.is_staff = True
            else:
                if not instance.is_superuser:
                    instance.is_staff = False
            instance.save()

        if permissions_data is not None:
            instance.user_permissions.set(permissions_data)
            
        return instance
		
		
		
