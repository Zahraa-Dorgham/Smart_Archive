# archives/auth_views.py
import uuid
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from rest_framework_simplejwt.tokens import RefreshToken

from .auth_serializers import (
    UserSerializer, RegisterSerializer,
    CustomTokenObtainPairSerializer, ChangePasswordSerializer
)
from .models import UserProfile
from .permissions import EstAdministrateur

User = get_user_model()


def _send_verification_email(user, token):
    """Envoie un email de vérification à l'utilisateur."""
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:4200')
    verification_link = f"{frontend_url}/verify-email?token={token}"

    subject = "InDA-ETAP - Vérifiez votre adresse email"
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 40px;">
        <h2 style="color: #5a8dee; margin-bottom: 10px;">Bienvenue sur InDA-ETAP</h2>
        <p style="color: #333;">Bonjour <strong>{user.first_name or user.username}</strong>,</p>
        <p style="color: #555;">Votre compte a été créé avec succès. Veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{verification_link}"
             style="background-color: #5a8dee; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Vérifier mon email
          </a>
        </div>
        <p style="color: #888; font-size: 13px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
        <p style="color: #5a8dee; font-size: 13px; word-break: break-all;">{verification_link}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
        <p style="color: #aaa; font-size: 12px; text-align: center;">InDA &copy; 2026</p>
      </div>
    </body>
    </html>
    """
    plain_message = strip_tags(html_message)

    try:
        print(f"DEBUG: Tentative d'envoi d'email à {user.email}")
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            html_message=html_message,
            fail_silently=False,
        )
        print("DEBUG: Email envoyé avec succès !")
        return True
    except Exception as e:
        print(f"DEBUG: ERREUR d'envoi d'email : {str(e)}")
        import logging
        logging.getLogger(__name__).error(f"Erreur envoi email de verification: {e}")
        return False


class RegisterView(generics.CreateAPIView):
    """Inscription d'un nouvel utilisateur"""
    queryset = User.objects.all()
    permission_classes = [EstAdministrateur]
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        # Créer un profil si manquant et générer le token de vérification
        profile, _ = UserProfile.objects.get_or_create(user=user)
        token = uuid.uuid4().hex
        profile.verification_token = token
        profile.is_verified = False
        profile.save()

        # Envoyer l'email de vérification
        _send_verification_email(user, token)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data['message'] = "Utilisateur cree. Un email de verification a ete envoye."
        return response


class VerifyEmailView(APIView):
    """Vérifie l'email d'un utilisateur à partir du token."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token = request.query_params.get('token')
        if not token:
            return Response({'error': 'Token manquant.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            profile = UserProfile.objects.get(verification_token=token)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Token invalide ou deja utilise.'}, status=status.HTTP_400_BAD_REQUEST)

        if profile.is_verified:
            return Response({'message': 'Email deja verifie.'})

        profile.is_verified = True
        profile.verification_token = None  # Invalider le token
        profile.save()
        return Response({'message': 'Email verifie avec succes. Vous pouvez maintenant vous connecter.'})


class ResendVerificationView(APIView):
    """Renvoie l'email de vérification."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identifier = request.data.get('email')  # Peut être email ou username
        print(f"DEBUG RESEND: Tentative pour identifier={identifier}")
        
        if not identifier:
            return Response({'error': 'Email ou nom d\'utilisateur requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Chercher par email ou par username
            from django.db.models import Q
            user = User.objects.filter(Q(email__iexact=identifier) | Q(username__iexact=identifier)).first()
            
            if not user:
                print(f"DEBUG RESEND: Utilisateur non trouvé pour {identifier}")
                return Response({'message': 'Si un compte existe avec ces informations, un lien a été envoyé.'})

            profile, _ = UserProfile.objects.get_or_create(user=user)
            if profile.is_verified:
                print(f"DEBUG RESEND: Email déjà vérifié pour {user.username}")
                return Response({'message': 'Email déjà vérifié.'})

            token = uuid.uuid4().hex
            profile.verification_token = token
            profile.save()

            print(f"DEBUG RESEND: Envoi en cours vers {user.email}")
            _send_verification_email(user, token)
            return Response({'message': 'Si un compte existe avec ces informations, un lien a été envoyé.'})
            
        except Exception as e:
            print(f"DEBUG RESEND: ERREUR CRITIQUE : {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class Verify2FAView(APIView):
    """Vérifie le code 2FA et génère les tokens finaux."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        identifier = request.data.get('email')
        code = request.data.get('code')

        if not identifier or not code:
            return Response({'error': 'Email et code requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from django.db.models import Q
            user = User.objects.filter(Q(email__iexact=identifier) | Q(username__iexact=identifier)).first()
            
            if not user:
                return Response({'error': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

            profile = user.profile
            print(f"DEBUG 2FA VERIFY: Reçu Code='{code}' pour Email='{identifier}'")
            print(f"DEBUG 2FA VERIFY: Attendu Code='{profile.two_factor_code}'")

            if profile.two_factor_code != code:
                return Response({'error': 'Code de vérification invalide.'}, status=status.HTTP_400_BAD_REQUEST)

            if not profile.two_factor_expires_at or profile.two_factor_expires_at < timezone.now():
                return Response({'error': 'Le code a expiré.'}, status=status.HTTP_400_BAD_REQUEST)

            # Code valide ! On génère les tokens
            from rest_framework_simplejwt.tokens import RefreshToken
            from django.contrib.auth.models import update_last_login
            from .models import LoginHistory
            
            refresh = RefreshToken.for_user(user)
            update_last_login(None, user)  # Mettre à jour la date de connexion
            
            # Enregistrer dans l'historique
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
            
            LoginHistory.objects.create(
                user=user,
                ip_address=ip,
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            # Nettoyer le code utilisé
            profile.two_factor_code = None
            profile.two_factor_expires_at = None
            profile.save()

            from .auth_serializers import UserSerializer
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    **UserSerializer(user).data,
                    'roles': [g.name for g in user.groups.all()],
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser
                }
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Login - obtenir token JWT avec infos utilisateur"""
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """Déconnexion (blacklist token)"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                return Response({'success': 'Déconnexion réussie'})
            return Response({'error': 'Token refresh requis'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Profil de l'utilisateur connecté"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """Changement de mot de passe"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = self.get_object()

        # Vérifier l'ancien mot de passe
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Mot de passe incorrect'},
                          status=status.HTTP_400_BAD_REQUEST)

        # Changer le mot de passe
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({'success': 'Mot de passe changé avec succès'})
