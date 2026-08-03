from django.db import models
import uuid
from django.cong import settings

User = settings.AUTH_USER_MODEL

# Create your models here.


class Capsule(models.Model):
    id = models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    user = models.ForeignKey(User,on_delete=models.CASCADE)
    title = models.CharField(max_length=50)
    profile = models.ImageField(upload_to='capsule_profiles')
    cover = models.ImageField(upload_to='capsule_covers')
    views = models.PositiveIntegerField(default=0)
    likes = models.PositiveIntegerField(default=0)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title



class Review(models.Model):
    id = models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    capsule = models.ForeignKey(Capsule,on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(default=0)
    review = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.capsule.title} - {self.rating}"

    @property
    def average_rating(self):
        return self.review_set.aggregate(models.Avg('rating'))['rating__avg']

    def total_rating(self):
        return self.review_set.count()
