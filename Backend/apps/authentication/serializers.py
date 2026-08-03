from .models import User
from rest_framework import serializers

class UserProfileSerializer(serializers.ModelSerializer):
    old_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = User
        exclude = ['block', 'is_staff', 'is_superuser', 'groups', 'user_permissions', 'created_at']
        read_only_fields = ['id', 'email', 'role','is_active']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }

    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.image = validated_data.get('image', instance.image)
        old_password = validated_data.get('old_password')
        new_password = validated_data.get('password')

        if new_password:
            if not old_password:
                raise serializers.ValidationError({"old_password": "Current password is required to set a new password."})
            
            if not instance.check_password(old_password):
                raise serializers.ValidationError({"old_password": "Old password does not match."})
            
            instance.set_password(new_password)

        instance.save()
        return instance

    def delete(self, validated_data):
        user = self.instance
        if not user:
            email = validated_data.get('email')
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError({"email": "User not found"})

        password = validated_data.get('password')
        if not password:
            raise serializers.ValidationError({"password": "Password is required"})

        if not user.check_password(password):
            raise serializers.ValidationError({"password": "Invalid password"})

        user.delete()
        return {"status": True, "log": "User deleted successfully"}


class AuthSerializer(serializers.Serializer):
    access = serializers.CharField(required=True)
    