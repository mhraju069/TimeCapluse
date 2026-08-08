from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import F, Avg, Sum, Q
from django.db import models
from django.shortcuts import get_object_or_404

from .models import Capsule, Review, Like, View
from .serializers import (
    CapsuleGridSerializer, CapsuleDetailSerializer, CapsuleCreateSerializer,
    MyCapsuleSerializer, ReviewSerializer, LikeSerializer, ReviewCreateSerializer
)

class CapsuleViewportView(APIView):
    """
    Viewport bounds অনুযায়ী capsules fetch করে।
    Query params: min_x, max_x, min_y, max_y
    Optional filters: text, location, year, month, date_from, date_to
    """

    def get(self, request):
        # Get filter parameters
        text = request.query_params.get('text', '').strip()
        location = request.query_params.get('location', '').strip()
        year = request.query_params.get('year', '').strip()
        month = request.query_params.get('month', '').strip()
        date_from = request.query_params.get('date_from', '').strip()
        date_to = request.query_params.get('date_to', '').strip()

        # Check if any filters are active
        has_filters = text or location or year or month or date_from or date_to

        if has_filters:
            # If filters are active, search across all capsules (viewport bounds not needed)
            capsules = Capsule.objects.filter(is_public=True)
            
            # Text search in name, bio, and story
            if text:
                capsules = capsules.filter(
                    Q(name__icontains=text) |
                    Q(bio__icontains=text) |
                    Q(story__icontains=text)
                )
            
            # Location search
            if location:
                capsules = capsules.filter(location__icontains=location)
            
            # Year filter
            if year:
                capsules = capsules.filter(dob__year=year)
            
            # Month filter
            if month:
                capsules = capsules.filter(dob__month=month)
            
            # Date range filter
            if date_from:
                capsules = capsules.filter(dob__gte=date_from)
            if date_to:
                capsules = capsules.filter(dob__lte=date_to)
            
            # Order by creation date (newest first)
            capsules = capsules.order_by('-created_at')
        else:
            # No filters - need viewport bounds
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

            # No filters - use viewport bounds
            capsules = Capsule.objects.filter(
                grid_x__gte=min_x, grid_x__lte=max_x,
                grid_y__gte=min_y, grid_y__lte=max_y,
                is_public=True
            )

        serializer = CapsuleGridSerializer(
            capsules, many=True, context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class CapsuleDetailView(APIView):
    permission_classes = [AllowAny]

    def get_permission_classes(self):
        if self.request.method == 'GET':
            return [AllowAny]
        return [IsAuthenticated]
        
    def get(self, request, capsule_id):
        capsule = get_object_or_404(Capsule, id=capsule_id, is_public=True)

        # Track view per user/IP
        user = request.user if request.user.is_authenticated else None
        
        # Get IP address from request
        ip_address = self.get_client_ip(request)
        
        # Create view record (unique constraint ensures one record per user/capsule or IP/capsule)
        view, created = None, False
        if user:
            # Authenticated user - create view with user
            view, created = View.objects.get_or_create(
                user=user,
                capsule=capsule,
                defaults={'ip_address': ip_address}
            )
        else:
            # Anonymous user - create view with IP only
            view, created = View.objects.get_or_create(
                user=None,
                capsule=capsule,
                ip_address=ip_address
            )
        
        # Only increment the views count if this is a new unique view
        if created:
            Capsule.objects.filter(id=capsule_id).update(views=F('views') + 1)
            capsule.refresh_from_db(fields=['views'])

        serializer = CapsuleDetailSerializer(capsule, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def get_client_ip(self, request):
        """Extract client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def patch(self, request, capsule_id):
        """Partial update - only owners can update their capsules"""
        capsule = get_object_or_404(Capsule, id=capsule_id)
        
        # Check if user is authenticated and is the owner
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if capsule.user != request.user:
            return Response(
                {'error': 'You do not have permission to edit this capsule'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Use partial=True to allow partial updates
        serializer = CapsuleDetailSerializer(
            capsule, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
                'capsules': capsule_serializer.data
            }
        }, status=status.HTTP_200_OK)


class CapsuleReviewsView(APIView):
    """
    Get reviews for a specific capsule with pagination.
    """
    permission_classes = [AllowAny]

    def get(self, request, capsule_id):
        capsule = get_object_or_404(Capsule, id=capsule_id)
        reviews = Review.objects.filter(capsule=capsule).select_related('user').order_by('-created_at')
        
        # Simple pagination
        page = int(request.query_params.get('page', 1))
        page_size = 10
        start = (page - 1) * page_size
        end = start + page_size
        
        total_reviews = reviews.count()
        total_pages = (total_reviews + page_size - 1) // page_size
        
        paginated_reviews = reviews[start:end]
        serializer = ReviewSerializer(paginated_reviews, many=True, context={'request': request})
        
        return Response({
            'results': serializer.data,
            'total_pages': total_pages,
            'current_page': page,
            'total_reviews': total_reviews,
        }, status=status.HTTP_200_OK)


class CapsuleLikeView(APIView):
    """
    Like/Unlike a capsule.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, capsule_id):
        capsule = get_object_or_404(Capsule, id=capsule_id)
        
        # Check if user already liked this capsule
        existing_like = Like.objects.filter(user=request.user, capsule=capsule).first()
        
        if existing_like:
            # Unlike - remove the like and decrement count
            existing_like.delete()
            Capsule.objects.filter(id=capsule_id).update(likes=F('likes') - 1)
            capsule.refresh_from_db(fields=['likes'])
            return Response({
                'message': 'Unliked successfully',
                'liked': False,
                'likes_count': capsule.likes
            }, status=status.HTTP_200_OK)
        else:
            # Like - create new like and increment count
            Like.objects.create(user=request.user, capsule=capsule)
            Capsule.objects.filter(id=capsule_id).update(likes=F('likes') + 1)
            capsule.refresh_from_db(fields=['likes'])
            
            serializer = LikeSerializer(Like.objects.filter(user=request.user, capsule=capsule).first(), context={'request': request})
            return Response({
                'message': 'Liked successfully',
                'liked': True,
                'likes_count': capsule.likes,
                'like': serializer.data
            }, status=status.HTTP_201_CREATED)

    def get(self, request, capsule_id):
        """Check if current user liked this capsule"""
        capsule = get_object_or_404(Capsule, id=capsule_id)
        
        if not request.user.is_authenticated:
            return Response({
                'liked': False,
                'likes_count': capsule.likes
            }, status=status.HTTP_200_OK)
        
        liked = Like.objects.filter(user=request.user, capsule=capsule).exists()
        
        return Response({
            'liked': liked,
            'likes_count': capsule.likes
        }, status=status.HTTP_200_OK)


class CapsuleReviewCreateView(APIView):
    """
    Create a review for a capsule.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, capsule_id):
        capsule = get_object_or_404(Capsule, id=capsule_id)
        
        # Check if user already reviewed this capsule
        existing_review = Review.objects.filter(user=request.user, capsule=capsule).first()
        if existing_review:
            return Response({
                'error': 'You have already reviewed this capsule'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create serializer with request context
        serializer = ReviewCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            # Save review with user and capsule
            review = serializer.save(user=request.user, capsule=capsule)
            
            # Return the created review
            response_serializer = ReviewSerializer(review, context={'request': request})
            return Response({
                'message': 'Review created successfully',
                'review': response_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
