from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import FAQ

@admin.register(FAQ)
class FAQAdmin(ModelAdmin):
    list_display = ("question", "is_active", "created_at", "updated_at")
    list_filter = ("is_active", "created_at", "updated_at")
    search_fields = ("question", "answer")
    ordering = ("-created_at",)
