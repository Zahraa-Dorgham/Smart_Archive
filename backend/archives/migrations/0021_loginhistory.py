from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('archives', '0020_document_action_finale_alter_transfert_typetransfer_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='LoginHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('login_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='login_history', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Historique de connexion',
                'verbose_name_plural': 'Historiques de connexion',
                'ordering': ['-login_at'],
            },
        ),
        migrations.AddIndex(
            model_name='loginhistory',
            index=models.Index(fields=['-login_at'], name='archives_lo_login_a_ddd7f5_idx'),
        ),
        migrations.AddIndex(
            model_name='loginhistory',
            index=models.Index(fields=['user', '-login_at'], name='archives_lo_user_id_2af41f_idx'),
        ),
    ]
