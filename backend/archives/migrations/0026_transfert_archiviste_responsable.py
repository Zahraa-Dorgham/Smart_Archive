# Generated manually on 2026-05-27

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('archives', '0025_document_action_finale_userprofile_adresse_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='transfert',
            name='archiviste',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='transferts_initialises',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='transfert',
            name='responsable',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='transferts_valides',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
