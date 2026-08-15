from django.db import models
from rest_framework import serializers

from .models import Capsule, Review, Like


class CapsuleGridSerializer(serializers.ModelSerializer):
    """
    Grid view serializer — ONLY the fields actually shown on the grid.
    Pair this with `.only('id','grid_x','grid_y','name','profile','cover','is_public')`
    on the queryset in the view so Django doesn't SELECT unused columns
    (bio, dob, location, views, likes, etc.) for every row.
    """
    profile = serializers.SerializerMethodField()

    class Meta:
        model = Capsule
        fields = ['id', 'grid_x', 'grid_y', 'name', 'profile', 'cover']

    def get_profile(self, obj):
        request = self.context.get('request')
        if obj.profile and request:
            return request.build_absolute_uri(obj.profile.url)
        return None


class CapsuleDetailSerializer(serializers.ModelSerializer):
    """
    IMPORTANT: average_rating / total_reviews / total_views are now
    PLAIN fields (not SerializerMethodField). They must be added to the
    queryset via .annotate() in the view (see views.py). This turns
    3 extra DB queries per request into 0 extra queries (they ride
    along in the single main SELECT).

    is_liked / is_reviewed stay as SerializerMethodField because this
    serializer is only used for a SINGLE object (detail view), so one
    extra `.exists()` query each here is cheap and not an N+1 problem.
    """
    profile = serializers.SerializerMethodField()
    cover = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.IntegerField(read_only=True, default=0)
    total_views = serializers.IntegerField(read_only=True, default=0)
    user = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_reviewed = serializers.SerializerMethodField()

    class Meta:
        model = Capsule
        fields = [
            'id', 'name', 'bio', 'location', 'dob',
            'profile', 'cover', 'grid_x', 'grid_y',
            'views', 'likes', 'is_public', 'created_at',
            'average_rating', 'total_reviews', 'total_views', 'user',
            'is_liked', 'is_reviewed',
        ]

    def get_profile(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.profile.url) if obj.profile else None

    def get_cover(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.cover.url) if obj.cover else None

    def get_average_rating(self, obj):
        # `average_rating` comes from .annotate(Avg('review__rating')) in the view.
        # Falls back to 0 gracefully if the annotation isn't present (e.g. PATCH flow).
        val = getattr(obj, 'average_rating', None)
        return round(val, 1) if val else 0

    def get_user(self, obj):
        # obj.user must be pulled in via select_related('user') in the view,
        # otherwise this triggers one extra query per request.
        return {
            'id': str(obj.user.id),
            'name': obj.user.name,
            'email': obj.user.email,
        }

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.capsule_likes.filter(user=request.user).exists()

    def get_is_reviewed(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.review_set.filter(user=request.user).exists()


class NullableIntegerField(serializers.IntegerField):
    """Custom IntegerField that converts empty strings to None"""

    def __init__(self, **kwargs):
        if 'default' not in kwargs:
            kwargs['default'] = None
        super().__init__(**kwargs)

    def run_validation(self, data=serializers.empty):
        if data is serializers.empty or data == '' or data == 'null' or data is None:
            return serializers.empty
        return super().run_validation(data)


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for capsule reviews.
    Requires the queryset to use .select_related('capsule', 'user') —
    already done correctly in views.py, keep it that way.
    """
    capsule_name = serializers.CharField(source='capsule.name', read_only=True)
    capsule_id = serializers.UUIDField(source='capsule.id', read_only=True)
    capsule_cover = serializers.SerializerMethodField()
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_image = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'capsule_id', 'capsule_name', 'capsule_cover', 'user_name', 'user_image', 'rating', 'review', 'created_at']

    def get_capsule_cover(self, obj):
        request = self.context.get('request')
        if obj.capsule.cover and request:
            return request.build_absolute_uri(obj.capsule.cover.url)
        return None

    def get_user_image(self, obj):
        request = self.context.get('request')
        if obj.user.image and request:
            return request.build_absolute_uri(obj.user.image.url)
        return None


class MyCapsuleSerializer(serializers.ModelSerializer):
    """
    review_count / average_rating are now plain fields fed by
    .annotate() in the view instead of two SerializerMethodField
    queries per request.
    """
    profile = serializers.SerializerMethodField()
    review_count = serializers.IntegerField(read_only=True, default=0)
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Capsule
        fields = [
            'id', 'name', 'bio', 'location', 'dob', 'cover',
            'profile', 'grid_x', 'grid_y',
            'views', 'likes', 'is_public', 'created_at',
            'review_count', 'average_rating',
        ]

    def get_profile(self, obj):
        request = self.context.get('request')
        if obj.profile and request:
            return request.build_absolute_uri(obj.profile.url)
        return None

    def get_average_rating(self, obj):
        val = getattr(obj, 'average_rating', None)
        return round(val, 1) if val else 0


class CapsuleCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new capsules with image compression"""

    profile = serializers.ImageField(write_only=True, required=True)
    cover = serializers.ImageField(write_only=True, required=True)

    class Meta:
        model = Capsule
        fields = [
            'name', 'bio', 'location', 'dob',
            'profile', 'cover', 'is_public'
        ]

    def validate(self, attrs):
        if not attrs.get('name'):
            raise serializers.ValidationError({'name': 'Name is required'})
        if not attrs.get('bio'):
            raise serializers.ValidationError({'bio': 'Bio is required'})

        request = self.context.get('request')
        if request and request.user.is_authenticated:
            existing = Capsule.objects.filter(user=request.user).first()
            if existing:
                raise serializers.ValidationError({
                    'error': 'You already have a capsule. Each user can only have one.',
                    'capsule_id': str(existing.id)
                })
        return attrs

    def create(self, validated_data):
        from .utils import compress_image_to_webp
        from django.db.models import Max

        profile_image = validated_data.pop('profile')
        cover_image = validated_data.pop('cover')

        user = self.context['request'].user

        grid_x = validated_data.get('grid_x')
        grid_y = validated_data.get('grid_y')

        if grid_x is None or grid_y is None:
            # single aggregate query, same as before — fine as-is
            max_capsule = Capsule.objects.aggregate(
                max_x=Max('grid_x'),
                max_y=Max('grid_y')
            )

            grid_x = (max_capsule['max_x'] + 1) if max_capsule['max_x'] is not None else 0
            grid_y = max_capsule['max_y'] if max_capsule['max_y'] is not None else 0

            if grid_x > 100:
                grid_x = 0
                grid_y = (max_capsule['max_y'] or 0) + 1

        validated_data['grid_x'] = grid_x
        validated_data['grid_y'] = grid_y

        compressed_profile = compress_image_to_webp(profile_image, quality=95, max_width=800)
        compressed_cover = compress_image_to_webp(cover_image, quality=95, max_width=1920)

        capsule = Capsule(
            **validated_data,
            user=user,
            profile=compressed_profile,
            cover=compressed_cover
        )
        capsule.save()
        return capsule


class LikeSerializer(serializers.ModelSerializer):
    """Serializer for Like model"""
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = Like
        fields = ['id', 'user', 'user_name', 'capsule', 'created_at']
        read_only_fields = ['id', 'created_at']


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating reviews"""
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_image = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'user', 'user_name', 'user_image', 'capsule', 'rating', 'review', 'created_at']
        read_only_fields = ['id', 'user', 'capsule', 'created_at']

    def get_user_image(self, obj):
        request = self.context.get('request')
        if obj.user.image and request:
            return request.build_absolute_uri(obj.user.image.url)
        return None