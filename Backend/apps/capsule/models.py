import uuid
from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

# Create your models here.

class Capsule(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='capsules')
    name = models.CharField(max_length=50,default="")
    bio = models.CharField(max_length=255,default="")
    location = models.CharField(max_length=150,default="")
    dob = models.DateField(default="2025-01-01")

    profile = models.ImageField(upload_to='capsule_profiles')
    cover = models.ImageField(upload_to='capsule_covers')
    cover_thumbnail = models.ImageField(
        upload_to='capsule_covers/thumbnails', blank=True, null=True
    )

    grid_x = models.IntegerField(default=0)
    grid_y = models.IntegerField(default=0)

    views = models.PositiveIntegerField(default=0)
    likes = models.PositiveIntegerField(default=0)

    is_public = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['grid_x', 'grid_y'], name='unique_grid_position'
            )
        ]
        indexes = [
            models.Index(fields=['grid_x', 'grid_y'], name='idx_grid_position'),
            models.Index(fields=['is_public', 'grid_x', 'grid_y'], name='idx_public_grid'),
        ]
        ordering = ['grid_y', 'grid_x']

    def __str__(self):
        return self.name



class Review(models.Model):
    id = models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    capsule = models.ForeignKey(Capsule,on_delete=models.CASCADE)
    rating = models.PositiveIntegerField(default=0)
    review = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.capsule.name} - {self.rating}"

    @property
    def average_rating(self):
        return self.review_set.aggregate(models.Avg('rating'))['rating__avg']

    def total_rating(self):
        return self.review_set.count()


class Like(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    capsule = models.ForeignKey(Capsule, on_delete=models.CASCADE, related_name='capsule_likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'capsule']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.name} liked {self.capsule.name}"


class View(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='views', null=True, blank=True)
    capsule = models.ForeignKey(Capsule, on_delete=models.CASCADE, related_name='capsule_views')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'capsule'],
                name='unique_user_capsule_view',
                condition=models.Q(user__isnull=False)
            ),
            models.UniqueConstraint(
                fields=['ip_address', 'capsule'],
                name='unique_ip_capsule_view',
                condition=models.Q(user__isnull=True)
            ),
        ]
        ordering = ['-created_at']

    def __str__(self):
        user_info = self.user.name if self.user else f"Anonymous ({self.ip_address})"
        return f"{user_info} viewed {self.capsule.name}"
