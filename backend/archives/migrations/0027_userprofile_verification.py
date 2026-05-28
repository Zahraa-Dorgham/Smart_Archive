from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('archives', '0026_transfert_archiviste_responsable'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='is_verified',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='verification_token',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
