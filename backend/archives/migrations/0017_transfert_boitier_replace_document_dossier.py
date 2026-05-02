from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('archives', '0016_alter_action_finale_defaults'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='transfert',
            name='document',
        ),
        migrations.RemoveField(
            model_name='transfert',
            name='dossier',
        ),
        migrations.AddField(
            model_name='transfert',
            name='boitier',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='transferts', to='archives.boitier'),
        ),
    ]
