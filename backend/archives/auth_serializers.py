from .models import UserProfile
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.models import update_last_login
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import LoginHistory
from .serializers import UserSerializer

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})
    password2 = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})
    groups = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Group.objects.all(),
        required=False,
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "password2",
            "is_active",
            "groups",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs

    def create(self, validated_data):
        groups = validated_data.pop("groups", [])
        validated_data.pop("password2", None)
        password = validated_data.pop("password")

        if not validated_data.get("username") and validated_data.get("email"):
            validated_data["username"] = validated_data["email"]

        user = User.objects.create_user(password=password, **validated_data)
        if groups:
            user.groups.set(groups)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def _get_client_ip(self):
        request = self.context.get("request")
        if not request:
            return None

        forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")

    def _record_login(self):
        request = self.context.get("request")
        LoginHistory.objects.create(
            user=self.user,
            ip_address=self._get_client_ip(),
            user_agent=request.META.get("HTTP_USER_AGENT", "") if request else "",
        )
        update_last_login(None, self.user)

    def validate(self, attrs):
        # 1. Normalisation de l'identifiant (email ou username)
        identifier = attrs.get(self.username_field)
        if identifier:
            try:
                user_obj = User.objects.get(email__iexact=identifier)
                attrs[self.username_field] = user_obj.get_username()
            except User.DoesNotExist:
                pass

        # 2. Authentification manuelle pour vérifier le statut AVANT de générer les tokens
        from django.contrib.auth import authenticate
        user = authenticate(request=self.context.get('request'), **attrs)
        
        if user:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            
            # 2FA Spécifique pour Zahraa ou si activé
            if user.email == 'zahraaadorgham7704@gmail.com':
                import random
                import string
                from django.utils import timezone
                from django.core.mail import send_mail
                from django.conf import settings
                
                # Générer un code à 6 chiffres
                code = ''.join(random.choices(string.digits, k=6))
                profile.two_factor_code = code
                profile.two_factor_expires_at = timezone.now() + timezone.timedelta(minutes=10)
                profile.save()
                
                # Envoyer le code par email
                send_mail(
                    "InDA-ETAP - Votre code de sécurité",
                    f"Votre code de vérification est : {code}. Ce code expire dans 10 minutes.",
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
                
                print(f"DEBUG 2FA: Code {code} envoyé à {user.email}")
                # On retourne un dictionnaire au lieu de lever une exception
                return {
                    "requires_2fa": True,
                    "email": user.email,
                    "detail": "Un code de sécurité a été envoyé à votre adresse email."
                }

            # Vérification d'activation (pour les autres nouveaux comptes)
            is_verified = profile.is_verified
            if not is_verified:
                import uuid
                from .auth_views import _send_verification_email
                token = uuid.uuid4().hex
                profile.verification_token = token
                profile.save()
                _send_verification_email(user, token)
                raise serializers.ValidationError({
                    "detail": "Votre email n'est pas encore vérifié. Un nouveau lien vient de vous être envoyé."
                })
        
        # 3. Procéder au login normal si tout est OK
        data = super().validate(attrs)
        self._record_login()
        
        profile = getattr(self.user, 'profile', None)
        serializer = UserSerializer(self.user)
        data["user"] = {
            **serializer.data,
            "roles": [group.name for group in self.user.groups.all()],
            "is_staff": self.user.is_staff,
            "is_superuser": self.user.is_superuser,
            "is_verified": profile.is_verified if profile else True,
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
