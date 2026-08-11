from django.urls import path
from .views import FAQListView

urlpatterns = [
    path('api/faq/', FAQListView.as_view(), name='faq-list'),
]
