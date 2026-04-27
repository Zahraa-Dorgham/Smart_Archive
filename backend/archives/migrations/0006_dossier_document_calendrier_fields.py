from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('archives', '0005_remove_document_archives_do_fk_id_d8646a_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='conservation_active_period',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='document',
            name='conservation_semi_active_period',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='document',
            name='sort_final_comment',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='document',
            name='sort_final_security_years',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='document',
            name='sort_final_type',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='dossier',
            name='conservation_active_period',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='dossier',
            name='conservation_semi_active_period',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='dossier',
            name='sort_final_comment',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='dossier',
            name='sort_final_security_years',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='dossier',
            name='sort_final_type',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
