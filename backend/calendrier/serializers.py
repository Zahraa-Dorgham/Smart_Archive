from rest_framework import serializers
from .models import Calendrier


class CalendrierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calendrier
        fields = '__all__'
