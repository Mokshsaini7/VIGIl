"""
VIGIL — Module 6: Dynamic Risk Engine

Combines:
- synthetic voice probability
- speaker mismatch
- social engineering
- sensitive requests
- urgency/secrecy
- impersonation context

into an explainable 0-100 score.
"""

from typing import Dict, Any, List


class DynamicRiskEngine:

    def __init__(
        self,
        weight_synthetic: float = 30.0,
        weight_speaker_mismatch: float = 25.0,
        weight_social_eng: float = 20.0,
        weight_high_risk_intent: float = 15.0,
        weight_urgency_secrecy: float = 10.0,
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
        context_analysis_result: Dict[str, Any],
    ) -> Dict[str, Any]:

        factors: List[str] = []

        raw_score = 0.0

        # --------------------------------------------------
        # 1. SYNTHETIC VOICE
        # --------------------------------------------------

        synth_prob = float(
            voice_detection_result.get(
                "synthetic_probability",
                0.0
            )
        )

        synth_points = (
            synth_prob * self.w_synthetic
        )

        raw_score += synth_points

        if synth_prob >= 0.70:

            factors.append(
                f"{int(synth_prob * 100)}% "
                "Synthetic AI Voice Probability"
            )

        elif synth_prob >= 0.40:

            factors.append(
                f"Elevated AI Voice Probability "
                f"({int(synth_prob * 100)}%)"
            )

        # --------------------------------------------------
        # 2. SPEAKER VERIFICATION
        # --------------------------------------------------

        speaker_status = speaker_verification_result.get(
            "status",
            "NOT_ENROLLED"
        )

        similarity = speaker_verification_result.get(
            "similarity"
        )

        mismatch_points = 0.0

        if (
            speaker_status == "MISMATCH"
            and similarity is not None
        ):

            mismatch_points = (
                max(
                    0.0,
                    1.0 - float(similarity)
                )
                * self.w_mismatch
            )

            raw_score += mismatch_points

            factors.append(
                "Speaker mismatch detected "
                f"(similarity {int(float(similarity) * 100)}%)"
            )

        elif speaker_status == "NOT_ENROLLED":

            # Missing evidence is NOT malicious evidence.
            pass

        # --------------------------------------------------
        # 3. SOCIAL ENGINEERING
        # --------------------------------------------------

        social_score = float(
            context_analysis_result.get(
                "social_engineering_score",
                0.0
            )
        )

        social_points = (
            social_score * self.w_social
        )

        raw_score += social_points

        if social_score >= 0.60:

            factors.append(
                "High social-engineering intent detected"
            )

        # --------------------------------------------------
        # 4. HIGH-RISK INTENTS
        # --------------------------------------------------

        intent_points = 0.0

        if context_analysis_result.get(
            "otp_request"
        ):

            intent_points += 6.0

            factors.append(
                "OTP / verification-code request"
            )

        if context_analysis_result.get(
            "money_request"
        ):

            intent_points += 5.0

            factors.append(
                "Financial / UPI / transfer request"
            )

        if context_analysis_result.get(
            "credential_request"
        ):

            intent_points += 5.0

            factors.append(
                "Sensitive credentials / PIN request"
            )

        if context_analysis_result.get(
            "remote_access_request"
        ):

            intent_points += 6.0

            factors.append(
                "Remote-access / screen-sharing request"
            )

        intent_points = min(
            intent_points,
            self.w_intent
        )

        raw_score += intent_points

        # --------------------------------------------------
        # 5. URGENCY + SECRECY
        # --------------------------------------------------

        urgency = float(
            context_analysis_result.get(
                "urgency_score",
                0.0
            )
        )

        secrecy = float(
            context_analysis_result.get(
                "secrecy_score",
                0.0
            )
        )

        urgency_points = (
            urgency * 0.6
            + secrecy * 0.4
        ) * self.w_urgency

        raw_score += urgency_points

        if urgency >= 0.50:

            factors.append(
                "High-pressure urgency detected"
            )

        if secrecy >= 0.50:

            factors.append(
                "Secrecy / isolation tactic detected"
            )

        # --------------------------------------------------
        # 6. IMPERSONATION
        # --------------------------------------------------

        impersonation = context_analysis_result.get(
            "impersonation_context",
            "NONE"
        )

        impersonation_points = 0.0

        if impersonation != "NONE":

            impersonation_points = 5.0
            raw_score += impersonation_points

            factors.append(
                f"{impersonation} impersonation context"
            )

        # --------------------------------------------------
        # FINAL SCORE
        # --------------------------------------------------

        final_score = int(
            round(
                min(
                    max(raw_score, 0.0),
                    100.0
                )
            )
        )

        # --------------------------------------------------
        # RISK LEVEL
        # --------------------------------------------------

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

        if not factors:

            factors.append(
                "No suspicious conversation or "
                "voice indicators detected."
            )

        return {
            "risk_score": final_score,
            "risk_level": risk_level,
            "contributing_factors": factors,
            "raw_score_breakdown": {
                "synthetic_voice_points": round(
                    synth_points,
                    1
                ),
                "speaker_mismatch_points": round(
                    mismatch_points,
                    1
                ),
                "social_engineering_points": round(
                    social_points,
                    1
                ),
                "high_risk_intent_points": round(
                    intent_points,
                    1
                ),
                "urgency_secrecy_points": round(
                    urgency_points,
                    1
                ),
                "impersonation_points": round(
                    impersonation_points,
                    1
                ),
            },
        }
