import django.db.models.deletion
from django.db import migrations, models


def _reconcile_dossier_calendrier_column(apps, schema_editor):
    connection = schema_editor.connection
    table = 'archives_dossier'

    cursor = connection.cursor()
    try:
        cursor.execute(
            """
            SELECT COUNT(*)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = %s
              AND COLUMN_NAME = %s
            """,
            [table, 'calendrier_id'],
        )
        has_column = cursor.fetchone()[0] > 0

        if not has_column:
            if connection.vendor == 'mysql':
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN calendrier_id char(32) NULL")
            else:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN calendrier_id varchar(32) NULL")
    finally:
        cursor.close()


class Migration(migrations.Migration):

    dependencies = [
        ('calendrier', '0001_initial'),
        ('archives', '0006_dossier_document_calendrier_fields'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(_reconcile_dossier_calendrier_column, migrations.RunPython.noop),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='dossier',
                    name='calendrier',
                    field=models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='dossiers',
                        to='calendrier.calendrier',
                    ),
                ),
            ],
        ),
    ]
