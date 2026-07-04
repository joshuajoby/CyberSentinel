import os
import logging
from PIL import Image

logger = logging.getLogger(__name__)

# Cache reader instance to avoid reloading it on every request
_EASYOCR_READER = None
_EASYOCR_LOADED = False

try:
    import easyocr
    _EASYOCR_LOADED = True
except ImportError:
    logger.warning("EasyOCR is not installed. CyberSentinel will use a smart signature-based mock OCR fallback.")

def extract_text_from_image(image_path_or_file):
    global _EASYOCR_READER, _EASYOCR_LOADED
    
    extracted_text = ""
    engine_used = "Mock OCR Fallback"

    if _EASYOCR_LOADED:
        try:
            if _EASYOCR_READER is None:
                # Initialize reader for English
                logger.info("Initializing EasyOCR reader...")
                _EASYOCR_READER = easyocr.Reader(['en'], gpu=False)
            
            # Read text
            results = _EASYOCR_READER.readtext(image_path_or_file, detail=0)
            extracted_text = " ".join(results)
            engine_used = "EasyOCR Engine (Local)"
            if extracted_text.strip():
                return extracted_text, engine_used
        except Exception as e:
            logger.error(f"EasyOCR extraction failed: {str(e)}. Falling back to mock engine.")

    # Smart Mock OCR Engine based on filename hints or generic fallback
    # This allows developers to test different scenarios by naming files appropriately
    filename = ""
    if isinstance(image_path_or_file, str):
        filename = os.path.basename(image_path_or_file).lower()
    elif hasattr(image_path_or_file, 'name'):
        filename = image_path_or_file.name.lower()

    if "netflix" in filename:
        extracted_text = (
            "Netflix Billing Alert\n"
            "Your subscription payment failed. Update your card immediately "
            "to avoid service interruption. Click here: http://netflix-billing-update.com\n"
            "Thank you,\nNetflix Support"
        )
    elif "paypal" in filename or "paypa1" in filename:
        extracted_text = (
            "PayPal Security Department\n"
            "We detected unauthorized transactions on your profile. "
            "Invoice #5819 for $782.90 to Walmart. "
            "If this was not you, cancel it: http://paypal-billing-cancel.com\n"
            "Log in now to secure your account."
        )
    elif "chase" in filename or "bank" in filename or "bofa" in filename:
        extracted_text = (
            "CHASE BANK ALERT\n"
            "A suspicious login was attempted from Houston, TX. "
            "Your mobile access has been locked. Verify identity at: http://secure-chase-login.xyz\n"
            "Do not ignore this notice."
        )
    elif "meta" in filename or "crypto" in filename or "wallet" in filename:
        extracted_text = (
            "METAMASK SECURITY CENTRE\n"
            "Notice of account validation. Failure to verify your hardware wallet seed phrase "
            "will result in permanent loss of access. Sync now at http://metamask-security.co"
        )
    else:
        # Default typical phishing email template for arbitrary uploads
        extracted_text = (
            "URGENT SECURITY NOTICE\n"
            "Someone signed in to your account from a new Chrome browser in Russia.\n"
            "IP: 185.156.72.10\n"
            "If you did not authorize this, reset your credentials at: http://verification-support-login.info\n"
            "CyberSentinel AI Security Warning"
        )

    return extracted_text.strip(), engine_used
