from .models import *
from .serializers import *
import requests
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password
from django.core.files.base import ContentFile
from django.utils.text import slugify

_google_session = requests.Session()
GOOGLE_TIMEOUT = 5

class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        res = serializer.delete(serializer.validated_data)
        return Response(res, status=status.HTTP_200_OK)


class GetProfileView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = UserProfileSerializer(request.user, context={"request": request}).data
        return Response({"message": "Data fetched successfully", "data": user}, status=200)


class GoogleAuthView(generics.GenericAPIView):
    serializer_class = AuthSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        access_token = serializer.validated_data['access']

        try:

            user_info_response = _google_session.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=GOOGLE_TIMEOUT,
            )

            if user_info_response.status_code != 200:
                return Response({'error': 'Invalid access token'}, status=400)

            user_data = user_info_response.json()
            if 'error' in user_data:
                return Response({'error': user_data['error']}, status=400)

            profile_image_url = user_data.get("picture")
            email = user_data.get("email")
            name = user_data.get("name")

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'name': name,
                    'is_active': True,
                    'password': make_password(None)
                }
            )

            # Save profile image if new user
            if created and profile_image_url:
                img_response = _google_session.get(profile_image_url, timeout=GOOGLE_TIMEOUT)
                if img_response.status_code == 200:
                    file_name = f"{slugify(name)}-profile.jpg"
                    user.image.save(file_name, ContentFile(img_response.content), save=True)

            if user.block:
                return Response(
                    {"error": "User account is disabled. Please contact support"},
                    status=403
                )

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            profile_serializer = UserProfileSerializer(user, context={"request": request})

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': profile_serializer.data,
            })

        except requests.exceptions.Timeout:
            return Response({'error': 'Google API did not respond in time'}, status=504)
        except requests.exceptions.RequestException as e:
            return Response({'error': f'Failed to reach Google: {str(e)}'}, status=502)
        except Exception as e:
            return Response({'error': str(e)}, status=500)