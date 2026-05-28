from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('archives', '0027_userprofile_verification'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='two_factor_code',
            field=models.CharField(blank=True, max_length=6, null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='two_factor_expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
