from rest_framework import permissions

ROLE_ALIASES = {
    "admin": {"Admin", "Administrateur"},
    "archiviste": {"Archiviste"},
    "responsable": {"Responsable"},
    "employe": {"Employe", "Employe", "Employé"},
}


def user_has_any_role(user, aliases):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True

    allowed_names = set()
    for alias in aliases:
        allowed_names.update(ROLE_ALIASES.get(alias, {alias}))

    return user.groups.filter(name__in=allowed_names).exists()


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
