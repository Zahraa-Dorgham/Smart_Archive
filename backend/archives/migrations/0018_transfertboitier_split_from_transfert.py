from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('archives', '0017_transfert_boitier_replace_document_dossier'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='transfert',
            name='boitier',
        ),
        migrations.CreateModel(
            name='TransfertBoitier',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('boitier', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transfert_boitiers', to='archives.boitier')),
                ('transfert', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transfert_boitiers', to='archives.transfert')),
            ],
            options={
                'verbose_name': 'Transfert Boitier',
            },
        ),
    ]
