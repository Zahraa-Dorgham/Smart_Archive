# archives/serializers.py - Version avec uniquement les modèles existants
from rest_framework import serializers
from .models import (
    ArchiveDefinitive, ArchiveIntermediaire, ArchiveCourant, Bordereau, Role, Direction, Batiment, Salle, Armoire, Etagere, PhaseArchive, Transfert, Consultation
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
    
    class Meta:
        model = Salle
        fields = ['id', 'nom', 'code', 'batiment', 'batiment_nom', 
                  'etage', 'description']

# Serializer pour Armoire
class ArmoireSerializer(serializers.ModelSerializer):
    salle_nom = serializers.CharField(source='salle.nom', read_only=True)
    
    class Meta:
        model = Armoire
        fields = ['id', 'code', 'salle', 'salle_nom', 
                   
                  'code_barres']

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
from .models import Boitier, Dossier, Document, Armoire, Etagere, PhaseArchive

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
            'localisation', 'taux_remplissage'
        ]

    def get_localisation(self, obj):
        return obj.localisation_complete()

class DossierSerializer(serializers.ModelSerializer):
    boitier_idboit = serializers.CharField(source='boitier.idboit', read_only=True)
    phaseArchive_nom = serializers.CharField(source='phaseArchive.nom', read_only=True)
    nombre_documents = serializers.IntegerField(read_only=True)
    volume_total = serializers.IntegerField(read_only=True)

    class Meta:
        model = Dossier
        fields = [
            'idDossier', 'nomDos', 'date_creation', 'date_cloture',
            'boitier', 'boitier_idboit', 'phaseArchive', 'phaseArchive_nom',
            'phaseType', 'dureeCourant', 'dureeIntermediaire', 'dureeDefinitive',
            'nombre_documents', 'volume_total'
        ]

class DocumentSerializer(serializers.ModelSerializer):
    dossier_reference = serializers.CharField(source='dossier.idDossier', read_only=True)
    dossier_nom = serializers.CharField(source='dossier.nomDos', read_only=True)
    phase_archive_nom = serializers.CharField(source='phase_archive.nom', read_only=True)
    taille_fichier_lisible = serializers.SerializerMethodField()
    calendrier_code = serializers.CharField(source='calendrier.code', read_only=True)
    calendrier_title = serializers.CharField(source='calendrier.title', read_only=True)

    class Meta:
        model = Document
        fields = [
            'id', 'idDoc', 'reference', 'titre', 'dossier', 'dossier_reference', 'dossier_nom',
            'phase_archive', 'phase_archive_nom', 'date_creation',
            'calendrier', 'calendrier_code', 'calendrier_title',
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
    class Meta:
        model = Transfert
        fields = '__all__'

# --- Bordereau ---
class BordereauSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bordereau
        fields = '__all__'




from django.contrib.auth.models import Group

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']




from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    groups = serializers.StringRelatedField(many=True, read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'groups']
		
		
		
