from django.urls import path
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView
urlpatterns = [
    path('user/', UserRetrieveUpdateDestroyView.as_view(), name='user'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("login/",GoogleAuthView.as_view(),name='google_login'),
]