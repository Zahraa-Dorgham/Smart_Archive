from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
import hashlib

# ========== ROLE ==========
class Role(models.Model):
    nom = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    isDefault = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)   # auto_now_add remplacé
    updated_at = models.DateTimeField(default=timezone.now)   # auto_now remplacé

    class Meta:
        verbose_name = "Rôle"
        verbose_name_plural = "Rôles"
        ordering = ['nom']

    def __str__(self):
        return self.nom

# ========== BATIMENT ==========
class Batiment(models.Model):
    nom = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True, blank=True, null=True)
    adresse = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    date_creation = models.DateTimeField(default=timezone.now)
    ville = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = "Bâtiment"
        verbose_name_plural = "Bâtiments"
        ordering = ['nom']

    def __str__(self):
        return f"{self.code} - {self.nom}" if self.code else self.nom

# ========== SALLE ==========
class Salle(models.Model):
    nom = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True, blank=True, null=True)
    batiment = models.ForeignKey(Batiment, on_delete=models.CASCADE, related_name='salles')
    etage = models.IntegerField(default=0)
    type_salle = models.CharField(max_length=50, default='ARCHIVE')
    description = models.TextField(blank=True)
    dimensions = models.CharField(max_length=100, blank=True, null=True)
    volume = models.FloatField(default=0.0)

    class Meta:
        verbose_name = "Salle"
        verbose_name_plural = "Salles"
        ordering = ['batiment', 'nom']
        unique_together = ['batiment', 'nom']

    def __str__(self):
        return f"{self.code} - {self.nom}" if self.code else f"{self.nom} - {self.batiment.nom}"

# ========== ARMOIRE ==========
class Armoire(models.Model):
    code = models.CharField(max_length=50, unique=True)
    salle = models.ForeignKey(Salle, on_delete=models.CASCADE, related_name='armoires')
    code_barres = models.CharField(max_length=100, unique=True, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    type_armoire = models.CharField(max_length=50, default='METAL')
    date_installation = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Armoire"
        verbose_name_plural = "Armoires"
        ordering = ['salle', 'code']

    def nombre_etageres(self):
        return self.etageres.count()

# ========== ETAGERE ==========
class Etagere(models.Model):
    armoire = models.ForeignKey(Armoire, on_delete=models.CASCADE, related_name='etageres')
    numero = models.IntegerField()
    code_barres = models.CharField(max_length=100, unique=True, null=True, blank=True)
    capacite_max_boites = models.IntegerField(default=10)
    occupation_actuelle = models.IntegerField(default=0)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Étagère"
        verbose_name_plural = "Étagères"
        ordering = ['armoire', 'numero']
        unique_together = ['armoire', 'numero']

    def __str__(self):
        return f"{self.armoire.code} - Étagère {self.numero}"

# ========== PHASES D'ARCHIVAGE ==========
class PhaseArchive(models.Model):
    
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    dateDebut = models.DateField(null=True, blank=True)
    dateFin = models.DateField(null=True, blank=True)
    deletedAt = models.DateTimeField(null=True, blank=True)
    createdAt = models.DateTimeField(default=timezone.now)   
    updatedAt = models.DateTimeField(default=timezone.now)   
    anneeSecurite = models.IntegerField(null=True, blank=True)

    class Meta:
        verbose_name = "Phase d'archivage"
        verbose_name_plural = "Phases d'archivage"

    def __str__(self):
        return self.nom

class ArchiveCourant(models.Model):
    phase = models.OneToOneField(PhaseArchive, on_delete=models.CASCADE, primary_key=True)
    duree = models.IntegerField(default=3)
    directionResponsable = models.CharField(max_length=200)

class ArchiveIntermediaire(models.Model):
    phase = models.OneToOneField(PhaseArchive, on_delete=models.CASCADE, primary_key=True)
    duree = models.IntegerField(default=10)

class ArchiveDefinitive(models.Model):
    phase = models.OneToOneField(PhaseArchive, on_delete=models.CASCADE, primary_key=True)
    dispositionFinale = models.CharField(max_length=200)
    dateDisposition = models.DateField()
    anneeSecurite = models.IntegerField()

# ========== BOITIER ==========
class Boitier(models.Model):
    STATUT_CHOICES = [
        ('ACTIF', 'Actif'),
        ('PLEIN', 'Plein'),
        ('ARCHIVE', 'Archivé'),
        ('EN_TRANSFERT', 'En transfert'),
        ('EN_PREPARATION', 'En préparation'),
    ]
    idboit = models.CharField(max_length=50, unique=True)
    code_barre = models.CharField(max_length=100, unique=True)
    titre = models.CharField(max_length=200)
    capacite = models.IntegerField()
    armoire = models.ForeignKey(Armoire, on_delete=models.SET_NULL, null=True, blank=True, related_name='boitiers')
    etagere = models.ForeignKey(Etagere, on_delete=models.SET_NULL, null=True, blank=True, related_name='boitiers')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='ACTIF')
    date_creation = models.DateTimeField(default=timezone.now)
    date_modification = models.DateTimeField(default=timezone.now)
    description = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Boîtier"
        ordering = ['idboit']
        indexes = [models.Index(fields=['idboit']), models.Index(fields=['code_barre']), models.Index(fields=['statut'])]

    def __str__(self):
        return f"{self.idboit} - {self.titre}"

    def calculer_taux_remplissage(self):
        total = self.dossiers.count()
        return (total / self.capacite) * 100 if self.capacite > 0 else 0

    @property
    def taux_remplissage(self):
        return self.calculer_taux_remplissage()

    def est_plein(self):
        return self.dossiers.count() >= self.capacite

    def ajouter_dossier(self, dossier):
        if self.est_plein():
            return False, "Le boîtier est plein"
        dossier.boitier = self
        dossier.save()
        if self.est_plein():
            self.statut = 'PLEIN'
            self.save()
        return True, f"Dossier {dossier.idDossier} ajouté"

    def retirer_dossier(self, dossier):
        if dossier.boitier != self:
            return False, "Ce dossier n'est pas dans ce boîtier"
        dossier.boitier = None
        dossier.save()
        if self.statut == 'PLEIN':
            self.statut = 'ACTIF'
            self.save()
        return True, f"Dossier {dossier.idDossier} retiré"

    def localisation_complete(self):
        parts = []
        if self.armoire:
            if self.armoire.salle:
                if self.armoire.salle.batiment:
                    parts.append(self.armoire.salle.batiment.nom)
                parts.append(self.armoire.salle.nom)
            parts.append(f"Armoire {self.armoire.code}")
        
        if self.etagere:
            parts.append(f"Étagère {self.etagere.numero}")
        
        if not parts:
            return "Non localisé"
        return " > ".join(parts)

# ========== DOSSIER (unique et complet) ==========
class Dossier(models.Model):
    idDossier = models.AutoField(primary_key=True)
    nomDos = models.CharField(max_length=255, null=True, blank=True)
    date_creation = models.DateField()
    date_cloture = models.DateField(null=True, blank=True)
    boitier = models.ForeignKey(Boitier, on_delete=models.SET_NULL, null=True, blank=True, related_name='dossiers')
    phaseArchive = models.ForeignKey(PhaseArchive, on_delete=models.SET_NULL, null=True)
    phaseType = models.CharField(max_length=50, default="COURANTE")   # valeur par défaut
    dureeCourant = models.IntegerField(default=3)
    dureeIntermediaire = models.IntegerField(default=10)
    dureeDefinitive = models.IntegerField(default=100)

    class Meta:
        verbose_name = "Dossier"

    def __str__(self):
        return f"Dossier {self.idDossier}"

    def nombre_documents(self):
        return self.documents.count()

    def ajouter_document(self, document):
        document.dossier = self
        document.save()
        return True, f"Document {document.reference} ajouté"

    def volume_total(self):
        return sum(doc.taille_fichier or 0 for doc in self.documents.all())

    def peut_etre_transfere(self):
        return all(doc.est_transferable() for doc in self.documents.all())

    def lier_boitier(self, boitier):
        if boitier.est_plein():
            return False, "Le boîtier est plein"
        self.boitier = boitier
        self.save()
        boitier.ajouter_dossier(self)
        return True, f"Dossier lié au boîtier {boitier.idboit}"

# ========== DOCUMENT ==========
class Document(models.Model):
    NIV_CONFIDENTIALITE = [('PUBLIC', 'Public'), ('INTERNE', 'Interne'), ('CONFIDENTIEL', 'Confidentiel'), ('SECRET', 'Secret')]
    TYPE_DOCUMENT = [('CONTRAT', 'Contrat'), ('FACTURE', 'Facture'), ('RAPPORT', 'Rapport'), ('COURRIER', 'Courrier'), ('FORMULAIRE', 'Formulaire'), ('AUTRE', 'Autre')]

    idDoc = models.CharField(max_length=50, unique=True)
    reference = models.CharField(max_length=100, unique=True)
    titre = models.CharField(max_length=500)
    dossier = models.ForeignKey(Dossier, on_delete=models.CASCADE, related_name='documents')
    phase_archive = models.ForeignKey(PhaseArchive, on_delete=models.PROTECT, related_name='documents')
    date_creation = models.DateField()
    niv_confidentialite = models.CharField(max_length=20, choices=NIV_CONFIDENTIALITE, default='INTERNE')
    version = models.IntegerField(default=1)
    type_document = models.CharField(max_length=20, choices=TYPE_DOCUMENT, default='AUTRE')
    auteur = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    fichier = models.FileField(upload_to='documents/%Y/%m/', null=True, blank=True)
    taille_fichier = models.BigIntegerField(null=True, blank=True)
    hash_fichier = models.CharField(max_length=64, blank=True)
    date_entree = models.DateTimeField(default=timezone.now)
    date_modification = models.DateTimeField(default=timezone.now)
    historique_versions = models.JSONField(default=list, blank=True)
    historique_consultations = models.JSONField(default=list, blank=True)

    class Meta:
        verbose_name = "Document"
        ordering = ['-date_creation', 'reference']
        indexes = [models.Index(fields=['idDoc']), models.Index(fields=['reference']), models.Index(fields=['phase_archive'])]

    def __str__(self):
        return f"{self.reference} - {self.titre}"

    def modifier_version(self, nouveau_fichier, utilisateur=None, commentaire=""):
        ancienne_version = {'version': self.version, 'fichier': self.fichier.name if self.fichier else None, 'date': str(timezone.now()), 'utilisateur': utilisateur.username if utilisateur else 'Système', 'commentaire': commentaire}
        self.historique_versions.append(ancienne_version)
        self.version += 1
        self.fichier = nouveau_fichier
        self.date_modification = timezone.now()
        if nouveau_fichier:
            self.taille_fichier = nouveau_fichier.size
            self.hash_fichier = self._calculer_hash(nouveau_fichier)
        self.save()
        return True, f"Nouvelle version {self.version} créée"

    def _calculer_hash(self, fichier):
        sha256 = hashlib.sha256()
        for chunk in fichier.chunks():
            sha256.update(chunk)
        return sha256.hexdigest()

    def changer_phase(self, nouvelle_phase, utilisateur=None, commentaire=""):
        ancienne_phase = self.phase_archive
        if ancienne_phase == nouvelle_phase:
            return False, "Document déjà dans cette phase"
        # Suppression de la vérification phase_suivante (inexistante)
        self.phase_archive = nouvelle_phase
        self.save()
        if self.dossier.phaseArchive != nouvelle_phase:
            self.dossier.phaseArchive = nouvelle_phase
            self.dossier.save()
        return True, f"Document passé en phase {nouvelle_phase.nom}"

    def consulter(self, utilisateur=None):
        consultation = {'date': str(timezone.now()), 'utilisateur': utilisateur.username if utilisateur else 'Anonyme', 'ip': None}
        self.historique_consultations.append(consultation)
        self.save(update_fields=['historique_consultations'])
        return True

    def verifier_expiration(self):
        # Simplifié car phase_archive n'a pas duree_conservation. On utilise les durées du dossier parent ?
        return False  # À implémenter selon besoin

    def jours_restants(self):
        return 0

    def est_transferable(self):
        return False

    def action_recommandee(self):
        return "Aucune"

# ========== CONSULTATION ==========
class Consultation(models.Model):
    direction = models.CharField(max_length=200)
    consultation = models.TextField()
    poste = models.CharField(max_length=100, blank=True)
    date_demande = models.DateTimeField(default=timezone.now)
    reasonForRejection = models.TextField(blank=True)
    approvedBy = models.CharField(max_length=100, blank=True)
    rejectedBy = models.CharField(max_length=100, blank=True)
    approvalDate = models.DateTimeField(null=True, blank=True)
    rejectionDate = models.DateTimeField(null=True, blank=True)
    allitemsReturned = models.BooleanField(default=False)
    createdBy = models.CharField(max_length=100, blank=True)
    modifiedBy = models.CharField(max_length=100, blank=True)
    createdAt = models.DateTimeField(default=timezone.now)
    updatedAt = models.DateTimeField(default=timezone.now)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='consultations')

    class Meta:
        verbose_name = "Consultation"

    def __str__(self):
        return f"Consultation {self.document.reference} - {self.date_demande}"

# ========== TRANSFERT ==========
class Transfert(models.Model):
    reference = models.CharField(max_length=100, unique=False, null=True, blank=True)  # nullable
    bordereauxReference = models.CharField(max_length=100, blank=True)
    typeTransfer = models.CharField(max_length=50, default='INTERNE')  # ← AJOUTER default
    date_demande = models.DateTimeField(default=timezone.now)
    date_execution = models.DateTimeField(null=True, blank=True)
    statut = models.CharField(max_length=20, default='EN_ATTENTE')
    document = models.ForeignKey(Document, on_delete=models.SET_NULL, null=True, blank=True)
    dossier = models.ForeignKey(Dossier, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name = "Transfert"

    def __str__(self):
        return self.reference if self.reference else f"Transfert {self.id}"

# ========== BORDEREAU ==========
class Bordereau(models.Model):
    idBordereau = models.AutoField(primary_key=True)
    contenu = models.TextField()
    pdf_generé = models.FileField(upload_to='bordereaux/')
   

    class Meta:
        verbose_name = "Bordereau"

    def __str__(self):
        return f"Bordereau {self.idBordereau}"