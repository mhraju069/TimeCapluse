from django.urls import path
from .views import ReviewsListCreateView

urlpatterns = [
    path('api/reviews/', ReviewsListCreateView.as_view(), name='reviews-list-create'),
]
