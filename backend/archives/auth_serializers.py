from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .serializers import UserReadSerializer, UserWriteSerializer

User = get_user_model()


class UserSerializer(UserReadSerializer):
    class Meta(UserReadSerializer.Meta):
        fields = UserReadSerializer.Meta.fields


class RegisterSerializer(UserWriteSerializer):
    password2 = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})

    class Meta(UserWriteSerializer.Meta):
        fields = UserWriteSerializer.Meta.fields + ["password2"]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        password = attrs.get("password")
        password2 = attrs.pop("password2", None)

        if password != password2:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})

        return attrs


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        attrs = attrs.copy()
        username_field = self.username_field
        identifier = attrs.get(username_field)

        if identifier:
            try:
                user = User.objects.get(email__iexact=identifier)
                attrs[username_field] = user.get_username()
            except User.DoesNotExist:
                pass

        data = super().validate(attrs)
        serializer = UserReadSerializer(self.user)
        data["user"] = {
            **serializer.data,
            "roles": serializer.data.get("roles", []),
        }
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, style={"input_type": "password"})
    new_password = serializers.CharField(required=True, style={"input_type": "password"})
    new_password2 = serializers.CharField(required=True, style={"input_type": "password"})

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password": "Les mots de passe ne correspondent pas."})
        return attrs
