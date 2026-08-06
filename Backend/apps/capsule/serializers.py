from django.db import models
from rest_framework import serializers

from .models import Capsule


class CapsuleGridSerializer(serializers.ModelSerializer):
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = Capsule
        fields = ['id', 'grid_x', 'grid_y', 'name', 'thumbnail']

    def get_thumbnail(self, obj):
        request = self.context.get('request')
        image = obj.cover_thumbnail if obj.cover_thumbnail else obj.cover
        if image and request:
            return request.build_absolute_uri(image.url)
        return None


class CapsuleDetailSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    cover = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()

    class Meta:
        model = Capsule
        fields = [
            'id', 'name', 'bio', 'story', 'location', 'dob',
            'profile', 'cover', 'grid_x', 'grid_y',
            'views', 'likes', 'is_public', 'created_at',
            'average_rating', 'total_reviews',
        ]

    def get_profile(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.profile.url) if obj.profile else None

    def get_cover(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.cover.url) if obj.cover else None

    def get_average_rating(self, obj):
        reviews = obj.review_set.all()
        if reviews.exists():
            return round(reviews.aggregate(avg=models.Avg('rating'))['avg'] or 0, 1)
        return 0

    def get_total_reviews(self, obj):
        return obj.review_set.count()
