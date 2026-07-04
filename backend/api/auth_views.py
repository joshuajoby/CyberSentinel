from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token


class RegisterView(APIView):
    """Register a new user account."""
    
    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')
        confirm_password = request.data.get('confirm_password', '')
        
        # Validation
        if not username or not email or not password:
            return Response({'error': 'Username, email, and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(username) < 3:
            return Response({'error': 'Username must be at least 3 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(password) < 6:
            return Response({'error': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if password != confirm_password:
            return Response({'error': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username is already taken.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({'error': 'An account with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        role = request.data.get('role', 'user').strip().lower()
        user = User.objects.create_user(username=username, email=email, password=password)
        if role == 'admin':
            user.is_staff = True
            user.is_superuser = True
            user.save()
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Account created successfully!',
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_staff or user.is_superuser,
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Authenticate user and return auth token."""
    
    def post(self, request):
        from django.contrib.auth import authenticate
        
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        
        if not username or not password:
            return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Support login by email
        if '@' in username:
            try:
                user_obj = User.objects.get(email=username)
                username = user_obj.username
            except User.DoesNotExist:
                return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response({'error': 'Invalid credentials. Please try again.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_active:
            return Response({'error': 'Account is disabled.'}, status=status.HTTP_403_FORBIDDEN)
        
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Login successful!',
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_staff or user.is_superuser,
            }
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """Invalidate the user's auth token."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class ProfileView(APIView):
    """Get the current user's profile."""
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_admin': user.is_staff or user.is_superuser,
            'date_joined': user.date_joined.strftime('%Y-%m-%d'),
        }, status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):
    """Generate and send reset password OTP."""
    
    def post(self, request):
        import random
        from django.core.mail import send_mail
        from .models import PasswordResetOTP
        
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not User.objects.filter(email=email).exists():
            return Response({'error': 'Account with this email does not exist.'}, status=status.HTTP_400_BAD_REQUEST)
            
        PasswordResetOTP.objects.filter(email=email).delete()
        
        otp = f"{random.randint(100000, 999999)}"
        PasswordResetOTP.objects.create(email=email, otp=otp)
        
        subject = 'CyberSentinel - Password Reset Verification Code'
        message = f"Your password reset verification code is: {otp}\nThis code will expire in 10 minutes."
        from_email = 'no-reply@cybersentinel.ai'
        
        email_sent = False
        try:
            send_mail(subject, message, from_email, [email], fail_silently=False)
            email_sent = True
        except Exception as e:
            print(f"\n[DEV MOCK MODE] Failed to send email via SMTP: {str(e)}")
            print(f"==================================================")
            print(f"PASSWORD RESET REQUEST FOR: {email}")
            print(f"VERIFICATION OTP CODE: {otp}")
            print(f"==================================================\n")
            
        return Response({
            'message': 'Verification code sent to your email.' if email_sent else 'Verification code generated (Mock Mode).',
            'dev_otp': otp if not email_sent else None,
            'is_mocked': not email_sent
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """Verify OTP and reset password."""
    
    def post(self, request):
        from .models import PasswordResetOTP
        
        email = request.data.get('email', '').strip()
        otp = request.data.get('otp', '').strip()
        new_password = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')
        
        if not email or not otp or not new_password:
            return Response({'error': 'Email, verification code, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if new_password != confirm_password:
            return Response({'error': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            otp_record = PasswordResetOTP.objects.get(email=email, otp=otp)
        except PasswordResetOTP.DoesNotExist:
            return Response({'error': 'Invalid verification code or email.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if otp_record.is_expired():
            otp_record.delete()
            return Response({'error': 'Verification code has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            
            otp_record.delete()
            return Response({'message': 'Password has been reset successfully. You can now login.'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User matching this email no longer exists.'}, status=status.HTTP_400_BAD_REQUEST)


class GoogleLoginView(APIView):
    """
    Validates a Google ID Token (JWT) sent from the frontend.
    Auto-registers the user if their email is not already in the system.
    """
    def post(self, request):
        import requests
        token = request.data.get('id_token', '').strip()
        if not token:
            return Response({'error': 'Google token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify token via Google OAuth token verification URL
        try:
            res = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}", timeout=8)
            if res.status_code != 200:
                return Response({'error': 'Invalid Google ID token.'}, status=status.HTTP_400_BAD_REQUEST)
            
            token_info = res.json()
            email = token_info.get('email', '').strip()
            
            if not email:
                return Response({'error': 'Google email not found in token info.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Find or auto-register user
            user_exists = User.objects.filter(email=email).exists()
            if not user_exists:
                # Generate unique username
                username_base = email.split('@')[0]
                username = username_base
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{username_base}_{counter}"
                    counter += 1
                
                # Auto-create User
                import secrets
                rand_pass = secrets.token_hex(16)
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=rand_pass
                )
                # Auto-initialize user integrations settings config
                from .models import UserIntegration
                UserIntegration.objects.get_or_create(user=user)
            else:
                user = User.objects.get(email=email)
            
            if not user.is_active:
                return Response({'error': 'Account is disabled.'}, status=status.HTTP_403_FORBIDDEN)
            
            # Generate auth token
            from rest_framework.authtoken.models import Token
            auth_token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'message': 'Google authentication successful!',
                'token': auth_token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_admin': user.is_staff or user.is_superuser
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': f'Google login server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


