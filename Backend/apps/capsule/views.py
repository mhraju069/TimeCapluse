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
                    Q(bio__icontains=text)
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
    Requires authentication. Each user can only have ONE capsule.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Check if user already has a capsule
        existing = Capsule.objects.filter(user=request.user).first()
        if existing:
            return Response(
                {
                    'error': 'You already have a capsule. Each user can only create one.',
                    'capsule_id': str(existing.id),
                    'capsule_name': existing.name,
                },
                status=status.HTTP_409_CONFLICT
            )

        serializer = CapsuleCreateSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            capsule = serializer.save()

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


class MyCapsuleView(APIView):
    """
    Returns the authenticated user's capsule, or 404 if they don't have one.
    Used by frontend to check capsule ownership status.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            capsule = Capsule.objects.get(user=request.user)
        except Capsule.DoesNotExist:
            return Response(
                {'has_capsule': False, 'capsule': None},
                status=status.HTTP_200_OK
            )

        serializer = MyCapsuleSerializer(capsule, context={'request': request})
        return Response(
            {'has_capsule': True, 'capsule': serializer.data},
            status=status.HTTP_200_OK
        )


class DashboardView(APIView):
    """
    Dashboard endpoint - returns user's capsule info, timeline count, reviews, and stats.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get user's capsule (at most one)
        try:
            capsule = Capsule.objects.get(user=user)
            has_capsule = True
        except Capsule.DoesNotExist:
            capsule = None
            has_capsule = False

        capsule_data = None
        capsule_id = None
        timeline_count = 0
        total_views = 0
        total_likes = 0
        total_reviews_received = 0
        average_rating = 0
        engagement_total = 0
        engagement_per_capsule = 0

        if capsule:
            capsule_id = str(capsule.id)
            capsule_data = MyCapsuleSerializer(capsule, context={'request': request}).data

            # Timeline count
            from apps.timeline.models import TimeLine
            timeline_count = TimeLine.objects.filter(capsule=capsule).count()

            # Stats
            total_views = capsule.views
            total_likes = capsule.likes

            # Reviews on this capsule
            reviews = Review.objects.filter(capsule=capsule).select_related('user')
            total_reviews_received = reviews.count()
            avg_rating_data = reviews.aggregate(avg=Avg('rating'))['avg']
            average_rating = round(avg_rating_data, 1) if avg_rating_data else 0

            engagement_total = total_views + total_likes + total_reviews_received
            engagement_per_capsule = engagement_total

        # Reviews written by user
        user_reviews = Review.objects.filter(user=user).select_related('capsule')
        total_reviews_written = user_reviews.count()

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
                'has_capsule': has_capsule,
                'capsule_id': capsule_id,
                'capsule': capsule_data,
                'stats': {
                    'has_capsule': has_capsule,
                    'timeline_count': timeline_count,
                    'total_views': total_views,
                    'total_likes': total_likes,
                    'total_reviews_received': total_reviews_received,
                    'total_reviews_written': total_reviews_written,
                    'average_rating': average_rating,
                    'total_engagement': engagement_total,
                    'engagement_per_capsule': engagement_per_capsule,
                },
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


class PublicStatsView(APIView):
    """
    Public API returning aggregate stats for the site:
    - total capsules
    - total timeline events
    - total curators / users with capsules
    """
    permission_classes = [AllowAny]

    def get(self, request):
        from apps.timeline.models import TimeLine
        from apps.timeline.serializers import TimeLineSerializer
        from django.contrib.auth import get_user_model
        User = get_user_model()

        capsules_count = Capsule.objects.count()
        events_count = TimeLine.objects.count()
        curators_count = User.objects.filter(is_active=True).count()

        # Fetch up to 12 timeline events from DB
        from apps.timeline.models import TimeLineImage

        all_timelines = TimeLine.objects.select_related('capsule').prefetch_related('timeline_images').order_by('-event_date')[:12]
        
        sample_items = []
        for tl in all_timelines:
            img_obj = tl.timeline_images.first()
            img_url = request.build_absolute_uri(img_obj.image.url) if (img_obj and img_obj.image) else None

            sample_items.append({
                'id': str(tl.id),
                'title': tl.title,
                'description': tl.description,
                'capsule_name': tl.capsule.name if tl.capsule else 'Time Capsule',
                'event_date': tl.event_date.strftime('%b %d, %Y') if tl.event_date else '',
                'event_year': tl.event_date.year if tl.event_date else '',
                'image_url': img_url,
            })

        return Response({
            'status': 'success',
            'data': {
                'capsules_count': capsules_count,
                'events_count': events_count,
                'curators_count': curators_count,
                'sample_items': sample_items,
            }
        }, status=status.HTTP_200_OK)

