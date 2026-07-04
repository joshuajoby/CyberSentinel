import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

from .models import ScanLog, QuizQuestion
from .serializers import ScanLogSerializer, QuizQuestionSerializer
from .ml_classifier import classifier
from .url_analyzer import analyze_url
from .ocr_processor import extract_text_from_image

class TextAnalysisView(APIView):
    def post(self, request):
        text = request.data.get("text", "")
        if not text:
            return Response({"error": "Content text is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        result = classifier.analyze_text(text)
        
        user = request.user if request.user and request.user.is_authenticated else None
        # Log to database
        ScanLog.objects.create(
            user=user,
            scan_type='TEXT',
            input_content=text[:200] + ('...' if len(text) > 200 else ''),
            risk_score=result["risk_score"],
            risk_level=result["risk_level"]
        )
        
        return Response(result, status=status.HTTP_200_OK)


class UrlAnalysisView(APIView):
    def post(self, request):
        url = request.data.get("url", "")
        if not url:
            return Response({"error": "URL link is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        result = analyze_url(url)
        
        user = request.user if request.user and request.user.is_authenticated else None
        # Log to database
        ScanLog.objects.create(
            user=user,
            scan_type='URL',
            input_content=url,
            risk_score=result["risk_score"],
            risk_level=result["risk_level"]
        )
        
        return Response(result, status=status.HTTP_200_OK)


class ScreenshotAnalysisView(APIView):
    def post(self, request):
        image_file = request.FILES.get("image", None)
        if not image_file:
            return Response({"error": "Screenshot image file is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Basic validation
        if not image_file.name.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.tiff', '.bmp')):
            return Response({"error": "Unsupported image format"}, status=status.HTTP_400_BAD_REQUEST)

        # Temporary save image to read it (Django handles in-memory vs temporary files)
        try:
            extracted_text, engine_used = extract_text_from_image(image_file)
            
            # Now run text analysis on the extracted text
            text_result = classifier.analyze_text(extracted_text)
            
            # Also extract URLs from the text to perform URL analysis
            import re
            urls = re.findall(r'https?://[^\s]+', extracted_text)
            url_result = None
            if urls:
                # Analyze the first URL found
                url_result = analyze_url(urls[0])
                # If URL is critical, boost text result score
                if url_result["risk_score"] > text_result["risk_score"]:
                    text_result["risk_score"] = url_result["risk_score"]
                    text_result["risk_level"] = url_result["risk_level"]
                    # Add URL threat indicators
                    text_result["threat_indicators"].extend(url_result["threat_indicators"])
            
            # Ensure threat indicators are unique by type
            seen = set()
            dedup_indicators = []
            for ind in text_result["threat_indicators"]:
                if ind["type"] not in seen:
                    seen.add(ind["type"])
                    dedup_indicators.append(ind)
            text_result["threat_indicators"] = dedup_indicators

            user = request.user if request.user and request.user.is_authenticated else None
            # Log to database
            ScanLog.objects.create(
                user=user,
                scan_type='SCREENSHOT',
                input_content=f"[Image: {image_file.name}] Extracted Text: {extracted_text[:100]}...",
                risk_score=text_result["risk_score"],
                risk_level=text_result["risk_level"]
            )
            
            response_data = {
                "extracted_text": extracted_text,
                "ocr_engine": engine_used,
                "risk_score": text_result["risk_score"],
                "risk_level": text_result["risk_level"],
                "threat_indicators": text_result["threat_indicators"],
                "highlighted_words": text_result["highlighted_words"],
                "recommendations": text_result["recommendations"],
                "associated_url_analysis": url_result
            }
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to process image OCR: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardStatsView(APIView):
    def get(self, request):
        user = request.user if request.user and request.user.is_authenticated else None
        
        # Generate initial logs if table is completely empty for this user (helps UI presentation immediately)
        if user:
            user_logs_count = ScanLog.objects.filter(user=user).count()
            if user_logs_count == 0:
                self._prepopulate_mock_logs(user)
            logs = ScanLog.objects.filter(user=user)
        else:
            anon_logs_count = ScanLog.objects.filter(user__isnull=True).count()
            if anon_logs_count == 0:
                self._prepopulate_mock_logs(None)
            logs = ScanLog.objects.filter(user__isnull=True)

        # Gather general metrics
        total_scans = logs.count()
        
        threats = logs.exclude(risk_level='Low')
        total_threats = threats.count()
        
        avg_risk = sum([log.risk_score for log in logs]) / max(1, total_scans)
        
        # Counts by category
        scan_type_counts = logs.values('scan_type').annotate(count=Count('id'))
        types_dict = {item['scan_type']: item['count'] for item in scan_type_counts}
        
        # Risk level distribution
        risk_level_counts = logs.values('risk_level').annotate(count=Count('id'))
        risk_dict = {item['risk_level']: item['count'] for item in risk_level_counts}

        # Retrieve recent 8 scans
        recent_scans = ScanLogSerializer(logs[:8], many=True).data

        # Build chart data (daily scans over past 7 days)
        chart_data = []
        for i in range(6, -1, -1):
            date = timezone.now().date() - timedelta(days=i)
            day_logs = logs.filter(created_at__date=date)
            chart_data.append({
                "date": date.strftime("%b %d"),
                "scans": day_logs.count(),
                "threats": day_logs.exclude(risk_level='Low').count()
            })

        return Response({
            "total_scans": total_scans,
            "total_threats": total_threats,
            "avg_risk": round(avg_risk, 1),
            "threats_percentage": round((total_threats / max(1, total_scans)) * 100, 1),
            "types_distribution": {
                "text": types_dict.get('TEXT', 0),
                "url": types_dict.get('URL', 0),
                "screenshot": types_dict.get('SCREENSHOT', 0),
            },
            "risk_distribution": {
                "low": risk_dict.get('Low', 0),
                "medium": risk_dict.get('Medium', 0),
                "high": risk_dict.get('High', 0),
                "critical": risk_dict.get('Critical', 0),
            },
            "chart_data": chart_data,
            "recent_scans": recent_scans
        }, status=status.HTTP_200_OK)

    def _prepopulate_mock_logs(self, user):
        # Set up a pool of mock entries spanning the past few days
        now = timezone.now()
        mock_templates = [
            ('TEXT', 'Urgent update: Pay invoice now', 85.0, 'Critical', 2),
            ('URL', 'http://paypal-security-update.xyz/login', 95.0, 'Critical', 3),
            ('TEXT', 'Hey Joshua, meeting scheduled for 10am', 5.0, 'Low', 1),
            ('URL', 'https://github.com/login', 0.0, 'Low', 4),
            ('SCREENSHOT', '[Screenshot: invoice.png] Extracted PayPal charge', 88.0, 'Critical', 0),
            ('TEXT', 'Your Amazon package tracking details', 12.0, 'Low', 5),
            ('URL', 'http://chase-verification-portal.com', 92.0, 'Critical', 1),
            ('TEXT', 'Congratulations! You won a free iPhone!', 78.0, 'High', 2),
            ('SCREENSHOT', '[Screenshot: alert.jpg] Suspicious metamask warning', 96.0, 'Critical', 3),
            ('TEXT', 'Hi mom, I will arrive home around 6 PM', 2.0, 'Low', 0),
            ('URL', 'https://google.com', 0.0, 'Low', 1),
            ('TEXT', 'Billing failure for Netflix subscription', 65.0, 'High', 2),
            ('URL', 'http://netflix-billing-failed.club', 89.0, 'Critical', 4),
            ('SCREENSHOT', '[Screenshot: test.jpg] Legitimate slack message', 10.0, 'Low', 5),
        ]
        
        for scan_type, content, score, level, days_ago in mock_templates:
            log = ScanLog(
                user=user,
                scan_type=scan_type,
                input_content=content,
                risk_score=score,
                risk_level=level
            )
            log.save()
            # Manually offset date
            log.created_at = now - timedelta(days=days_ago)
            log.save()


class QuizQuestionView(APIView):
    def get(self, request):
        # Prepopulate quiz questions if empty
        if QuizQuestion.objects.count() == 0:
            self._prepopulate_quiz()
            
        questions = QuizQuestion.objects.all()
        serializer = QuizQuestionSerializer(questions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _prepopulate_quiz(self):
        questions = [
            {
                "scenario_name": "IRS Tax Refund SMS Alert",
                "sender": "+1 (800) 492-9102",
                "subject": "SMS Text Message",
                "body": "IRS Alert: We detected an unpaid tax refund of $432.10 under your name. Claim your tax credit now by filling this secure form: http://irs-tax-refund-portal.org",
                "is_phishing": True,
                "explanation": "This is a typical tax phishing scam. The IRS never contacts taxpayers via text message to request bank details or offer refunds. Additionally, the domain 'irs-tax-refund-portal.org' is fake; the official IRS domain is irs.gov.",
                "clues": ["irs-tax-refund-portal.org", "refund of $432.10", "Claim your tax credit now"]
            },
            {
                "scenario_name": "Netflix Billing Issue Email",
                "sender": "billing-support@netflix-alerts-billing.com",
                "subject": "Action Required: Update payment card immediately",
                "body": "Dear Netflix Member, your monthly subscription payment failed. We will suspend your service in 24 hours if payment is not updated. Click here to confirm billing profile details: http://netflix-payment-check.net/billing",
                "is_phishing": True,
                "explanation": "This email uses a generic greeting ('Dear Netflix Member') instead of your name, creates artificial urgency (24 hours), and uses a spoofed domain 'netflix-alerts-billing.com' and destination link 'netflix-payment-check.net' instead of official netflix.com.",
                "clues": ["netflix-alerts-billing.com", "suspend your service in 24 hours", "netflix-payment-check.net"]
            },
            {
                "scenario_name": "Company IT Team Software Update",
                "sender": "it-support@corporatesecurity-hub.com",
                "subject": "Mandatory Security Upgrade for Internal Slack Portal",
                "body": "Hi team, we are upgrading our internal Slack client security protocols. Please download the patch executable from our secure engineering file store and run it immediately: http://internal-engineering-shares.info/slack_patch.exe",
                "is_phishing": True,
                "explanation": "This is an internal spear-phishing attack attempting to distribute malware. IT support will rarely ask you to run an arbitrary executable file from an external '.info' domain. Always confirm suspicious software updates with your IT administrators first.",
                "clues": ["slack_patch.exe", "corporatesecurity-hub.com", "internal-engineering-shares.info"]
            },
            {
                "scenario_name": "Amazon Package Delivery Confirm",
                "sender": "auto-confirm@amazon.com",
                "subject": "Your Amazon order #409-918274-12847 has shipped",
                "body": "Hello Joshua, thanks for shopping. Your order was successfully packed and shipped. You can trace its shipment status securely on your official Amazon portal dashboard or mobile app.",
                "is_phishing": False,
                "explanation": "This is a legitimate order notification. The sender domain matches amazon.com, it uses the recipient's actual name, it provides a realistic order tracking number, and it does not link to any suspicious external portals, instructing the user to log in safely via their app.",
                "clues": []
            },
            {
                "scenario_name": "Metamask Wallet Seed Recovery",
                "sender": "Metamask Alerts Team",
                "subject": "Immediate wallet verification required to avoid account block",
                "body": "Dear MetaMask Customer, our smart contract upgrade requires all active wallets to re-verify their status. Failure to input your 12-word seed phrase will lead to wallet suspension. Sync now at: http://metamask-ledger-sec.com",
                "is_phishing": True,
                "explanation": "No legitimate crypto wallet provider (like MetaMask or Ledger) will EVER ask you for your 12-word seed recovery phrase. Your seed phrase should never be typed online. The site 'metamask-ledger-sec.com' is a malicious credential harvester.",
                "clues": ["metamask-ledger-sec.com", "12-word seed phrase", "wallet suspension"]
            },
            {
                "scenario_name": "Colleague Code Review Notification",
                "sender": "notifications@github.com",
                "subject": "[GitHub] Pull Request #14: Added OCR models and classifier logic",
                "body": "Hi Joshua, Arpan requested your review on the pull request. Let's merge these changes to the primary repository once all tests pass.",
                "is_phishing": False,
                "explanation": "This is a normal automated notification from GitHub. It refers to your current project workspace, matches the official sender domain, has no urgent threat language, and points to routine professional collaboration.",
                "clues": []
            }
        ]
        
        for q in questions:
            QuizQuestion.objects.create(
                scenario_name=q["scenario_name"],
                sender=q["sender"],
                subject=q["subject"],
                body=q["body"],
                is_phishing=q["is_phishing"],
                explanation=q["explanation"],
                clues=q["clues"]
            )
