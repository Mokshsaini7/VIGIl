"""
VIGIL — Module 5: Context Analysis & Social Engineering Detector
Combines NLP intent classification and rule-based regex patterns to detect
financial fraud, OTP theft, credential harvests, urgency, secrecy, and impersonation.
"""

import re
from typing import Dict, Any, List


class ContextAnalyzer:
    """
    NLP & Rule-based social engineering engine.
    Analyzes conversation transcripts in English, Hindi, and Hinglish for security threat vectors.
    """

    def __init__(self):
        # Intent patterns (English + Hindi + Hinglish)
        self.otp_patterns = [
            r"\b(otp|one time password|pin|verification code|security code)\b",
            r"\b(send me the code|share the code|tell me the pin|give me the otp)\b",
            r"\b(code batao|otp batao|pin batao|code bhejo|otp bhejo)\b"
        ]

        self.money_patterns = [
            r"\b(transfer|send money|pay|upi|gpay|phonepe|paytm|bank transfer|deposit|fund)\b",
            r"\b(rs|rupees|lakh|thousand|dollars|\$|₹)\b",
            r"\b(paise transfer karo|paise bhejo|money send karo|account me dalo)\b"
        ]

        self.credential_patterns = [
            r"\b(card number|cvv|expiry|password|netbanking|username|credentials|atm pin)\b",
            r"\b(bank account|account number|ifsc|login details)\b",
            r"\b(card details batao|password batao|cvv kya hai)\b"
        ]

        self.urgency_patterns = [
            r"\b(immediately|right now|urgent|block|blocked|suspend|suspended|expire|within 10 minutes|today itself|emergency)\b",
            r"\b(abhi karo|turant|jail|police|legal action|arrest|court)\b"
        ]

        self.secrecy_patterns = [
            r"\b(don't tell anyone|keep this secret|do not inform|do not disconnect|stay on line|nobody should know)\b",
            r"\b(kisi ko mat batana|secret rakho|call mat katna|line par raho)\b"
        ]

        self.remote_access_patterns = [
            r"\b(anydesk|teamviewer|quicksupport|rustdesk|remote access|download app|screen share)\b",
            r"\b(app download karo|screen share karo)\b"
        ]

        self.impersonation_keywords = {
            "BANK": [r"\bbank\b", r"\bsbi\b", r"\bhdfc\b", r"\bicici\b", r"\baxis\b", r"\brbi\b", r"\bbank manager\b", r"\bcustomer care\b", r"\bfraud department\b", r"\bbank officer\b", r"\baccount\b"],
            "POLICE": [r"\bpolice\b", r"\bcbi\b", r"\bcrime branch\b", r"\binspector\b", r"\bstation officer\b", r"\bcyber cell\b", r"\bwarrant\b", r"\barrest\b"],
            "GOVERNMENT": [r"\bincome tax\b", r"\bcustoms\b", r"\btelecom ministry\b", r"\btrai\b", r"\benforcement directorate\b", r"\bgovernment officer\b", r"\blegal action\b"],
            "FAMILY": [r"\bson\b", r"\bdaughter\b", r"\bfather\b", r"\bmother\b", r"\baccident\b", r"\bhospital\b", r"\bkidnapped\b", r"\bbail\b", r"\bhelp me dad\b", r"\bhelp me mom\b"],
            "TECH_SUPPORT": [r"\bmicrosoft\b", r"\bapple\b", r"\bgoogle support\b", r"\bvirus detected\b", r"\bsecurity team\b"]
        }

    def analyze_transcript(self, transcript: str) -> Dict[str, Any]:
        """
        Scans transcript text for social engineering intent, urgency, secrecy, and fraud vectors.
        """
        if not transcript or not transcript.strip():
            return {
                "otp_request": False,
                "money_request": False,
                "credential_request": False,
                "remote_access_request": False,
                "urgency_score": 0.0,
                "secrecy_score": 0.0,
                "threat_score": 0.0,
                "impersonation_context": "NONE",
                "social_engineering_score": 0.0,
                "detected_signals": []
            }

        text_lower = transcript.lower()
        detected_signals = []

        # 1. Flag Detection
        otp_request = any(re.search(p, text_lower) for p in self.otp_patterns)
        if otp_request:
            detected_signals.append("OTP_REQUEST")

        money_request = any(re.search(p, text_lower) for p in self.money_patterns)
        if money_request:
            detected_signals.append("MONEY_REQUEST")

        credential_request = any(re.search(p, text_lower) for p in self.credential_patterns)
        if credential_request:
            detected_signals.append("CREDENTIAL_REQUEST")

        remote_access_request = any(re.search(p, text_lower) for p in self.remote_access_patterns)
        if remote_access_request:
            detected_signals.append("REMOTE_ACCESS_REQUEST")

        # 2. Urgency Scoring
        urgency_matches = sum(1 for p in self.urgency_patterns if re.search(p, text_lower))
        urgency_score = min(round(urgency_matches * 0.35, 2), 0.98)
        if urgency_score > 0.30:
            detected_signals.append("URGENCY_DETECTED")

        # 3. Secrecy Scoring
        secrecy_matches = sum(1 for p in self.secrecy_patterns if re.search(p, text_lower))
        secrecy_score = min(round(secrecy_matches * 0.40, 2), 0.98)
        if secrecy_score > 0.30:
            detected_signals.append("SECRECY_DEMAND")

        # 4. Impersonation Context Scoring (word-boundary regex matches)
        context_scores = {}
        for context, patterns in self.impersonation_keywords.items():
            score = sum(1 for pat in patterns if re.search(pat, text_lower))
            if score > 0:
                context_scores[context] = score

        if context_scores:
            impersonation_context = max(context_scores, key=context_scores.get)
            detected_signals.append(f"{impersonation_context}_IMPERSONATION")
        else:
            impersonation_context = "NONE"

        # 5. Composite Social Engineering Score (0.0 to 1.0)
        se_score = 0.0
        if otp_request:
            se_score += 0.35
        if money_request:
            se_score += 0.30
        if credential_request:
            se_score += 0.30
        if remote_access_request:
            se_score += 0.35
        if impersonation_context != "NONE":
            se_score += 0.20

        se_score += (urgency_score * 0.25) + (secrecy_score * 0.20)
        social_engineering_score = min(round(se_score, 2), 0.99)

        # Threat score synthesis
        threat_score = min(round((social_engineering_score * 0.70) + (urgency_score * 0.30), 2), 0.99)

        return {
            "otp_request": otp_request,
            "money_request": money_request,
            "credential_request": credential_request,
            "remote_access_request": remote_access_request,
            "urgency_score": urgency_score,
            "secrecy_score": secrecy_score,
            "threat_score": threat_score,
            "impersonation_context": impersonation_context,
            "social_engineering_score": social_engineering_score,
            "detected_signals": detected_signals
        }
