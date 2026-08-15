from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import F, Avg, Sum, Q, Count
from django.db import models
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

from .models import Capsule, Review, Like, View
from .serializers import (
    CapsuleGridSerializer, CapsuleDetailSerializer, CapsuleCreateSerializer,
    MyCapsuleSerializer, ReviewSerializer, LikeSerializer, ReviewCreateSerializer
)

# Fields the grid card actually renders — nothing else needs to come off disk/DB.
GRID_ONLY_FIELDS = ('id', 'grid_x', 'grid_y', 'name', 'profile', 'cover', 'is_public')


class CapsuleViewportView(APIView):
    """
    Viewport bounds অনুযায়ী capsules fetch করে।
    Query params: min_x, max_x, min_y, max_y
    Optional filters: text, location, year, month, date_from, date_to
    """

    def get(self, request):
        text = request.query_params.get('text', '').strip()
        location = request.query_params.get('location', '').strip()
        year = request.query_params.get('year', '').strip()
        month = request.query_params.get('month', '').strip()
        date_from = request.query_params.get('date_from', '').strip()
        date_to = request.query_params.get('date_to', '').strip()

        has_filters = text or location or year or month or date_from or date_to

        # .only(...) => SELECT just the columns the grid serializer needs,
        # instead of every column on Capsule (bio, dob text, etc.)
        base_qs = Capsule.objects.filter(is_public=True).only(*GRID_ONLY_FIELDS)

        if has_filters:
            capsules = base_qs

            if text:
                capsules = capsules.filter(
                    Q(name__icontains=text) | Q(bio__icontains=text)
                )
            if location:
                capsules = capsules.filter(location__icontains=location)
            if year:
                capsules = capsules.filter(dob__year=year)
            if month:
                capsules = capsules.filter(dob__month=month)
            if date_from:
                capsules = capsules.filter(dob__gte=date_from)
            if date_to:
                capsules = capsules.filter(dob__lte=date_to)

            capsules = capsules.order_by('-created_at')
        else:
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

            MAX_RANGE = 100
            if (max_x - min_x) > MAX_RANGE or (max_y - min_y) > MAX_RANGE:
                return Response(
                    {"error": f"Viewport range too large. Max {MAX_RANGE} cells per axis."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            capsules = base_qs.filter(
                grid_x__gte=min_x, grid_x__lte=max_x,
                grid_y__gte=min_y, grid_y__lte=max_y,
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
        # select_related('user') kills the extra query inside get_user().
        # annotate(...) computes rating/review/view counts in the SAME
        # query instead of 3 separate round-trips per request.
        # distinct=True guards against row fan-out from the joins.
        capsule = get_object_or_404(
            Capsule.objects.select_related('user').annotate(
                average_rating=Avg('review__rating'),
                total_reviews=Count('review', distinct=True),
                total_views=Count('capsule_views', distinct=True),
            ),
            id=capsule_id, is_public=True
        )

        user = request.user if request.user.is_authenticated else None
        ip_address = self.get_client_ip(request)

        if user:
            view, created = View.objects.get_or_create(
                user=user,
                capsule=capsule,
                defaults={'ip_address': ip_address}
            )
        else:
            view, created = View.objects.get_or_create(
                user=None,
                capsule=capsule,
                ip_address=ip_address
            )

        if created:
            Capsule.objects.filter(id=capsule_id).update(views=F('views') + 1)
            capsule.refresh_from_db(fields=['views'])

        serializer = CapsuleDetailSerializer(capsule, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def patch(self, request, capsule_id):
        capsule = get_object_or_404(Capsule, id=capsule_id)

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
    """
    Cached for 60s — the grid bounds barely change request-to-request,
    so there's no reason to hit the DB on every single call.
    """

    @method_decorator(cache_page(60))
    def get(self, request):
        from django.db.models import Min, Max

        bounds = Capsule.objects.filter(is_public=True).aggregate(
            min_x=Min('grid_x'), max_x=Max('grid_x'),
            min_y=Min('grid_y'), max_y=Max('grid_y'),
        )
        return Response(bounds, status=status.HTTP_200_OK)


class CapsuleCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # annotate replaces the 2 extra queries MyCapsuleSerializer used to fire
        # (review_set.count() + review_set.aggregate(Avg)) with 0 extra queries.
        capsule = Capsule.objects.annotate(
            review_count=Count('review', distinct=True),
            average_rating=Avg('review__rating'),
        ).filter(user=request.user).first()

        if not capsule:
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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        capsule = Capsule.objects.annotate(
            total_reviews_received=Count('review', distinct=True),
            average_rating_val=Avg('review__rating'),
        ).filter(user=user).first()
        has_capsule = capsule is not None

        capsule_data = None
        capsule_id = None
        timeline_count = 0
        total_views = 0
        total_likes = 0
        total_reviews_received = 0
        average_rating = 0

        if capsule:
            capsule_id = str(capsule.id)
            # NOTE: MyCapsuleSerializer expects `review_count` / `average_rating`
            # attribute names — align the annotate() names above with those,
            # or add aliases here before serializing.
            capsule.review_count = capsule.total_reviews_received
            capsule.average_rating = capsule.average_rating_val
            capsule_data = MyCapsuleSerializer(capsule, context={'request': request}).data

            from apps.timeline.models import TimeLine
            timeline_count = TimeLine.objects.filter(capsule=capsule).count()

            total_views = capsule.views
            total_likes = capsule.likes
            total_reviews_received = capsule.total_reviews_received
            average_rating = round(capsule.average_rating_val, 1) if capsule.average_rating_val else 0

        engagement_total = total_views + total_likes + total_reviews_received
        engagement_per_capsule = engagement_total

        total_reviews_written = Review.objects.filter(user=user).count()

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
    permission_classes = [AllowAny]

    def get(self, request, capsule_id):
        capsule = get_object_or_404(Capsule, id=capsule_id)
        reviews = Review.objects.filter(capsule=capsule).select_related('user', 'capsule').order_by('-created_at')

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
    permission_classes = [IsAuthenticated]

    def post(self, request, capsule_id):
        capsule = get_object_or_404(Capsule, id=capsule_id)

        existing_like = Like.objects.filter(user=request.user, capsule=capsule).first()

        if existing_like:
            existing_like.delete()
            Capsule.objects.filter(id=capsule_id).update(likes=F('likes') - 1)
            capsule.refresh_from_db(fields=['likes'])
            return Response({
                'message': 'Unliked successfully',
                'liked': False,
                'likes_count': capsule.likes
            }, status=status.HTTP_200_OK)
        else:
            # Create once, reuse the SAME instance for the serializer —
            # no need to re-query the row we just created.
            like = Like.objects.create(user=request.user, capsule=capsule)
            Capsule.objects.filter(id=capsule_id).update(likes=F('likes') + 1)
            capsule.refresh_from_db(fields=['likes'])

            serializer = LikeSerializer(like, context={'request': request})
            return Response({
                'message': 'Liked successfully',
                'liked': True,
                'likes_count': capsule.likes,
                'like': serializer.data
            }, status=status.HTTP_201_CREATED)

    def get(self, request, capsule_id):
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
    permission_classes = [IsAuthenticated]

    def post(self, request, capsule_id):
        capsule = get_object_or_404(Capsule, id=capsule_id)

        existing_review = Review.objects.filter(user=request.user, capsule=capsule).exists()
        if existing_review:
            return Response({
                'error': 'You have already reviewed this capsule'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = ReviewCreateSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            review = serializer.save(user=request.user, capsule=capsule)
            response_serializer = ReviewSerializer(review, context={'request': request})
            return Response({
                'message': 'Review created successfully',
                'review': response_serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PublicStatsView(APIView):
    """
    Public API returning aggregate stats for the site.
    Cached for 30s since this is a public, mostly-static summary — the
    single biggest win here since it's likely the highest-traffic endpoint.
    """
    permission_classes = [AllowAny]

    @method_decorator(cache_page(30))
    def get(self, request):
        from apps.timeline.models import TimeLine
        from apps.authentication.models import Curator

        capsules_count = Capsule.objects.count()
        events_count = TimeLine.objects.count()

        db_curators = Curator.objects.all().order_by('created_at')
        curators_count = db_curators.count()

        curator_list = [
            {
                'id': c.id,
                'name': c.name,
                'designation': c.designation or 'Curator',
                'image': request.build_absolute_uri(c.image.url) if c.image else None
            }
            for c in db_curators
        ]

        # prefetch_related loads ALL timeline_images for these 12 timelines
        # in a single extra query. The old code called `.first()` inside the
        # loop, which IGNORES the prefetch cache and fires one fresh query
        # PER timeline (12 extra queries). Using `.all()` on the prefetched
        # manager and indexing [0] reads from the cache instead — 0 extra
        # queries for the whole loop.
        all_timelines = (
            TimeLine.objects
            .select_related('capsule')
            .prefetch_related('timeline_images')
            .order_by('-event_date')[:12]
        )

        sample_items = []
        for tl in all_timelines:
            images = list(tl.timeline_images.all())  # served from prefetch cache
            img_obj = images[0] if images else None
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
                'curators': curator_list,
                'sample_items': sample_items,
            }
        }, status=status.HTTP_200_OK)