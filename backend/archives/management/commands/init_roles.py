# archives/management/commands/init_roles.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group

class Command(BaseCommand):
    help = 'Crée les groupes de rôles'

    def handle(self, *args, **options):
        groupes = ['Administrateur', 'Archiviste', 'Responsable', 'Employé']
        for nom in groupes:
            group, created = Group.objects.get_or_create(name=nom)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Groupe "{nom}" créé'))
            else:
                self.stdout.write(f'Groupe "{nom}" existe déjà')