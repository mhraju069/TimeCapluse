from django.urls import path
from .views import CapsuleViewportView, CapsuleDetailView, CapsuleBoundsView, CapsuleCreateView, DashboardView, CapsuleReviewsView, CapsuleLikeView, CapsuleReviewCreateView, MyCapsuleView, PublicStatsView

urlpatterns = [
    path('api/public-stats/', PublicStatsView.as_view(), name='public-stats'),
    path('api/capsules/viewport/', CapsuleViewportView.as_view(), name='capsule-viewport'),
    path('api/capsules/mine/', MyCapsuleView.as_view(), name='capsule-mine'),
    path('api/capsules/<uuid:capsule_id>/', CapsuleDetailView.as_view(), name='capsule-detail'),
    path('api/capsules/<uuid:capsule_id>/reviews/', CapsuleReviewsView.as_view(), name='capsule-reviews'),
    path('api/capsules/<uuid:capsule_id>/like/', CapsuleLikeView.as_view(), name='capsule-like'),
    path('api/capsules/<uuid:capsule_id>/review/', CapsuleReviewCreateView.as_view(), name='capsule-review-create'),
    path('api/capsules/bounds/', CapsuleBoundsView.as_view(), name='capsule-bounds'),
    path('api/capsules/create/', CapsuleCreateView.as_view(), name='capsule-create'),
    path('api/dashboard/', DashboardView.as_view(), name='dashboard'),
]
