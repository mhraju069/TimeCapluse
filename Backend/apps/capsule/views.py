from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import F
from django.shortcuts import get_object_or_404

from .models import Capsule
from .serializers import CapsuleGridSerializer, CapsuleDetailSerializer


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