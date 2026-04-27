from django.contrib import admin
from .models import Calendrier


@admin.register(Calendrier)
class CalendrierAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'title', 'is_dossier', 'is_active', 'created_at')
    list_filter = ('is_active', 'is_dossier')
    search_fields = ('code', 'title', 'description')
