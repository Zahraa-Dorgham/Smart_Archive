# archives/serializers.py - Version avec uniquement les modèles existants
from rest_framework import serializers
from .models import (
    DemandeConsultation, Role, Batiment, Salle, Armoire, Etagere, PhaseArchive, Transfert
    # Retirez Boitier, Dossier, Document, Service s'ils n'existent pas
)

# Serializer pour Role
class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'nom', 'description']

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
        fields = ['id', 'nom', 'code', 'batiment', 'batiment_nom', 'type_salle', 
                  'etage', 'description']

# Serializer pour Armoire
class ArmoireSerializer(serializers.ModelSerializer):
    salle_nom = serializers.CharField(source='salle.nom', read_only=True)
    
    class Meta:
        model = Armoire
        fields = ['id', 'code', 'salle', 'salle_nom', 
                   
                  'code_barres', 'description', 'date_installation']

# Serializer pour Etagere
class EtagereSerializer(serializers.ModelSerializer):
    armoire_code = serializers.CharField(source='armoire.code', read_only=True)
    
    class Meta:
        model = Etagere
        fields = ['id', 'armoire', 'armoire_code', 'numero', 'code_barres',
                  'capacite_max_boites', 'occupation_actuelle', 'description']

# Serializer pour PhaseArchive
class PhaseArchiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhaseArchive
        fields = ['id', 'nom', 'code', 'type_phase', 'duree_conservation',
                  'description', 'action_finale', 'ordre']
        
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
            'statut', 'description', 'date_creation', 'date_modification',
            'localisation', 'taux_remplissage'
        ]

    def get_localisation(self, obj):
        return obj.localisation_complete()

class DossierSerializer(serializers.ModelSerializer):
    boitier_idboit = serializers.CharField(source='boitier.idboit', read_only=True)
    phase_archive_nom = serializers.CharField(source='phase_archive.nom', read_only=True)
    nombre_documents = serializers.IntegerField(read_only=True)  # méthode du modèle

    class Meta:
        model = Dossier
        fields = [
            'id', 'idDossier', 'reference', 'titre', 'description',
            'boitier', 'boitier_idboit', 'phase_archive', 'phase_archive_nom',
            'date_creation', 'date_cloture', 'statut', 'niveau_confidentialite',
            'nombre_documents'
        ]

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




from django.contrib.auth.models import Group

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']



class DemandeConsultationSerializer(serializers.ModelSerializer):
    employe_nom = serializers.CharField(source='employe.username', read_only=True)
    document_titre = serializers.CharField(source='document.titre', read_only=True)

    class Meta:
        model = DemandeConsultation
        fields = '__all__'
        read_only_fields = ['date_demande', 'statut']


class TransfertSerializer(serializers.ModelSerializer):
    demandeur_nom = serializers.CharField(source='demandeur.username', read_only=True)
    validateur_nom = serializers.CharField(source='validateur.username', read_only=True)

    class Meta:
        model = Transfert
        fields = '__all__'
        read_only_fields = ['date_demande', 'statut', 'date_validation']









from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    groups = serializers.StringRelatedField(many=True, read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'groups']