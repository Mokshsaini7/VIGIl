"""
VIGIL — Module 6: Dynamic Risk Engine
Fuses voice authenticity, speaker biometric matching, social engineering intent, 
and context flags into a dynamic 0-100 risk score with explainable contributing factors.
"""

from typing import Dict, Any, List, Optional


class DynamicRiskEngine:
    """
    Explainable multi-signal risk synthesis engine.
    Calculates overall threat severity and lists exact human-readable contributing factors.
    """

    def __init__(
        self,
        weight_synthetic: float = 30.0,
        weight_speaker_mismatch: float = 25.0,
        weight_social_eng: float = 20.0,
        weight_high_risk_intent: float = 15.0,
        weight_urgency_secrecy: float = 10.0
    ):
        self.w_synthetic = weight_synthetic
        self.w_mismatch = weight_speaker_mismatch
        self.w_social = weight_social_eng
        self.w_intent = weight_high_risk_intent
        self.w_urgency = weight_urgency_secrecy

    def evaluate_risk(
        self,
        voice_detection_result: Dict[str, Any],
        speaker_verification_result: Dict[str, Any],
        context_analysis_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates dynamic risk score (0 to 100), level classification, and factor breakdown.
        """
        contributing_factors: List[str] = []
        raw_score = 0.0

        # 1. AI Voice Synthetic Probability Signal (Max 30 pts)
        synth_prob = voice_detection_result.get("synthetic_probability", 0.0)
        synth_pts = synth_prob * self.w_synthetic
        raw_score += synth_pts
        if synth_prob >= 0.70:
            contributing_factors.append(f"{int(synth_prob * 100)}% Synthetic AI Voice Probability")
        elif synth_prob >= 0.40:
            contributing_factors.append(f"Elevated AI Voice Probability ({int(synth_prob * 100)}%)")

        # 2. Speaker Verification & Mismatch Signal (Max 25 pts)
        speaker_status = speaker_verification_result.get("status", "UNKNOWN")
        speaker_similarity = speaker_verification_result.get("similarity", 1.0)
        if speaker_status == "MISMATCH":
            mismatch_pts = (1.0 - speaker_similarity) * self.w_mismatch
            raw_score += mismatch_pts
            contributing_factors.append(f"Speaker Mismatch (Biometric Similarity: {int(speaker_similarity * 100)}%)")
        elif speaker_status == "UNKNOWN":
            raw_score += 8.0
            contributing_factors.append("Unenrolled / Unknown Speaker Identity")

        # 3. Social Engineering Score (Max 20 pts)
        se_score = context_analysis_result.get("social_engineering_score", 0.0)
        se_pts = se_score * self.w_social
        raw_score += se_pts
        if se_score >= 0.60:
            contributing_factors.append(f"High Social Engineering Intent Score ({int(se_score * 100)}%)")

        # 4. Explicit High-Risk Intents (OTP, Money, Credentials, Remote Access) (Max 15 pts)
        intent_pts = 0.0
        if context_analysis_result.get("otp_request"):
            intent_pts += 6.0
            contributing_factors.append("OTP / Security Verification Code Request")
        if context_analysis_result.get("money_request"):
            intent_pts += 5.0
            contributing_factors.append("Financial / UPI / Bank Transfer Request")
        if context_analysis_result.get("credential_request"):
            intent_pts += 5.0
            contributing_factors.append("Sensitive Account Credentials / PIN Harvest Attempt")
        if context_analysis_result.get("remote_access_request"):
            intent_pts += 6.0
            contributing_factors.append("Remote Access Software Installation Request")

        raw_score += min(intent_pts, self.w_intent)

        # 5. Urgency & Secrecy Tactics (Max 10 pts)
        urgency = context_analysis_result.get("urgency_score", 0.0)
        secrecy = context_analysis_result.get("secrecy_score", 0.0)
        urg_pts = (urgency * 0.6 + secrecy * 0.4) * self.w_urgency
        raw_score += urg_pts

        if urgency >= 0.50:
            contributing_factors.append("High Pressure Urgency Tactics Detected")
        if secrecy >= 0.50:
            contributing_factors.append("Secrecy / Isolation Command Detected")

        # 6. Impersonation Context Bonus
        impersonation = context_analysis_result.get("impersonation_context", "NONE")
        if impersonation != "NONE":
            raw_score += 5.0
            contributing_factors.append(f"{impersonation} Identity Impersonation Context")

        # Final Score Normalization (0-100 integer)
        final_score = int(round(min(max(raw_score, 0.0), 100.0)))

        # Severity Threshold Mapping
        if final_score <= 20:
            risk_level = "LOW"
        elif final_score <= 40:
            risk_level = "GUARDED"
        elif final_score <= 60:
            risk_level = "MODERATE"
        elif final_score <= 80:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"

        if not contributing_factors:
            contributing_factors.append("No suspicious indicators detected. Audio profile normal.")

        return {
            "risk_score": final_score,
            "risk_level": risk_level,
            "contributing_factors": contributing_factors,
            "raw_score_breakdown": {
                "synthetic_voice_points": round(synth_pts, 1),
                "speaker_mismatch_points": round(mismatch_pts if speaker_status == "MISMATCH" else 0.0, 1),
                "social_engineering_points": round(se_pts, 1),
                "high_risk_intent_points": round(intent_pts, 1),
                "urgency_secrecy_points": round(urg_pts, 1)
            }
        }
