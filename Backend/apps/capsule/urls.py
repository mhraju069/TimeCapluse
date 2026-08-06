from django.urls import path
from .views import CapsuleViewportView, CapsuleDetailView, CapsuleBoundsView

urlpatterns = [
    path('api/capsules/viewport/', CapsuleViewportView.as_view(), name='capsule-viewport'),
    path('api/capsules/<uuid:capsule_id>/', CapsuleDetailView.as_view(), name='capsule-detail'),
    path('api/capsules/bounds/', CapsuleBoundsView.as_view(), name='capsule-bounds'),
]