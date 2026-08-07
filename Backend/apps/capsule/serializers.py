from django.db import models
from rest_framework import serializers

from .models import Capsule, Review


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
    user = serializers.SerializerMethodField()

    class Meta:
        model = Capsule
        fields = [
            'id', 'name', 'bio', 'story', 'location', 'dob',
            'profile', 'cover', 'grid_x', 'grid_y',
            'views', 'likes', 'is_public', 'created_at',
            'average_rating', 'total_reviews', 'user',
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

    def get_user(self, obj):
        return {
            'id': str(obj.user.id),
            'name': obj.user.name,
            'email': obj.user.email,
        }


class NullableIntegerField(serializers.IntegerField):
    """Custom IntegerField that converts empty strings to None"""
    
    def __init__(self, **kwargs):
        # Set default to None if not provided
        if 'default' not in kwargs:
            kwargs['default'] = None
        super().__init__(**kwargs)
    
    def run_validation(self, data=serializers.empty):
        # Handle empty or null values - return empty to use default
        if data is serializers.empty or data == '' or data == 'null' or data is None:
            return serializers.empty
        return super().run_validation(data)


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for capsule reviews"""
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
        if obj.capsule.cover_thumbnail and request:
            return request.build_absolute_uri(obj.capsule.cover_thumbnail.url)
        elif obj.capsule.cover and request:
            return request.build_absolute_uri(obj.capsule.cover.url)
        return None

    def get_user_image(self, obj):
        request = self.context.get('request')
        if obj.user.image and request:
            return request.build_absolute_uri(obj.user.image.url)
        return None


class MyCapsuleSerializer(serializers.ModelSerializer):
    """Serializer for user's own capsules in dashboard"""
    thumbnail = serializers.SerializerMethodField()
    profile = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Capsule
        fields = [
            'id', 'name', 'bio', 'location', 'dob',
            'thumbnail', 'profile', 'grid_x', 'grid_y',
            'views', 'likes', 'is_public', 'created_at',
            'review_count', 'average_rating',
        ]

    def get_thumbnail(self, obj):
        request = self.context.get('request')
        image = obj.cover_thumbnail if obj.cover_thumbnail else obj.cover
        if image and request:
            return request.build_absolute_uri(image.url)
        return None

    def get_profile(self, obj):
        request = self.context.get('request')
        if obj.profile and request:
            return request.build_absolute_uri(obj.profile.url)
        return None

    def get_review_count(self, obj):
        return obj.review_set.count()

    def get_average_rating(self, obj):
        reviews = obj.review_set.all()
        if reviews.exists():
            return round(reviews.aggregate(avg=models.Avg('rating'))['avg'] or 0, 1)
        return 0


class CapsuleCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new capsules with image compression"""
    
    profile = serializers.ImageField(write_only=True, required=True)
    cover = serializers.ImageField(write_only=True, required=True)
    
    class Meta:
        model = Capsule
        fields = [
            'name', 'bio', 'story', 'location', 'dob',
            'profile', 'cover', 'is_public'
        ]
    
    def validate(self, attrs):
        """Validate that required fields are present"""
        if not attrs.get('name'):
            raise serializers.ValidationError({'name': 'Name is required'})
        if not attrs.get('bio'):
            raise serializers.ValidationError({'bio': 'Bio is required'})
        if not attrs.get('story'):
            raise serializers.ValidationError({'story': 'Story is required'})
        return attrs
    
    def create(self, validated_data):
        """Create capsule with compressed images"""
        from .utils import compress_image_to_webp, compress_image_to_webp_thumbnail
        from django.db.models import Max
        
        # Extract images from validated data
        profile_image = validated_data.pop('profile')
        cover_image = validated_data.pop('cover')
        
        # Get the user from context
        user = self.context['request'].user
        
        # Auto-generate grid position if not provided
        grid_x = validated_data.get('grid_x')
        grid_y = validated_data.get('grid_y')
        
        # If grid position not provided, find next available position
        if grid_x is None or grid_y is None:
            # Find the maximum grid position and add 1
            max_capsule = Capsule.objects.aggregate(
                max_x=Max('grid_x'),
                max_y=Max('grid_y')
            )
            
            # Simple auto-increment logic
            if max_capsule['max_x'] is not None:
                grid_x = max_capsule['max_x'] + 1
            else:
                grid_x = 0
            
            if max_capsule['max_y'] is not None:
                grid_y = max_capsule['max_y']
            else:
                grid_y = 0
            
            # Reset to 0,0 if we've gone too far (simple grid management)
            if grid_x > 100:
                grid_x = 0
                grid_y = (max_capsule['max_y'] or 0) + 1
        
        validated_data['grid_x'] = grid_x
        validated_data['grid_y'] = grid_y
        
        # Compress images to WebP
        compressed_profile = compress_image_to_webp(profile_image, quality=85, max_width=800)
        compressed_cover = compress_image_to_webp(cover_image, quality=85, max_width=1920)
        
        # Create capsule instance
        capsule = Capsule(
            **validated_data,
            user=user,
            profile=compressed_profile,
            cover=compressed_cover
        )
        
        # Generate cover thumbnail
        thumbnail = compress_image_to_webp_thumbnail(profile_image, quality=80, max_width=400)
        capsule.cover_thumbnail = thumbnail
        
        capsule.save()
        return capsule
