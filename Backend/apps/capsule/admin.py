from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import *

@admin.register(Capsule)
class CapsuleAdmin(ModelAdmin):
    list_display = ('name', 'location', 'grid_x', 'grid_y', 'is_public', 'created_at', 'updated_at')
    list_filter = ('is_public', 'created_at', 'updated_at')
    search_fields = ('name', 'bio', 'location')


admin.site.register(Review,ModelAdmin)
admin.site.register(Like,ModelAdmin)
