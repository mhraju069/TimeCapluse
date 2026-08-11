import uuid
from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Reviews(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    image = models.ImageField(upload_to='reviews/', blank=True, null=True)
    rating = models.IntegerField()
    review = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Review by {self.email or self.name or 'Anonymous'} - {self.rating}"
