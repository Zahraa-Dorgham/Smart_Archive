from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('archives', '0009_ensure_calendrier_foreign_keys'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='date_pass_final',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='document',
            name='date_pass_final_real',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='document',
            name='date_pass_intermediaire',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='document',
            name='date_pass_intermediaire_real',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='dossier',
            name='date_pass_final',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='dossier',
            name='date_pass_final_real',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='dossier',
            name='date_pass_intermediaire',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='dossier',
            name='date_pass_intermediaire_real',
            field=models.DateField(blank=True, null=True),
        ),
    ]
