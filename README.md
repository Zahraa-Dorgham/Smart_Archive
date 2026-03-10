# Plateforme Intelligente d'Archivage et de Gestion Documentaire

 **Projet de Fin d'Études (PFE)** : Système expert conforme à l'**ISO 15489** et à la réglementation tunisienne, intégrant l'Intelligence Artificielle pour l'automatisation archivistique.

---

## Présentation du Projet
Ce système gère le cycle de vie complet des documents (archives courantes, intermédiaires et définitives). Il combine la gestion des emplacements physiques (entrepôts, étagères) et la dématérialisation numérique sécurisée.

### Points Clés :
- **Conformité :** Respect strict de la norme ISO 15489.
- **IA Intégrée :** OCR pour la numérisation et classification automatique des métadonnées.
- **Traçabilité :** Suivi complet via QR Codes/Codes-barres et bordereaux de transfert.

---

## Stack Technique
- **Backend :** Django (Python 3.14) & Django REST Framework (API)
- **Frontend :** Angular (21.2.1)
- **Base de données :** MySQL
- **Outils :** JWT (Authentification)

---

## Fonctionnalités Principales

### Gestion Physique & Logique
- **Hiérarchie :** Boîte ➔ Dossier ➔ Document.
- **Localisation :** Bâtiment > Salle > Armoire > Étagère.


---


## Installation (Développement)

### Backend (Django)

cd backend
python -m venv venv
source venv/bin/activate  # /.virtualenvs/backend-cb2btdbp/Scripts/Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

---
### Frontend (Angular)
cd frontend
npm install
ng serve
