from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from .models import TimeLine
from .serializers import TimeLineSerializer, TimeLineCreateSerializer


class TimeLineListView(APIView):
    """
    Get all timeline entries for a capsule, sorted by event date.
    """
    permission_classes = [AllowAny]

    def get(self, request, capsule_id):
        timelines = TimeLine.objects.filter(capsule_id=capsule_id).order_by('event_date')
        serializer = TimeLineSerializer(timelines, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class TimeLineCreateView(APIView):
    """
    Create a new timeline entry for a capsule.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, capsule_id):
        from apps.capsule.models import Capsule

        capsule = get_object_or_404(Capsule, id=capsule_id)

        # Check if user owns the capsule
        if capsule.user != request.user:
            return Response(
                {'error': 'You do not have permission to add timeline to this capsule'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Create serializer with request data
        serializer = TimeLineCreateSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            timeline = serializer.save(capsule=capsule)

            # Return the created timeline
            response_serializer = TimeLineSerializer(timeline, context={'request': request})
            return Response({
                'message': 'Timeline created successfully',
                'timeline': response_serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TimeLineDetailView(APIView):
    """
    Get, update, or delete a specific timeline entry.
    """
    permission_classes = [AllowAny]

    def get_permission_classes(self):
        if self.request.method == 'GET':
            return [AllowAny]
        return [IsAuthenticated]

    def get(self, request, timeline_id):
        timeline = get_object_or_404(TimeLine, id=timeline_id)
        serializer = TimeLineSerializer(timeline, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, timeline_id):
        timeline = get_object_or_404(TimeLine, id=timeline_id)

        # Check if user owns the capsule
        if timeline.capsule.user != request.user:
            return Response(
                {'error': 'You do not have permission to edit this timeline'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = TimeLineCreateSerializer(
            timeline,
            data=request.data,
            partial=True,
            context={'request': request}
        )

        if serializer.is_valid():
            timeline = serializer.save()
            response_serializer = TimeLineSerializer(timeline, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, timeline_id):
        timeline = get_object_or_404(TimeLine, id=timeline_id)

        # Check if user owns the capsule
        if timeline.capsule.user != request.user:
            return Response(
                {'error': 'You do not have permission to delete this timeline'},
                status=status.HTTP_403_FORBIDDEN
            )

        timeline.delete()
        return Response(
            {'message': 'Timeline deleted successfully'},
            status=status.HTTP_200_OK
        )