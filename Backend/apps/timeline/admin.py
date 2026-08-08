from django.contrib import admin
from .models import TimeLine, TimeLineImage
from unfold.admin import ModelAdmin


class TimeLineImageInline(admin.TabularInline):
    model = TimeLineImage
    extra = 1


@admin.register(TimeLine)
class TimeLineAdmin(ModelAdmin):
    list_display = ('title', 'capsule', 'event_date', 'created_at')
    list_filter = ('event_date', 'created_at')
    search_fields = ('title', 'description', 'capsule__name')
    inlines = [TimeLineImageInline]
    ordering = ('event_date',)


@admin.register(TimeLineImage)
class TimeLineImageAdmin(ModelAdmin):
    list_display = ('timeline', 'image', 'created_at')
    search_fields = ('timeline__title',)