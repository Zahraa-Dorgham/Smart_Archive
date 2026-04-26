from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

from archives.views import DEFAULT_ROLE_PERMISSIONS


class Command(BaseCommand):
    help = "Cree les groupes de roles par defaut"

    def handle(self, *args, **options):
        for role_name in DEFAULT_ROLE_PERMISSIONS.keys():
            group, created = Group.objects.get_or_create(name=role_name)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Groupe "{role_name}" cree'))
            else:
                self.stdout.write(f'Groupe "{role_name}" existe deja')
