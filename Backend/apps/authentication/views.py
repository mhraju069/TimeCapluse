from .models import *
from .serializers import *
import requests
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status,permissions
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password
from django.core.files.base import ContentFile
from django.utils.text import slugify

# Create your views here.


class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self):
        return User.objects.filter(email=self.request.user.email).first()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        res = serializer.delete(serializer.validated_data)
        return Response(res, status=status.HTTP_200_OK)

    

class GetProfileView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        user = UserProfileSerializer(request.user,context={"request": request}).data
        return Response({"message": "Data fetched successfully", "data": user}, status=200)




class GoogleAuthView(generics.GenericAPIView):
    serializer_class = AuthSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        access_token = serializer.validated_data['access']
        
        try:
            # Verify token
            token_info_response = requests.get(
                f'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={access_token}'
            )

            if token_info_response.status_code != 200:
                return Response({'error': 'Invalid access token'}, status=400)

            token_info = token_info_response.json()

            if 'error' in token_info:
                return Response({'error': token_info['error']}, status=400)

            # Get basic user info
            user_info_response = requests.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {access_token}'}
            )

            user_data = user_info_response.json()
            profile_image_url = user_data.get("picture")
            email = user_data.get("email")
            name = user_data.get("name")

            #  Get DOB + Phone Number using People API
            date_of_birth = None
            phone_number = None

            people_api_url = "https://people.googleapis.com/v1/people/me?personFields=birthdays,phoneNumbers"
            people_response = requests.get(
                people_api_url,
                headers={'Authorization': f'Bearer {access_token}'}
            )

            
            try:
                people_json = people_response.json()
            except Exception as json_err:
                people_json = {}

            if people_response.status_code == 200 and isinstance(people_json, dict):

                # Birthday extraction
                birthdays = people_json.get("birthdays", [])
                if birthdays:
                    date_info = None
                    for b in birthdays:
                        d = b.get("date", {})
                        if "year" in d:
                            date_info = d
                            break
                    if not date_info:
                        date_info = birthdays[0].get("date", {})
                    year = date_info.get("year")
                    month = date_info.get("month")
                    day = date_info.get("day")
                    if year and month and day:
                        date_of_birth = f"{year}-{month:02d}-{day:02d}"
                    elif month and day:
                        date_of_birth = f"1900-{month:02d}-{day:02d}"

                # Phone number extraction
                phone_numbers = people_json.get("phoneNumbers", [])
                if phone_numbers:
                    primary_phone = next((p for p in phone_numbers if p.get("metadata", {}).get("primary")), phone_numbers[0])
                    phone_number = primary_phone.get("value")

            # Create or get user
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
                img_response = requests.get(profile_image_url)
                if img_response.status_code == 200:
                    file_name = f"{slugify(name)}-profile.jpg"
                    user.image.save(file_name, ContentFile(img_response.content), save=True)

            # Save DOB or Phone if fetched successfully
            if date_of_birth or phone_number:
                if not user.date_of_birth:  # only set if not already present
                    user.date_of_birth = date_of_birth
                    user.save(update_fields=["date_of_birth"])
                elif not user.phone:
                    user.phone = phone_number
                    user.save(update_fields=["phone"])

            # Check suspend flag
            if getattr(user, 'suspend', False):
                return Response(
                    {"error": "User account is disabled. Please contact support"},
                    status=403
                )

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            serializer = UserSerializer(user)

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': serializer.data,
            })

        except Exception as e:
            return Response({'error': str(e)}, status=500)