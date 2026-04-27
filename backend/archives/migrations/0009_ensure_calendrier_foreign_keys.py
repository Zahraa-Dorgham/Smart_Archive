from django.db import migrations


def _ensure_calendrier_foreign_keys(apps, schema_editor):
    connection = schema_editor.connection

    if connection.vendor != 'mysql':
        return

    cursor = connection.cursor()
    try:
        def column_exists(table_name, column_name):
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = %s
                  AND COLUMN_NAME = %s
                """,
                [table_name, column_name],
            )
            return cursor.fetchone()[0] > 0

        def foreign_keys_for_column(table_name, column_name):
            cursor.execute(
                """
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = %s
                  AND COLUMN_NAME = %s
                  AND REFERENCED_TABLE_NAME IS NOT NULL
                """,
                [table_name, column_name],
            )
            return [row[0] for row in cursor.fetchall()]

        def constraint_exists(table_name, constraint_name):
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM information_schema.TABLE_CONSTRAINTS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = %s
                  AND CONSTRAINT_NAME = %s
                """,
                [table_name, constraint_name],
            )
            return cursor.fetchone()[0] > 0

        def ensure_fk(table_name, constraint_name):
            if not column_exists(table_name, 'calendrier_id'):
                return

            for fk_name in foreign_keys_for_column(table_name, 'calendrier_id'):
                if fk_name != constraint_name:
                    cursor.execute(f"ALTER TABLE {table_name} DROP FOREIGN KEY {fk_name}")

            cursor.execute(
                f"""
                ALTER TABLE {table_name}
                MODIFY COLUMN calendrier_id CHAR(32)
                CHARACTER SET utf8mb4
                COLLATE utf8mb4_unicode_ci
                NULL
                """
            )

            if not constraint_exists(table_name, constraint_name):
                cursor.execute(
                    f"""
                    ALTER TABLE {table_name}
                    ADD CONSTRAINT {constraint_name}
                    FOREIGN KEY (calendrier_id)
                    REFERENCES calendrier_calendrier (id)
                    ON DELETE SET NULL
                    """
                )

        ensure_fk('archives_document', 'archives_document_calendrier_id_fk')
        ensure_fk('archives_dossier', 'archives_dossier_calendrier_id_fk')
    finally:
        cursor.close()


class Migration(migrations.Migration):

    dependencies = [
        ('archives', '0008_fix_calendrier_uuid_columns'),
    ]

    operations = [
        migrations.RunPython(_ensure_calendrier_foreign_keys, migrations.RunPython.noop),
    ]
