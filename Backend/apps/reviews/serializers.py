from rest_framework import serializers
from .models import Reviews

class ReviewsSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    user_image = serializers.SerializerMethodField()

    class Meta:
        model = Reviews
        fields = ['id', 'name', 'email', 'image', 'user_name', 'user_email', 'user_image', 'rating', 'review', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_user_name(self, obj):
        return obj.name or 'Anonymous'

    def get_user_email(self, obj):
        return obj.email or ''

    def get_user_image(self, obj):
        if obj.image:
            return obj.image.url
        return None
