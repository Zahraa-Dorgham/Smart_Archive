import unicodedata

from rest_framework import permissions

ROLE_ALIASES = {
    "admin": {"admin", "administrateur"},
    "archiviste": {"archiviste"},
    "responsable": {"responsable"},
    "employe": {"Employe", "Employe", "Employé"},
}


def normalize_role_name(role):
    value = (role or "").strip().lower()
    value = unicodedata.normalize("NFKD", value)
    return "".join(char for char in value if not unicodedata.combining(char))


def user_has_any_role(user, aliases):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True

    allowed_names = set()
    for alias in aliases:
        allowed_names.update(ROLE_ALIASES.get(alias, {alias}))
    normalized_allowed_names = {normalize_role_name(name) for name in allowed_names}
    user_role_names = {
        normalize_role_name(name)
        for name in user.groups.values_list("name", flat=True)
    }

    return bool(user_role_names.intersection(normalized_allowed_names))


class EstAdministrateur(permissions.BasePermission):
    message = "Vous devez etre administrateur pour effectuer cette action."

    def has_permission(self, request, view):
        return user_has_any_role(request.user, ["admin"])


class EstArchiviste(permissions.BasePermission):
    message = "Vous devez etre archiviste pour effectuer cette action."

    def has_permission(self, request, view):
        return user_has_any_role(request.user, ["admin", "archiviste"])


class EstResponsable(permissions.BasePermission):
    message = "Vous devez etre responsable pour effectuer cette action."

    def has_permission(self, request, view):
        return user_has_any_role(request.user, ["admin", "archiviste", "responsable"])


class EstResponsableValidateur(permissions.BasePermission):
    message = "Vous devez etre responsable pour valider un transfert."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.is_staff:
            return True
        return user_has_any_role(user, ["admin", "responsable"])


class EstEmploye(permissions.BasePermission):
    def has_permission(self, request, view):
        return user_has_any_role(request.user, ["admin", "archiviste", "responsable", "employe"])


class PeutModifierDocument(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return user_has_any_role(request.user, ["admin", "archiviste"])


class EstProprietaireOuArchive(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if hasattr(obj, "created_by") and obj.created_by == request.user:
            return True

        return user_has_any_role(request.user, ["admin", "archiviste"])


class EstLectureAutorisee(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method not in permissions.SAFE_METHODS:
            return False
        return user_has_any_role(request.user, ["admin", "archiviste", "responsable", "employe"])
