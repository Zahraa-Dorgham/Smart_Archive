# archives/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from .models import (
    ArchiveDefinitive, ArchiveIntermediaire, ArchiveCourant, Bordereau, 
    Role, Batiment, Salle, Armoire, Etagere, PhaseArchive, Transfert, 
    Consultation, Boitier, Dossier, Document
)

User = get_user_model()

# ========== GROUPES & UTILISATEURS ==========
class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']

class UserSerializer(serializers.ModelSerializer):
    groups = serializers.StringRelatedField(many=True, read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'groups']

# ========== RÔLE ==========
class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

# ========== BÂTIMENT, SALLE, ARMOIRE, ÉTAGÈRE ==========
class EtagereSerializer(serializers.ModelSerializer):
    armoire_code = serializers.CharField(source='armoire.code', read_only=True)
    
    class Meta:
        model = Etagere
        fields = ['id', 'armoire', 'armoire_code', 'numero', 'code_barres', 'capacite_max_boites', 'occupation_actuelle', 'description']

class ArmoireSerializer(serializers.ModelSerializer):
    salle_nom = serializers.CharField(source='salle.nom', read_only=True)
    etageres = EtagereSerializer(many=True, read_only=True)
    nombre_etageres = serializers.IntegerField(source='etageres.count', read_only=True)
    
    class Meta:
        model = Armoire
        fields = ['id', 'code', 'salle', 'salle_nom', 'code_barres', 'etageres', 'nombre_etageres', 'description', 'type_armoire', 'date_installation']

class SalleSerializer(serializers.ModelSerializer):
    batiment_nom = serializers.CharField(source='batiment.nom', read_only=True)
    armoires = ArmoireSerializer(many=True, read_only=True)
    nombre_armoires = serializers.IntegerField(source='armoires.count', read_only=True)
    
    class Meta:
        model = Salle
        fields = ['id', 'nom', 'code', 'batiment', 'batiment_nom', 'etage', 'type_salle', 'description', 'dimensions', 'volume', 'armoires', 'nombre_armoires']

class BatimentSerializer(serializers.ModelSerializer):
    nombre_salles = serializers.SerializerMethodField()
    salles = SalleSerializer(many=True, read_only=True)

    class Meta:
        model = Batiment
        fields = ['id', 'nom', 'code', 'adresse', 'ville', 'description', 'date_creation', 'nombre_salles', 'salles']

    def get_nombre_salles(self, obj):
        return obj.salles.count()

# ========== PHASES D'ARCHIVAGE ==========
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

# ========== BOÎTIER, DOSSIER, DOCUMENT ==========
class BoitierSerializer(serializers.ModelSerializer):
    armoire_nom = serializers.CharField(source='armoire.code', read_only=True)
    etagere_numero = serializers.IntegerField(source='etagere.numero', read_only=True)
    localisation = serializers.SerializerMethodField()
    taux_remplissage = serializers.FloatField(read_only=True)

    class Meta:
        model = Boitier
        fields = [
            'id', 'idboit', 'code_barre', 'titre', 'capacite',
            'armoire', 'armoire_nom', 'etagere', 'etagere_numero',
            'statut', 'date_creation', 'date_modification',
            'localisation', 'taux_remplissage', 'description'
        ]

    def get_localisation(self, obj):
        return obj.localisation_complete()

class DossierSerializer(serializers.ModelSerializer):
    nombre_documents = serializers.IntegerField(read_only=True)
    volume_total = serializers.IntegerField(read_only=True)
    phase_archive_nom = serializers.CharField(source='phaseArchive.nom', read_only=True)

    class Meta:
        model = Dossier
        fields = '__all__'

class DocumentSerializer(serializers.ModelSerializer):
    dossier_reference = serializers.CharField(source='dossier.reference', read_only=True)
    phase_archive_nom = serializers.CharField(source='phase_archive.nom', read_only=True)
    taille_fichier_lisible = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'idDoc', 'reference', 'titre', 'dossier', 'dossier_reference',
            'phase_archive', 'phase_archive_nom', 'date_creation',
            'niv_confidentialite', 'version', 'type_document', 'auteur',
            'description', 'fichier', 'taille_fichier', 'taille_fichier_lisible',
            'hash_fichier', 'date_entree', 'date_modification'
        ]
        read_only_fields = ['date_entree', 'date_modification', 'hash_fichier']

    def get_taille_fichier_lisible(self, obj):
        if obj.taille_fichier:
            size = obj.taille_fichier
            for unit in ['o', 'Ko', 'Mo', 'Go']:
                if size < 1024:
                    return f"{size:.2f} {unit}"
                size /= 1024
            return f"{size:.2f} To"
        return None

# ========== CONSULTATION, TRANSFERT, BORDEREAU ==========
class ConsultationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consultation
        fields = '__all__'

class TransfertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transfert
        fields = '__all__'

class BordereauSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bordereau
        fields = '__all__'