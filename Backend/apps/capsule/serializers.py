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


class CapsuleCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new capsules with image compression"""
    
    profile = serializers.ImageField(write_only=True, required=True)
    cover = serializers.ImageField(write_only=True, required=True)
    
    class Meta:
        model = Capsule
        fields = [
            'name', 'bio', 'story', 'location', 'dob',
            'profile', 'cover', 'grid_x', 'grid_y', 'is_public'
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
        from .utils import compress_image_to_webp
        from django.db.models import Max
        
        # Extract images from validated data
        profile_image = validated_data.pop('profile')
        cover_image = validated_data.pop('cover')
        
        # Get the user from context
        user = self.context['request'].user
        
        # Auto-generate grid position if not provided
        grid_x = validated_data.get('grid_x', 0)
        grid_y = validated_data.get('grid_y', 0)
        
        # If grid position not provided, find next available position
        if not validated_data.get('grid_x') and not validated_data.get('grid_y'):
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
        thumbnail = compress_image_to_webp_thumbnail(cover_image, quality=80, max_width=400)
        capsule.cover_thumbnail = thumbnail
        
        capsule.save()
        return capsule
