from django.urls import path
from .views import TimeLineListView, TimeLineCreateView, TimeLineDetailView

urlpatterns = [
    path('api/capsules/<uuid:capsule_id>/timeline/', TimeLineListView.as_view(), name='timeline-list'),
    path('api/capsules/<uuid:capsule_id>/timeline/create/', TimeLineCreateView.as_view(), name='timeline-create'),
    path('api/timeline/<uuid:timeline_id>/', TimeLineDetailView.as_view(), name='timeline-detail'),
]