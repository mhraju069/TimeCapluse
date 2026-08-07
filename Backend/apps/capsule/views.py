from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import F, Avg, Sum
from django.shortcuts import get_object_or_404

from .models import Capsule, Review
from .serializers import (
    CapsuleGridSerializer, CapsuleDetailSerializer, CapsuleCreateSerializer,
    MyCapsuleSerializer, ReviewSerializer
)


class CapsuleViewportView(APIView):
    """
    Viewport bounds অনুযায়ী capsules fetch করে।
    Query params: min_x, max_x, min_y, max_y
    """

    def get(self, request):
        try:
            min_x = int(request.query_params.get('min_x'))
            max_x = int(request.query_params.get('max_x'))
            min_y = int(request.query_params.get('min_y'))
            max_y = int(request.query_params.get('max_y'))
        except (TypeError, ValueError):
            return Response(
                {"error": "min_x, max_x, min_y, max_y (integers) required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Safety: একবারে অনেক বড় range request আটকানো (abuse prevention)
        MAX_RANGE = 100
        if (max_x - min_x) > MAX_RANGE or (max_y - min_y) > MAX_RANGE:
            return Response(
                {"error": f"Viewport range too large. Max {MAX_RANGE} cells per axis."},
                status=status.HTTP_400_BAD_REQUEST
            )

        capsules = Capsule.objects.filter(
            grid_x__gte=min_x, grid_x__lte=max_x,
            grid_y__gte=min_y, grid_y__lte=max_y,
            is_public=True
        ).only('id', 'grid_x', 'grid_y', 'name', 'cover_thumbnail', 'cover')

        serializer = CapsuleGridSerializer(
            capsules, many=True, context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class CapsuleDetailView(APIView):

    def get(self, request, capsule_id):
        capsule = get_object_or_404(Capsule, id=capsule_id, is_public=True)

        # Atomic view count increment (race condition safe)
        Capsule.objects.filter(id=capsule_id).update(views=F('views') + 1)
        capsule.refresh_from_db(fields=['views'])

        serializer = CapsuleDetailSerializer(capsule, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CapsuleBoundsView(APIView):

    def get(self, request):
        from django.db.models import Min, Max

        bounds = Capsule.objects.filter(is_public=True).aggregate(
            min_x=Min('grid_x'), max_x=Max('grid_x'),
            min_y=Min('grid_y'), max_y=Max('grid_y'),
        )
        return Response(bounds, status=status.HTTP_200_OK)


class CapsuleCreateView(APIView):
    """
    Create a new capsule with compressed images.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CapsuleCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            capsule = serializer.save()
            
            # Return the created capsule data
            response_serializer = CapsuleDetailSerializer(
                capsule, 
                context={'request': request}
            )
            
            return Response(
                {
                    'message': 'Capsule created successfully',
                    'capsule': response_serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            {'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )


class DashboardView(APIView):
    """
    Dashboard endpoint - returns user's capsules, reviews, and stats.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get user's capsules
        capsules = Capsule.objects.filter(user=user).prefetch_related('review_set')
        capsule_serializer = MyCapsuleSerializer(capsules, many=True, context={'request': request})

        # Get reviews received on user's capsules
        capsule_ids = capsules.values_list('id', flat=True)
        reviews = Review.objects.filter(capsule_id__in=capsule_ids).select_related('user', 'capsule') if capsule_ids else Review.objects.none()
        review_serializer = ReviewSerializer(reviews, many=True, context={'request': request})

        # Get reviews written by the user
        user_reviews = Review.objects.filter(user=user).select_related('capsule')
        user_review_serializer = ReviewSerializer(user_reviews, many=True, context={'request': request})

        # Stats
        total_capsules = capsules.count()
        total_views = capsules.aggregate(total=Sum('views'))['total'] or 0
        total_likes = capsules.aggregate(total=Sum('likes'))['total'] or 0
        total_reviews_received = reviews.count()
        total_reviews_written = user_reviews.count()

        # Average rating across all capsules
        avg_rating_data = reviews.aggregate(avg=Avg('rating'))['avg']
        average_rating = round(avg_rating_data, 1) if avg_rating_data else 0

        # Engagement rate (views + likes + reviews per capsule)
        engagement_total = total_views + total_likes + total_reviews_received
        engagement_per_capsule = round(engagement_total / total_capsules, 1) if total_capsules > 0 else 0

        # Most viewed capsule
        most_viewed = capsules.order_by('-views').first()
        most_viewed_data = None
        if most_viewed:
            most_viewed_data = {
                'id': str(most_viewed.id),
                'name': most_viewed.name,
                'views': most_viewed.views,
                'thumbnail': MyCapsuleSerializer(most_viewed, context={'request': request}).data.get('thumbnail')
            }

        # Recent capsules
        recent_capsules = capsules.order_by('-created_at')[:5]
        recent_capsule_serializer = MyCapsuleSerializer(recent_capsules, many=True, context={'request': request})

        return Response({
            'status': 'success',
            'data': {
                'user': {
                    'id': str(user.id),
                    'name': user.name,
                    'email': user.email,
                    'image': request.build_absolute_uri(user.image.url) if user.image else None,
                    'is_active': user.is_active,
                    'created_at': user.created_at,
                },
                'stats': {
                    'total_capsules': total_capsules,
                    'total_views': total_views,
                    'total_likes': total_likes,
                    'total_reviews_received': total_reviews_received,
                    'total_reviews_written': total_reviews_written,
                    'average_rating': average_rating,
                    'engagement_per_capsule': engagement_per_capsule,
                    'total_engagement': engagement_total,
                },
                'capsules': capsule_serializer.data,
                'reviews_received': review_serializer.data,
                'reviews_written': user_review_serializer.data,
                'most_viewed': most_viewed_data,
                'recent_capsules': recent_capsule_serializer.data,
            }
        }, status=status.HTTP_200_OK)
