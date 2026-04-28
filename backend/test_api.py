#!/usr/bin/env python
"""Test script to debug API errors"""
import requests
import json

# Configuration
API_URL = "http://localhost:8000/api"
DOSSIER_ID = 1

def get_token():
    """Get authentication token"""
    # Si vous utilisez JWT ou autre auth, ajoutez ici
    return None

def test_document_creation():
    """Test creating a document via API"""
    
    # Données minimales pour créer un document
    data = {
        'idDoc': 'TEST-001',
        'titre': 'Test Document',
        'dossier': DOSSIER_ID,
        'niv_confidentialite': 'INTERNE',
        # Autres champs optionnels
    }
    
    headers = {
        'Content-Type': 'application/json',
    }
    
    print("Tentative de création de document via API...")
    print(f"URL: {API_URL}/documents/")
    print(f"Données: {json.dumps(data, indent=2)}")
    print()
    
    try:
        response = requests.post(f"{API_URL}/documents/", json=data, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body:\n{response.text}")
        
        if response.status_code >= 400:
            print(f"\n✗ Erreur {response.status_code}")
            try:
                error_data = response.json()
                print(f"Erreur détaillée: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Erreur (texte): {response.text}")
        else:
            print(f"\n✓ Succès")
            print(f"Document créé: {response.json()}")
            
    except Exception as e:
        print(f"✗ Exception: {e}")

def test_dossier_creation():
    """Test creating a dossier via API"""
    
    data = {
        'nomDos': 'Test Dossier',
        'phaseType': 'COURANTE',
        'dureeCourant': 3,
        'dureeIntermediaire': 10,
        'dureeDefinitive': 100,
    }
    
    headers = {
        'Content-Type': 'application/json',
    }
    
    print("\nTentative de création de dossier via API...")
    print(f"URL: {API_URL}/dossiers/")
    print(f"Données: {json.dumps(data, indent=2)}")
    print()
    
    try:
        response = requests.post(f"{API_URL}/dossiers/", json=data, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body:\n{response.text}")
        
        if response.status_code >= 400:
            print(f"\n✗ Erreur {response.status_code}")
            try:
                error_data = response.json()
                print(f"Erreur détaillée: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Erreur (texte): {response.text}")
        else:
            print(f"\n✓ Succès")
            print(f"Dossier créé: {response.json()}")
            
    except Exception as e:
        print(f"✗ Exception: {e}")

if __name__ == '__main__':
    print("=== Test API Documents ===\n")
    test_dossier_creation()
    test_document_creation()
