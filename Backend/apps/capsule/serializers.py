from rest_framework import serializers
from .models import Capsule


class CapsuleGridSerializer(serializers.ModelSerializer):
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = Capsule
        fields = ['id', 'grid_x', 'grid_y', 'title', 'thumbnail']

    def get_thumbnail(self, obj):
        request = self.context.get('request')
        image = obj.cover_thumbnail if obj.cover_thumbnail else obj.cover
        if image and request:
            return request.build_absolute_uri(image.url)
        return None


class CapsuleDetailSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    cover = serializers.SerializerMethodField()

    class Meta:
        model = Capsule
        fields = [
            'id', 'title', 'profile', 'cover', 'grid_x', 'grid_y',
            'views', 'likes', 'is_public', 'created_at', 'user',
        ]

    def get_profile(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.profile.url) if obj.profile else None

    def get_cover(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.cover.url) if obj.cover else None