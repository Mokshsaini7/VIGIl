"""
VIGIL — FastAPI REST Endpoints Layer

Implements:
- Authentication
- Account approval state
- Audio inspection
- Speaker verification
- Risk scoring
- Alerts
- Audit logs
- SIH interactive demo scenarios
"""

import json
import uuid
import datetime

from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
)

from fastapi.security import OAuth2PasswordRequestForm

from pydantic import BaseModel, EmailStr

from sqlalchemy.orm import Session

from app.db.database import get_db

from app.db.models import (
    User,
    SpeakerProfile,
    AnalysisSession,
    Alert,
    AuditLog,
)

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    require_active_user,
    require_admin,
    require_super_admin,
    validate_password,
)

from app.services.audit import record_audit

from ai.pipeline import VigilAIPipeline


router = APIRouter()

pipeline = VigilAIPipeline()


# ============================================================
# PYDANTIC SCHEMAS
# ============================================================


class UserRegisterSchema(BaseModel):
    username: str
    email: EmailStr
    password: str


class TokenResponseSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str
    account_status: str


class RegistrationResponseSchema(BaseModel):
    message: str
    username: str
    account_status: str


class StatusResponseSchema(BaseModel):
    username: str
    account_status: str
    role: str


class SpeakerRegisterSchema(BaseModel):
    speaker_id: str
    name: str


class SpeakerVerifySchema(BaseModel):
    speaker_id: str


class TextAnalysisSchema(BaseModel):
    text: str


# ============================================================
# AUTHENTICATION
# ============================================================


@router.post(
    "/auth/register",
    response_model=RegistrationResponseSchema,
)
def register(
    user_in: UserRegisterSchema,
    db: Session = Depends(get_db),
):
    """
    Public account registration.

    IMPORTANT:
    Public users cannot select:
    - ADMIN
    - SUPER_ADMIN

    Every public registration becomes:
        role = USER
        account_status = PENDING
    """

    validate_password(
        user_in.password
    )

    username = user_in.username.strip()

    if len(username) < 3 or len(username) > 50:
        raise HTTPException(
            status_code=422,
            detail=(
                "Username must be between "
                "3 and 50 characters"
            ),
        )

    existing = (
        db.query(User)
        .filter(
            (User.username == username)
            | (User.email == user_in.email)
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail=(
                "Username or email is already registered"
            ),
        )

    user = User(
        username=username,
        email=str(
            user_in.email
        ).lower(),
        hashed_password=get_password_hash(
            user_in.password
        ),
        role="USER",
        account_status="PENDING",
        is_active=True,
    )

    db.add(user)

    db.commit()

    db.refresh(user)

    record_audit(
        db,
        user.username,
        "USER_REGISTER",
        "USER_DATABASE",
        "SUCCESS",
        {
            "status": "PENDING",
        },
    )

    return {
        "message": (
            "Account created. "
            "Administrator approval is "
            "required before login."
        ),
        "username": user.username,
        "account_status": user.account_status,
    }


@router.post(
    "/auth/login",
    response_model=TokenResponseSchema,
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):

    user = (
        db.query(User)
        .filter(
            User.username
            == form_data.username
        )
        .first()
    )

    if not user or not verify_password(
        form_data.password,
        user.hashed_password,
    ):

        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # --------------------------------------------------------
    # PENDING
    # --------------------------------------------------------

    if user.account_status == "PENDING":

        record_audit(
            db,
            user.username,
            "LOGIN_BLOCKED",
            "AUTH_SERVICE",
            "DENIED",
            {
                "reason": "PENDING_APPROVAL"
            },
        )

        raise HTTPException(
            status_code=403,
            detail="ACCOUNT_PENDING_APPROVAL",
        )

    # --------------------------------------------------------
    # REJECTED
    # --------------------------------------------------------

    if user.account_status == "REJECTED":

        record_audit(
            db,
            user.username,
            "LOGIN_BLOCKED",
            "AUTH_SERVICE",
            "DENIED",
            {
                "reason": "REJECTED"
            },
        )

        raise HTTPException(
            status_code=403,
            detail="ACCOUNT_REJECTED",
        )

    # --------------------------------------------------------
    # SUSPENDED
    # --------------------------------------------------------

    if user.account_status == "SUSPENDED":

        record_audit(
            db,
            user.username,
            "LOGIN_BLOCKED",
            "AUTH_SERVICE",
            "DENIED",
            {
                "reason": "SUSPENDED"
            },
        )

        raise HTTPException(
            status_code=403,
            detail="ACCOUNT_SUSPENDED",
        )

    if user.account_status != "ACTIVE":

        raise HTTPException(
            status_code=403,
            detail="ACCOUNT_NOT_ACTIVE",
        )

    user.last_login = (
        datetime.datetime.utcnow()
    )

    db.commit()

    token = create_access_token(
        user
    )

    record_audit(
        db,
        user.username,
        "USER_LOGIN",
        "AUTH_SERVICE",
        "SUCCESS",
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role,
        "account_status": user.account_status,
    }


@router.get(
    "/auth/me",
    response_model=StatusResponseSchema,
)
def get_me(
    current_user: User = Depends(
        get_current_user
    ),
):

    return {
        "username": current_user.username,
        "account_status": (
            current_user.account_status
        ),
        "role": current_user.role,
    }


# ============================================================
# SYSTEM HEALTH
# ============================================================


@router.get("/health")
def health_check():

    return {
        "status": "OPERATIONAL",
        "system": (
            "VIGIL Voice Integrity Guard"
        ),
        "version": "1.0.0",
        "timestamp": (
            datetime.datetime.utcnow()
            .isoformat()
        ),
    }


@router.get("/model/status")
def model_status():

    return {
        "audio_processor": "LOADED",
        "voice_detector": (
            "ACTIVE "
            "(Spectral + Anti-spoof Ensemble)"
        ),
        "speaker_verifier": (
            "ACTIVE "
            "(128-dim d-vector matcher)"
        ),
        "speech_to_text": (
            "ACTIVE "
            "(Faster-Whisper Multilingual)"
        ),
        "context_analyzer": (
            "ACTIVE "
            "(NLP + Rule-based Social Engineering)"
        ),
        "risk_engine": (
            "ACTIVE "
            "(Dynamic Explainable 0-100 Fusion)"
        ),
        "threat_classifier": (
            "ACTIVE "
            "(Multi-label Threat Advisory)"
        ),
    }


# ============================================================
# AUDIO ANALYSIS
# ============================================================


@router.post("/audio/analyze")
async def analyze_audio(
    file: UploadFile = File(...),
    speaker_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_active_user
    ),
):

    """
    Executes the complete VIGIL AI pipeline
    on an uploaded audio file.
    """

    audio_bytes = await file.read()

    session_code = (
        f"VGL-{uuid.uuid4().hex[:8].upper()}"
    )

    analysis_result = (
        pipeline.process_audio_file(
            audio_bytes,
            file.filename,
            speaker_id,
        )
    )

    meta = analysis_result[
        "metadata"
    ]

    va = analysis_result[
        "voice_authenticity"
    ]

    sv = analysis_result[
        "speaker_verification"
    ]

    stt = analysis_result[
        "transcription"
    ]

    ra = analysis_result[
        "risk_assessment"
    ]

    tc = analysis_result[
        "threat_classification"
    ]

    session_rec = AnalysisSession(
        session_code=session_code,
        filename=file.filename,
        speaker_id=speaker_id,

        duration=meta.get(
            "duration",
            0.0,
        ),

        real_probability=va.get(
            "real_probability",
            0.5,
        ),

        synthetic_probability=va.get(
            "synthetic_probability",
            0.5,
        ),

        voice_classification=va.get(
            "classification",
            "UNCERTAIN",
        ),

        speaker_status=sv.get(
            "status",
            "UNKNOWN",
        ),

        speaker_similarity=sv.get(
            "similarity",
            0.5,
        ),

        risk_score=ra.get(
            "risk_score",
            0,
        ),

        risk_level=ra.get(
            "risk_level",
            "LOW",
        ),

        primary_threat=tc.get(
            "primary_threat",
            "SAFE",
        ),

        transcript=stt.get(
            "transcript",
            "",
        ),

        signals_json=json.dumps(
            analysis_result[
                "context_analysis"
            ].get(
                "detected_signals",
                [],
            )
        ),

        contributing_factors_json=json.dumps(
            ra.get(
                "contributing_factors",
                [],
            )
        ),

        recommended_action=tc.get(
            "recommended_action",
            "",
        ),
    )

    db.add(
        session_rec
    )

    # Create an alert for high-risk analysis.
    if ra.get(
        "risk_level"
    ) in (
        "HIGH",
        "CRITICAL",
    ):

        alert_rec = Alert(
            session_code=session_code,

            severity=ra.get(
                "risk_level"
            ),

            title=(
                f"{tc.get('primary_threat')} "
                f"Detected in {session_code}"
            ),

            description=(
                f"Risk Score: "
                f"{ra.get('risk_score')}/100. "
                f"Factors: "
                f"{', '.join(ra.get('contributing_factors', []))[:200]}"
            ),

            risk_score=ra.get(
                "risk_score"
            ),

            status="NEW",
        )

        db.add(
            alert_rec
        )

    db.commit()

    record_audit(
        db,
        current_user.username,
        "AUDIO_ANALYSIS",
        session_code,
        "SUCCESS",
    )

    return {
        "session_code": session_code,
        "filename": file.filename,
        "results": analysis_result,
    }


# ============================================================
# SPEAKER PROFILES
# ============================================================


@router.post("/speaker/register")
async def register_speaker(
    speaker_id: str = Form(...),
    name: str = Form(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_active_user
    ),
):

    pcm_samples_list = []

    for file in files:

        audio_bytes = (
            await file.read()
        )

        samples, sr, meta = (
            pipeline.audio_processor
            .extract_raw_pcm(
                audio_bytes
            )
        )

        pcm_samples_list.append(
            samples
        )

    if not pcm_samples_list:

        raise HTTPException(
            status_code=400,
            detail=(
                "At least one valid audio "
                "file required for enrollment"
            ),
        )

    enrollment = (
        pipeline.speaker_verifier
        .register_speaker(
            speaker_id,
            name,
            pcm_samples_list,
        )
    )

    existing = (
        db.query(SpeakerProfile)
        .filter(
            SpeakerProfile.speaker_id
            == speaker_id
        )
        .first()
    )

    embedding = json.dumps(
        pipeline.speaker_verifier
        .speaker_profiles[
            speaker_id
        ]["embedding"]
    )

    if existing:

        existing.name = name

        existing.sample_count = (
            len(pcm_samples_list)
        )

        existing.embedding_json = (
            embedding
        )

    else:

        profile_rec = SpeakerProfile(
            speaker_id=speaker_id,
            name=name,
            sample_count=len(
                pcm_samples_list
            ),
            embedding_json=embedding,
        )

        db.add(
            profile_rec
        )

    db.commit()

    record_audit(
        db,
        current_user.username,
        "SPEAKER_ENROLL",
        speaker_id,
        "SUCCESS",
    )

    return enrollment


@router.get("/speaker/profiles")
def list_speaker_profiles(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_active_user
    ),
):

    profiles = (
        db.query(
            SpeakerProfile
        )
        .all()
    )

    return [
        {
            "id": p.id,
            "speaker_id": p.speaker_id,
            "name": p.name,
            "sample_count": p.sample_count,
            "created_at": (
                p.created_at.isoformat()
            ),
        }
        for p in profiles
    ]


# ============================================================
# CONTEXT ANALYSIS
# ============================================================


@router.post("/context/analyze")
def analyze_context_text(
    payload: TextAnalysisSchema,
):

    return (
        pipeline.context_analyzer
        .analyze_transcript(
            payload.text
        )
    )


# ============================================================
# SESSIONS
# ============================================================


@router.get("/sessions")
def get_sessions(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_active_user
    ),
):

    sessions = (
        db.query(
            AnalysisSession
        )
        .order_by(
            AnalysisSession.created_at.desc()
        )
        .limit(limit)
        .all()
    )

    return [
        {
            "id": s.id,
            "session_code": s.session_code,
            "filename": s.filename,
            "speaker_id": s.speaker_id,
            "duration": s.duration,
            "real_probability": (
                s.real_probability
            ),
            "synthetic_probability": (
                s.synthetic_probability
            ),
            "voice_classification": (
                s.voice_classification
            ),
            "speaker_status": (
                s.speaker_status
            ),
            "risk_score": s.risk_score,
            "risk_level": s.risk_level,
            "primary_threat": (
                s.primary_threat
            ),
            "transcript": s.transcript,
            "created_at": (
                s.created_at.isoformat()
            ),
        }
        for s in sessions
    ]


@router.get(
    "/sessions/{session_code}"
)
def get_session_detail(
    session_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_active_user
    ),
):

    session_record = (
        db.query(
            AnalysisSession
        )
        .filter(
            AnalysisSession.session_code
            == session_code
        )
        .first()
    )

    if not session_record:

        raise HTTPException(
            status_code=404,
            detail="Session not found",
        )

    return {
        "session_code": (
            session_record.session_code
        ),
        "filename": (
            session_record.filename
        ),
        "speaker_id": (
            session_record.speaker_id
        ),
        "duration": (
            session_record.duration
        ),
        "real_probability": (
            session_record.real_probability
        ),
        "synthetic_probability": (
            session_record.synthetic_probability
        ),
        "voice_classification": (
            session_record.voice_classification
        ),
        "speaker_status": (
            session_record.speaker_status
        ),
        "speaker_similarity": (
            session_record.speaker_similarity
        ),
        "risk_score": (
            session_record.risk_score
        ),
        "risk_level": (
            session_record.risk_level
        ),
        "primary_threat": (
            session_record.primary_threat
        ),
        "transcript": (
            session_record.transcript
        ),
        "detected_signals": json.loads(
            session_record.signals_json
            or "[]"
        ),
        "contributing_factors": json.loads(
            session_record.contributing_factors_json
            or "[]"
        ),
        "recommended_action": (
            session_record.recommended_action
        ),
        "created_at": (
            session_record.created_at
            .isoformat()
        ),
    }


# ============================================================
# ALERTS
# ============================================================


@router.get("/alerts")
def get_alerts(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_active_user
    ),
):

    query = db.query(Alert)

    if status_filter:
        query = query.filter(
            Alert.status
            == status_filter
        )

    alerts = (
        query
        .order_by(
            Alert.created_at.desc()
        )
        .all()
    )

    return [
        {
            "id": a.id,
            "session_code": (
                a.session_code
            ),
            "severity": a.severity,
            "title": a.title,
            "description": (
                a.description
            ),
            "risk_score": (
                a.risk_score
            ),
            "status": a.status,
            "created_at": (
                a.created_at.isoformat()
            ),
        }
        for a in alerts
    ]


@router.post(
    "/alerts/{alert_id}/acknowledge"
)
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_active_user
    ),
):

    alert = (
        db.query(Alert)
        .filter(
            Alert.id == alert_id
        )
        .first()
    )

    if not alert:

        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    alert.status = "ACKNOWLEDGED"

    db.commit()

    return {
        "id": alert.id,
        "status": "ACKNOWLEDGED",
    }


# ============================================================
# AUDIT LOGS
# ============================================================


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_admin
    ),
):

    logs = (
        db.query(AuditLog)
        .order_by(
            AuditLog.timestamp.desc()
        )
        .limit(limit)
        .all()
    )

    return [
        {
            "id": log.id,
            "username": log.username,
            "action": log.action,
            "resource": log.resource,
            "result": log.result,
            "metadata": json.loads(
                log.metadata_json
                or "{}"
            ),
            "timestamp": (
                log.timestamp.isoformat()
            ),
        }
        for log in logs
    ]


# ============================================================
# SIH DEMO SCENARIOS
# ============================================================


SIH_DEMO_SCENARIOS = {

    "demo_1_genuine": {
        "id": "demo_1_genuine",
        "name": (
            "Scenario 1: "
            "Genuine Customer Support Call"
        ),
        "description": (
            "Legitimate human call with "
            "trusted speaker match and "
            "normal account query."
        ),
        "speaker": (
            "Trusted Speaker (Anand Verma)"
        ),
        "synthetic_probability": 0.08,
        "speaker_similarity": 0.94,
        "speaker_status": "MATCH",
        "transcript": (
            "Hello, I am calling to inquire "
            "about my credit card rewards "
            "balance update for this month."
        ),
        "risk_score": 12,
        "risk_level": "LOW",
        "threat": "SAFE",
        "action": (
            "Conversation appears normal. "
            "Continue with standard caution."
        ),
    },

    "demo_2_ai_voice": {
        "id": "demo_2_ai_voice",
        "name": (
            "Scenario 2: "
            "AI-Generated Voice Clone Attempt"
        ),
        "description": (
            "Synthetic neural vocoder audio "
            "clone detected with high "
            "acoustic artifact probability."
        ),
        "speaker": "Unverified Executive",
        "synthetic_probability": 0.94,
        "speaker_similarity": 0.38,
        "speaker_status": "MISMATCH",
        "transcript": (
            "Greetings, this is the Chief "
            "Security Officer calling to "
            "verify your administrative "
            "system access."
        ),
        "risk_score": 78,
        "risk_level": "HIGH",
        "threat": "VOICE_CLONING",
        "action": (
            "High threat level! Do NOT share "
            "sensitive info. Verify caller "
            "through trusted official channel."
        ),
    },

    "demo_3_bank_scam": {
        "id": "demo_3_bank_scam",
        "name": (
            "Scenario 3: "
            "Bank Impersonation & OTP Harvest"
        ),
        "description": (
            "Fake bank manager claiming "
            "account suspension, demanding "
            "immediate OTP verification."
        ),
        "speaker": (
            "Impersonator "
            "(Claiming SBI Fraud Dept)"
        ),
        "synthetic_probability": 0.88,
        "speaker_similarity": 0.22,
        "speaker_status": "MISMATCH",
        "transcript": (
            "Sir your bank account has been "
            "blocked today immediately! "
            "Read out the 6-digit OTP code "
            "sent to your phone right now "
            "to stop legal action."
        ),
        "risk_score": 94,
        "risk_level": "CRITICAL",
        "threat": "BANK_IMPERSONATION",
        "action": (
            "CRITICAL THREAT! Do NOT share "
            "OTP or credentials. Terminate "
            "the interaction immediately!"
        ),
    },

    "demo_4_family_emergency": {
        "id": "demo_4_family_emergency",
        "name": (
            "Scenario 4: "
            "Family Emergency Impersonation Scam"
        ),
        "description": (
            "AI voice clone of family member "
            "claiming urgent hospital emergency "
            "and money transfer requirement."
        ),
        "speaker": (
            "Impersonated Relative (Son)"
        ),
        "synthetic_probability": 0.91,
        "speaker_similarity": 0.29,
        "speaker_status": "MISMATCH",
        "transcript": (
            "Dad! Please help me immediately, "
            "I had an accident and need "
            "50,000 rupees transferred right "
            "now! Don't tell mom!"
        ),
        "risk_score": 96,
        "risk_level": "CRITICAL",
        "threat": "FAMILY_IMPERSONATION",
        "action": (
            "CRITICAL THREAT! Verify the "
            "relative directly via their "
            "known telephone number before "
            "transferring money."
        ),
    },

    "demo_5_financial_fraud": {
        "id": "demo_5_financial_fraud",
        "name": (
            "Scenario 5: "
            "Remote Access & Financial Fraud Scam"
        ),
        "description": (
            "Scammer instructing victim to "
            "download AnyDesk and share UPI "
            "PIN for refund authorization."
        ),
        "speaker": "Fake Tech Support",
        "synthetic_probability": 0.76,
        "speaker_similarity": 0.15,
        "speaker_status": "MISMATCH",
        "transcript": (
            "Download AnyDesk app on your "
            "phone immediately and open your "
            "UPI app to receive your refund "
            "of 25,000 rupees. Enter your "
            "UPI PIN now."
        ),
        "risk_score": 98,
        "risk_level": "CRITICAL",
        "threat": "FINANCIAL_FRAUD",
        "action": (
            "CRITICAL THREAT! Never install "
            "screen-share apps or enter UPI "
            "PIN to receive money!"
        ),
    },
}


@router.get(
    "/demo/scenarios"
)
def get_demo_scenarios():

    return list(
        SIH_DEMO_SCENARIOS.values()
    )


@router.post(
    "/demo/simulate/{scenario_id}"
)
def simulate_demo_scenario(
    scenario_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_active_user
    ),
):

    if scenario_id not in SIH_DEMO_SCENARIOS:

        raise HTTPException(
            status_code=404,
            detail="Demo scenario not found",
        )

    demo_data = (
        SIH_DEMO_SCENARIOS[
            scenario_id
        ]
    )

    session_code = (
        "VGL-DEMO-"
        f"{uuid.uuid4().hex[:6].upper()}"
    )

    session_rec = AnalysisSession(
        session_code=session_code,

        filename=(
            f"{scenario_id}.wav"
        ),

        speaker_id=(
            demo_data["speaker"]
        ),

        duration=15.0,

        real_probability=round(
            1.0
            - demo_data[
                "synthetic_probability"
            ],
            2,
        ),

        synthetic_probability=(
            demo_data[
                "synthetic_probability"
            ]
        ),

        voice_classification=(
            "SYNTHETIC"
            if demo_data[
                "synthetic_probability"
            ] > 0.6
            else "REAL"
        ),

        speaker_status=(
            demo_data[
                "speaker_status"
            ]
        ),

        speaker_similarity=(
            demo_data[
                "speaker_similarity"
            ]
        ),

        risk_score=(
            demo_data["risk_score"]
        ),

        risk_level=(
            demo_data["risk_level"]
        ),

        primary_threat=(
            demo_data["threat"]
        ),

        transcript=(
            demo_data["transcript"]
        ),

        signals_json=json.dumps(
            ["DEMO_SIGNAL"]
        ),

        contributing_factors_json=(
            json.dumps(
                [
                    (
                        f"{int(demo_data['synthetic_probability'] * 100)}%"
                        " Synthetic Voice"
                    ),
                    demo_data[
                        "threat"
                    ],
                ]
            )
        ),

        recommended_action=(
            demo_data["action"]
        ),
    )

    db.add(
        session_rec
    )

    if demo_data[
        "risk_level"
    ] in (
        "HIGH",
        "CRITICAL",
    ):

        db.add(
            Alert(
                session_code=session_code,
                severity=(
                    demo_data[
                        "risk_level"
                    ]
                ),
                title=(
                    "SIH Demo: "
                    f"{demo_data['name']}"
                ),
                description=(
                    demo_data[
                        "transcript"
                    ]
                ),
                risk_score=(
                    demo_data[
                        "risk_score"
                    ]
                ),
                status="NEW",
            )
        )

    db.commit()

    return {
        "session_code": session_code,
        "scenario": demo_data,
    }
