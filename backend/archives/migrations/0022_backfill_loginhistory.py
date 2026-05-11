from django.conf import settings
from django.db import migrations


def backfill_login_history(apps, schema_editor):
    LoginHistory = apps.get_model('archives', 'LoginHistory')
    User = apps.get_model(*settings.AUTH_USER_MODEL.split('.'))

    histories = []
    existing_user_ids = set(LoginHistory.objects.values_list('user_id', flat=True))

    for user in User.objects.filter(last_login__isnull=False).exclude(id__in=existing_user_ids):
        histories.append(LoginHistory(user_id=user.id, login_at=user.last_login))

    if histories:
        LoginHistory.objects.bulk_create(histories)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('archives', '0021_loginhistory'),
    ]

    operations = [
        migrations.RunPython(backfill_login_history, noop_reverse),
    ]
