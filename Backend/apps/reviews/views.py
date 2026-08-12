from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Reviews
from .serializers import ReviewsSerializer

class ReviewsListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        reviews = Reviews.objects.filter(is_active=True).order_by('-created_at')
        serializer = ReviewsSerializer(reviews, many=True)
        return Response({
            "status": "success",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        from PIL import Image
        import io
        import sys
        from django.core.files.uploadedfile import InMemoryUploadedFile

        data = request.data.copy() if hasattr(request.data, 'copy') else request.data
        
        # Check and convert image to WebP format
        image_file = request.FILES.get('image') or request.data.get('image')
        if image_file and hasattr(image_file, 'name') and not isinstance(image_file, str):
            try:
                img = Image.open(image_file)
                
                # Maintain RGBA transparency if present, otherwise convert to RGB
                if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                    img = img.convert('RGBA')
                else:
                    img = img.convert('RGB')
                
                # Save to BytesIO in WebP format
                output = io.BytesIO()
                img.save(output, format='WebP', quality=95)
                output.seek(0)
                
                # Create a new InMemoryUploadedFile
                base_name = image_file.name.rsplit('.', 1)[0]
                new_filename = f"{base_name}.webp"
                webp_file = InMemoryUploadedFile(
                    output,
                    'ImageField',
                    new_filename,
                    'image/webp',
                    sys.getsizeof(output),
                    None
                )
                data['image'] = webp_file
            except Exception as e:
                print("Error converting image to webp:", e)

        serializer = ReviewsSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "status": "success",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            "status": "error",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
