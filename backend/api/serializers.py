from rest_framework import serializers
from .models import ScanLog, QuizQuestion

class ScanLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanLog
        fields = '__all__'

class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = '__all__'
