import os
import re

file_path = r'c:\Users\user\Desktop\Smart-Archive\backend\archives\views.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern for get_queryset filtering logic
pattern = r'if user_has_any_role\(user, \["responsable"\]\):\n\s+try:\n\s+if hasattr\(user, \'profile\'\) and user.profile.direction:\n\s+return qs.filter\(direction=user.profile.direction\)'

# New filtering logic
replacement = """if user_has_any_role(user, ["responsable", "employe"]):
            try:
                if hasattr(user, 'profile') and user.profile.direction:
                    direction = user.profile.direction
                    return qs.filter(Q(direction=direction) | Q(calendrier__direction=direction)).distinct()"""

new_content = re.sub(pattern, replacement, content)

# Also fix the default return at the end of get_queryset
new_content = new_content.replace('return qs\n\n    def get_permissions', 'return qs.none()\n\n    def get_permissions')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
