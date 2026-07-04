from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.db.models import Count
from .models import ScanLog, Subscriber


def get_admin_user(request):
    """Helper to verify admin auth from request. Returns user or None."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Token '):
        return None
    token_key = auth_header.split(' ', 1)[1]
    try:
        token_obj = Token.objects.get(key=token_key)
        user = token_obj.user
        if user.is_staff or user.is_superuser:
            return user
        return None
    except Token.DoesNotExist:
        return None


class AdminStatsView(APIView):
    """Admin overview: user counts, scans, subscribers, threat distribution."""
    
    def get(self, request):
        admin_user = get_admin_user(request)
        if not admin_user:
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        
        total_users = User.objects.count()
        total_scans = ScanLog.objects.count()
        total_subscribers = Subscriber.objects.filter(is_active=True).count()
        total_threats = ScanLog.objects.exclude(risk_level='Low').count()
        
        # Top threat types
        type_dist = ScanLog.objects.values('scan_type').annotate(count=Count('id'))
        
        # Recent users
        recent_users = list(User.objects.order_by('-date_joined')[:10].values(
            'id', 'username', 'email', 'is_staff', 'is_active', 'date_joined'
        ))
        for u in recent_users:
            u['date_joined'] = u['date_joined'].strftime('%Y-%m-%d %H:%M')
        
        # Recent scan logs
        recent_scans = list(ScanLog.objects.all()[:20].values(
            'id', 'scan_type', 'input_content', 'risk_score', 'risk_level', 'created_at', 'user__username'
        ))
        for s in recent_scans:
            s['created_at'] = s['created_at'].strftime('%Y-%m-%d %H:%M')
        
        # Subscribers
        subscribers = list(Subscriber.objects.order_by('-created_at')[:50].values(
            'id', 'email', 'name', 'is_active', 'created_at'
        ))
        for sub in subscribers:
            sub['created_at'] = sub['created_at'].strftime('%Y-%m-%d %H:%M')
        
        return Response({
            'stats': {
                'total_users': total_users,
                'total_scans': total_scans,
                'total_threats': total_threats,
                'active_subscribers': total_subscribers,
            },
            'scan_type_distribution': {item['scan_type']: item['count'] for item in type_dist},
            'recent_users': recent_users,
            'recent_scans': recent_scans,
            'subscribers': subscribers,
        }, status=status.HTTP_200_OK)


class AdminUserActionView(APIView):
    """Admin: toggle user active/staff status or delete user."""
    
    def post(self, request):
        admin_user = get_admin_user(request)
        if not admin_user:
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        
        action = request.data.get('action')  # 'toggle_active', 'toggle_staff', 'delete'
        user_id = request.data.get('user_id')
        
        if not action or not user_id:
            return Response({'error': 'action and user_id are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Cannot modify superuser
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if target_user.is_superuser:
            return Response({'error': 'Cannot modify superuser.'}, status=status.HTTP_403_FORBIDDEN)
        
        if action == 'toggle_active':
            target_user.is_active = not target_user.is_active
            target_user.save()
            return Response({'message': f"User {'activated' if target_user.is_active else 'deactivated'} successfully."})
        
        elif action == 'toggle_staff':
            target_user.is_staff = not target_user.is_staff
            target_user.save()
            return Response({'message': f"User {'granted' if target_user.is_staff else 'revoked'} admin access."})
        
        elif action == 'delete':
            if target_user.id == admin_user.id:
                return Response({'error': 'Cannot delete yourself.'}, status=status.HTTP_400_BAD_REQUEST)
            target_user.delete()
            return Response({'message': 'User deleted successfully.'})
        
        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)
