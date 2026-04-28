#!/usr/bin/env python
"""Test script for document creation"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myapp.settings')
django.setup()

from archives.models import Document, Dossier, PhaseArchive
from datetime import date
from django.utils import timezone

def test_create_document():
    """Test creating a document with minimal required fields"""
    try:
        # Create or get a dossier
        dossier, created = Dossier.objects.get_or_create(
            idDossier=1,
            defaults={
                'nomDos': 'Test Dossier',
                'phaseType': 'COURANTE',
                'dureeCourant': 3,
                'dureeIntermediaire': 10,
                'dureeDefinitive': 100
            }
        )
        print(f"✓ Dossier: {dossier} {'(créé)' if created else '(existant)'}")
        
        # Create a document with minimal fields
        doc = Document.objects.create(
            idDoc='TEST-001',
            titre='Test Document',
            dossier=dossier,
            niv_confidentialite='INTERNE',
            # date_creation is optional with default
            # reference is optional
            # phase_archive is optional
        )
        print(f"✓ Document créé: {doc}")
        print(f"  - idDoc: {doc.idDoc}")
        print(f"  - titre: {doc.titre}")
        print(f"  - date_creation: {doc.date_creation}")
        print(f"  - reference: {doc.reference}")
        print(f"  - phase_archive: {doc.phase_archive}")
        
        # Test with date_creation
        doc2 = Document.objects.create(
            idDoc='TEST-002',
            titre='Test Document 2',
            dossier=dossier,
            niv_confidentialite='INTERNE',
            date_creation=date.today()
        )
        print(f"✓ Document 2 créé: {doc2}")
        print(f"  - date_creation: {doc2.date_creation}")
        
        # Test __str__ with null reference
        print(f"\n✓ Test __str__ method:")
        print(f"  - doc.reference is None: {doc.reference is None}")
        print(f"  - str(doc): {str(doc)}")
        
        print("\n✓ Tous les tests sont passés!")
        return True
    except Exception as e:
        print(f"✗ Erreur: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    test_create_document()
