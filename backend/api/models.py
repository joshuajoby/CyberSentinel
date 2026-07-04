from django.db import models
from django.contrib.auth.models import User

# ── 1. SCANNING LOGS AND DATA MODEL ───────────────────────────────────────────

class ScanLog(models.Model):
    """
    Stores cybersecurity telemetry results from the text, URL, and screenshot scanners.
    
    Fields:
    - user: Optional foreign key to support tracking historical metrics per registered user account.
    - scan_type: Indicates source channel (TEXT, URL, or SCREENSHOT).
    - input_content: Truncated sample text or link analyzed.
    - risk_score: Computed security threat percentage (0.0 to 100.0).
    - risk_level: Categorical evaluation (Low, Medium, High, Critical).
    - created_at: Automatic logging timestamp.
    """
    SCAN_TYPES = (
        ('TEXT', 'Email/SMS Text'),
        ('URL', 'URL Link'),
        ('SCREENSHOT', 'Screenshot OCR'),
    )
    
    RISK_LEVELS = (
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    )

    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='scan_logs'
    )
    scan_type = models.CharField(max_length=20, choices=SCAN_TYPES)
    input_content = models.TextField()
    sender = models.CharField(max_length=255, blank=True, default='')
    subject = models.CharField(max_length=255, blank=True, default='')
    risk_score = models.FloatField()
    risk_level = models.CharField(max_length=15, choices=RISK_LEVELS)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Scan Log"
        verbose_name_plural = "Scan Logs"

    def __str__(self):
        return f"{self.scan_type} | {self.risk_level} ({self.risk_score}%) | {self.created_at.strftime('%Y-%m-%d %H:%M')}"


# ── 2. EDUCATIONAL QUIZ SCHEMAS ───────────────────────────────────────────────

class QuizQuestion(models.Model):
    """
    Represents simulated phishing scenarios used in the Awareness Center Quiz.
    
    Fields:
    - scenario_name: Brief title of the security challenge.
    - sender: Mock email header 'From' metadata.
    - subject: Mock email header 'Subject' metadata.
    - body: Content of the message displaying potential red flags.
    - is_phishing: Boolean value. True represents scams; False represents safe correspondence.
    - explanation: Informative context shown after user answers.
    - clues: JSON list containing specific strings in the body representing red flags.
    """
    scenario_name = models.CharField(max_length=100)
    sender = models.CharField(max_length=150, blank=True, null=True)
    subject = models.CharField(max_length=200, blank=True, null=True)
    body = models.TextField()
    is_phishing = models.BooleanField(default=True)
    explanation = models.TextField()
    clues = models.JSONField(default=list, help_text="List of red flag strings")

    class Meta:
        verbose_name = "Quiz Question"
        verbose_name_plural = "Quiz Questions"

    def __str__(self):
        return f"{self.scenario_name} | {'Phishing' if self.is_phishing else 'Legitimate'}"


# ── 3. USER ALERT SUBSCRIPTIONS ───────────────────────────────────────────────

class Subscriber(models.Model):
    """
    Tracks email nodes subscribed to receive automated threat digest updates.
    
    Fields:
    - email: Unique target subscriber address.
    - name: Optional subscriber display name.
    - is_active: Toggle to check if subscription is valid or disabled.
    - created_at: Automatic registration timestamp.
    - unsubscribe_token: Secure auto-generated hash key to verify opt-out requests.
    """
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    unsubscribe_token = models.CharField(max_length=64, unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.unsubscribe_token:
            import secrets
            self.unsubscribe_token = secrets.token_hex(32)
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Subscriber"
        verbose_name_plural = "Subscribers"

    def __str__(self):
        return f"{self.email} ({'Active' if self.is_active else 'Unsubscribed'})"


# ── 4. SECURITY PASSCODE VERIFICATION ─────────────────────────────────────────

class PasswordResetOTP(models.Model):
    """
    Maintains temporary 6-digit verification codes issued for password recovery routing.
    
    Fields:
    - email: Target account email.
    - otp: 6-character numeric verification code.
    - created_at: Timestamp used to calculate code expirations.
    - is_verified: Status flag to prevent code re-use.
    """
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def is_expired(self):
        """Returns True if the OTP was created more than 10 minutes ago."""
        from django.utils import timezone
        import datetime
        return timezone.now() > self.created_at + datetime.timedelta(minutes=10)

    class Meta:
        verbose_name = "Password Reset OTP"
        verbose_name_plural = "Password Reset OTPs"

    def __str__(self):
        return f"{self.email} | {self.otp} | Verified: {self.is_verified}"


# ── 5. USER API INTEGRATION SETTINGS ─────────────────────────────────────────

class UserIntegration(models.Model):
    """
    Stores API integration configurations for registered users (Gmail Client IDs & Twilio tokens).
    
    Fields:
    - user: Linked registered user profile.
    - gmail_client_id: Saved Google Client ID credential.
    - gmail_access_token: Active Google OAuth token override.
    - twilio_sid: Saved Twilio Account SID.
    - twilio_token: Saved Twilio Auth Token.
    - twilio_from: Saved SMS sender phone number.
    - twilio_to: Saved alert recipient phone number.
    - updated_at: Automatic update timestamp.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='integration_config')
    gmail_client_id = models.CharField(max_length=255, blank=True, default='')
    gmail_access_token = models.TextField(blank=True, default='')
    twilio_sid = models.CharField(max_length=100, blank=True, default='')
    twilio_token = models.CharField(max_length=100, blank=True, default='')
    twilio_from = models.CharField(max_length=20, blank=True, default='')
    twilio_to = models.CharField(max_length=20, blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Integration Config"
        verbose_name_plural = "User Integration Configs"

    def __str__(self):
        return f"Integrations Config for {self.user.username}"

