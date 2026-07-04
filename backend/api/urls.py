from django.urls import path
from .views import TextAnalysisView, UrlAnalysisView, ScreenshotAnalysisView, DashboardStatsView, QuizQuestionView
from .auth_views import RegisterView, LoginView, LogoutView, ProfileView, ForgotPasswordView, ResetPasswordView, GoogleLoginView
from .subscription_views import SubscribeView, UnsubscribeView, SubscriberListView
from .chat_views import ChatbotView
from .admin_views import AdminStatsView, AdminUserActionView
from .integrations_views import GmailImportView, SmsDispatchView, UserIntegrationView, GmailReplyDraftView, PublicConfigView

urlpatterns = [
    # Scanning endpoints
    path('analyze/text/', TextAnalysisView.as_view(), name='analyze-text'),
    path('analyze/url/', UrlAnalysisView.as_view(), name='analyze-url'),
    path('analyze/screenshot/', ScreenshotAnalysisView.as_view(), name='analyze-screenshot'),
    
    # Dashboard
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    
    # Quiz
    path('quiz/', QuizQuestionView.as_view(), name='quiz-questions'),
    
    # Auth
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/profile/', ProfileView.as_view(), name='auth-profile'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
    path('auth/google-login/', GoogleLoginView.as_view(), name='auth-google-login'),
    
    # Integrations
    path('integrations/gmail/import/', GmailImportView.as_view(), name='integrations-gmail-import'),
    path('integrations/sms/dispatch/', SmsDispatchView.as_view(), name='integrations-sms-dispatch'),
    path('integrations/config/', UserIntegrationView.as_view(), name='integrations-config'),
    path('integrations/gmail/reply-draft/', GmailReplyDraftView.as_view(), name='integrations-gmail-reply-draft'),
    path('config/public/', PublicConfigView.as_view(), name='config-public'),
    
    # Subscriptions
    path('subscribe/', SubscribeView.as_view(), name='subscribe'),
    path('unsubscribe/', UnsubscribeView.as_view(), name='unsubscribe'),
    path('admin/subscribers/', SubscriberListView.as_view(), name='admin-subscribers'),
    
    # Chatbot
    path('chat/', ChatbotView.as_view(), name='chatbot'),
    
    # Admin
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('admin/users/action/', AdminUserActionView.as_view(), name='admin-user-action'),
]
