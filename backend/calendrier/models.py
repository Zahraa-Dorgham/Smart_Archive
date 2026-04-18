import uuid
from django.db import models


class Calendrier(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_dossier = models.BooleanField(default=False)
    parent = models.ForeignKey('self', null=True, blank=True, related_name='children', on_delete=models.SET_NULL)
    exemplaire_type = models.CharField(max_length=255, blank=True, null=True)
    direction = models.ForeignKey('archives.Direction', null=True, blank=True, on_delete=models.SET_NULL, related_name='calendriers')
    sous_direction_id = models.CharField(max_length=255, blank=True, null=True)
    unit_responsable = models.CharField(max_length=255, blank=True, null=True)
    conservation_active_period = models.IntegerField(blank=True, null=True)
    conservation_semi_active_period = models.IntegerField(blank=True, null=True)
    sort_final_type = models.CharField(max_length=255, blank=True, null=True)
    sort_final_comment = models.TextField(blank=True, null=True)
    sort_final_security_years = models.IntegerField(blank=True, null=True)
    remarques = models.TextField(blank=True, null=True)
    validation_archive = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.code} - {self.title}"
