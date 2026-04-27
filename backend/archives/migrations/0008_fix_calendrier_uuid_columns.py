from django.db import migrations


def _fix_calendrier_uuid_columns(apps, schema_editor):
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

        def index_exists(table_name, index_name):
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM information_schema.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = %s
                  AND INDEX_NAME = %s
                """,
                [table_name, index_name],
            )
            return cursor.fetchone()[0] > 0

        def ensure_char32_column(table_name, index_name):
            if not column_exists(table_name, 'calendrier_id'):
                return

            for fk_name in foreign_keys_for_column(table_name, 'calendrier_id'):
                cursor.execute(f"ALTER TABLE {table_name} DROP FOREIGN KEY {fk_name}")

            cursor.execute(f"ALTER TABLE {table_name} MODIFY COLUMN calendrier_id char(32) NULL")

            if not index_exists(table_name, index_name):
                cursor.execute(f"CREATE INDEX {index_name} ON {table_name} (calendrier_id)")

        ensure_char32_column('archives_document', 'archives_do_calendr_a766e5_idx')
        ensure_char32_column('archives_dossier', 'archives_do_calendr_7b98c6_idx')
    finally:
        cursor.close()


class Migration(migrations.Migration):

    dependencies = [
        ('archives', '0007_dossier_calendrier'),
    ]

    operations = [
        migrations.RunPython(_fix_calendrier_uuid_columns, migrations.RunPython.noop),
    ]
