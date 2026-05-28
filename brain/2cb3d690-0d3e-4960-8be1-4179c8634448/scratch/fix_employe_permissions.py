import os
import re

file_path = r'c:\Users\user\Desktop\Smart-Archive\backend\archives\views.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace EstArchiviste with EstEmploye in ViewSets
content = content.replace('return [EstArchiviste()]', 'return [EstEmploye()]')

# Add perform_create to DossierViewSet
dossier_vset_pattern = r'class DossierViewSet\(viewsets.ModelViewSet\):'
content = re.sub(dossier_vset_pattern, r'class DossierViewSet(viewsets.ModelViewSet):\n    def perform_create(self, serializer):\n        user = self.request.user\n        if user_has_any_role(user, ["responsable", "employe"]) and not user.is_superuser:\n            if hasattr(user, "profile") and user.profile.direction:\n                serializer.save(direction=user.profile.direction)\n            else:\n                serializer.save()\n        else:\n            serializer.save()', content)

# Add perform_create to DocumentViewSet
document_vset_pattern = r'class DocumentViewSet\(viewsets.ModelViewSet\):'
content = re.sub(document_vset_pattern, r'class DocumentViewSet(viewsets.ModelViewSet):\n    def perform_create(self, serializer):\n        user = self.request.user\n        if user_has_any_role(user, ["responsable", "employe"]) and not user.is_superuser:\n            if hasattr(user, "profile") and user.profile.direction:\n                serializer.save(direction=user.profile.direction)\n            else:\n                serializer.save()\n        else:\n            serializer.save()', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
