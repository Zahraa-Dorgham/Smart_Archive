from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('archives', '0018_transfertboitier_split_from_transfert'),
    ]

    operations = [
        migrations.AlterField(
            model_name='transfert',
            name='typeTransfer',
            field=models.CharField(choices=[('INTERMEDIAIRE', 'Intermediaire'), ('FINAL', 'Final')], default='INTERMEDIAIRE', max_length=50),
        ),
    ]
