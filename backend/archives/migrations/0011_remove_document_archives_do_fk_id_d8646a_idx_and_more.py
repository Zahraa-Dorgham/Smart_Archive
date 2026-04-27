import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('archives', '0010_dossier_document_transition_dates'),
        ('calendrier', '0004_recreate_calendrier'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.RemoveIndex(
                    model_name='document',
                    name='archives_do_fk_id_d8646a_idx',
                ),
                migrations.AlterField(
                    model_name='document',
                    name='calendrier',
                    field=models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='documents',
                        to='calendrier.calendrier',
                    ),
                ),
            ],
        ),
    ]
