"""
VIGIL — Module 7: Threat Classification & Action Recommendation Engine
Categorizes active security threats into multi-label categories and generates 
actionable, clear security directives for end users.
"""

from typing import Dict, Any, List


class ThreatClassifier:
    """
    Threat categorization engine and actionable safety advisory generator.
    """

    def classify_threats(
        self,
        risk_result: Dict[str, Any],
        voice_result: Dict[str, Any],
        speaker_result: Dict[str, Any],
        context_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Maps multi-module analysis findings into threat labels and recommended actions.
        """
        risk_score = risk_result.get("risk_score", 0)
        risk_level = risk_result.get("risk_level", "LOW")

        threat_categories: List[str] = []

        synth_classification = voice_result.get("classification", "REAL")
        speaker_status = speaker_result.get("status", "MATCH")
        impersonation = context_result.get("impersonation_context", "NONE")

        # Threat Label Assignment
        if synth_classification == "SYNTHETIC":
            threat_categories.append("VOICE_CLONING")
            threat_categories.append("VOICE_SPOOFING")

        if speaker_status == "MISMATCH":
            threat_categories.append("SPEAKER_MISMATCH")

        if context_result.get("otp_request"):
            threat_categories.append("OTP_SCAM")

        if context_result.get("money_request") or context_result.get("credential_request"):
            threat_categories.append("FINANCIAL_FRAUD")

        if impersonation == "BANK":
            threat_categories.append("BANK_IMPERSONATION")
        elif impersonation == "FAMILY":
            threat_categories.append("FAMILY_IMPERSONATION")
        elif impersonation in ("POLICE", "GOVERNMENT"):
            threat_categories.append("GOVERNMENT_IMPERSONATION")

        if context_result.get("social_engineering_score", 0.0) >= 0.70:
            threat_categories.append("HIGH_RISK_SOCIAL_ENGINEERING")

        if risk_score >= 80 and ("VOICE_CLONING" in threat_categories or "BANK_IMPERSONATION" in threat_categories):
            threat_categories.append("CRITICAL_IMPERSONATION")

        if not threat_categories:
            if risk_score > 30:
                threat_categories.append("SUSPICIOUS")
            else:
                threat_categories.append("SAFE")

        # Action Recommendation Synthesis
        if risk_level == "LOW":
            recommended_action = "Conversation appears normal. Continue with standard caution."
            action_code = "PROCEED_NORMAL"
        elif risk_level == "GUARDED":
            recommended_action = "Minor suspicious signals detected. Verify caller identity before sharing non-sensitive info."
            action_code = "VERIFY_IDENTITY"
        elif risk_level == "MODERATE":
            recommended_action = "Exercise heightened caution. Do not share financial or account details without independent verification."
            action_code = "EXERCISE_CAUTION"
        elif risk_level == "HIGH":
            recommended_action = "High threat level! Do NOT share sensitive information, OTP, or passwords. Verify caller through a trusted official channel."
            action_code = "PAUSE_AND_VERIFY"
        else:  # CRITICAL
            recommended_action = "CRITICAL SECURITY THREAT! Do NOT share OTP, PIN, credentials, or transfer money. Terminate the interaction immediately and contact authorities or trusted contacts directly."
            action_code = "TERMINATE_CALL_IMMEDIATELY"

        return {
            "threat_categories": threat_categories,
            "primary_threat": threat_categories[0] if threat_categories else "SAFE",
            "risk_score": risk_score,
            "risk_level": risk_level,
            "recommended_action": recommended_action,
            "action_code": action_code,
            "requires_immediate_action": risk_level in ("HIGH", "CRITICAL")
        }
