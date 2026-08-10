import uuid
from django.db import models
from apps.capsule.models import Capsule

# Create your models here.


class TimeLine(models.Model):
    id = models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    capsule = models.ForeignKey(Capsule, on_delete=models.CASCADE, related_name='timeline')
    title = models.CharField(max_length=200)
    description = models.TextField()
    event_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.capsule.name} - {self.title}" 
    
    
class TimeLineImage(models.Model):
    id = models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    timeline = models.ForeignKey(TimeLine, on_delete=models.CASCADE, related_name='timeline_images')
    image = models.ImageField(upload_to='timeline_images', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Image for {self.timeline.title}"
    