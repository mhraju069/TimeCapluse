from rest_framework import serializers
from .models import TimeLine, TimeLineImage


class TimeLineImageSerializer(serializers.ModelSerializer):
    """Serializer for timeline images"""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = TimeLineImage
        fields = ['id', 'image', 'image_url', 'created_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class TimeLineSerializer(serializers.ModelSerializer):
    """Serializer for timeline entries"""
    images = TimeLineImageSerializer(source='timeline_images', many=True, read_only=True)
    capsule_name = serializers.CharField(source='capsule.name', read_only=True)
    capsule_id = serializers.UUIDField(source='capsule.id', read_only=True)
    event_year = serializers.SerializerMethodField()

    class Meta:
        model = TimeLine
        fields = [
            'id', 'capsule_id', 'capsule_name', 'title', 'description',
            'event_date', 'event_year', 'images', 'created_at', 'updated_at'
        ]

    def get_event_year(self, obj):
        return obj.event_date.year


class TimeLineCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating timeline entries"""
    images = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = TimeLine
        fields = ['id', 'capsule', 'title', 'description', 'event_date', 'images']
        read_only_fields = ['id', 'capsule']

    def create(self, validated_data):
        images = validated_data.pop('images', [])
        timeline = TimeLine.objects.create(**validated_data)

        # Create timeline images
        for image in images:
            TimeLineImage.objects.create(timeline=timeline, image=image)

        return timeline