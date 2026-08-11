from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Reviews

@admin.register(Reviews)
class ReviewsAdmin(ModelAdmin):
    list_display = ("name", "email", "rating", "is_active", "created_at", "updated_at")
    list_filter = ("rating", "is_active", "created_at")
    search_fields = ("name", "email", "review")
    ordering = ("-created_at",)
