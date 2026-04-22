from rest_framework import serializers
from .models import Calendrier
from archives.serializers import DirectionSerializer


class CalendrierSerializer(serializers.ModelSerializer):
    # provide nested direction object for frontend convenience
    direction_detail = DirectionSerializer(source='direction', read_only=True)

    class Meta:
        model = Calendrier
        fields = '__all__'
