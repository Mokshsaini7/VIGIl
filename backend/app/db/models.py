"""VIGIL SQLAlchemy database models."""

import datetime

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # USER / ADMIN / SUPER_ADMIN.
    # Public signup can NEVER choose an administrative role.
    role = Column(String(20), default="USER", nullable=False)

    # PENDING / ACTIVE / REJECTED / SUSPENDED
    account_status = Column(
        String(20),
        default="PENDING",
        nullable=False,
    )

    # Kept for legacy compatibility.
    # account_status is now authoritative.
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
    )

    approved_at = Column(
        DateTime,
        nullable=True,
    )

    last_login = Column(
        DateTime,
        nullable=True,
    )


class SpeakerProfile(Base):
    __tablename__ = "speaker_profiles"

    id = Column(Integer, primary_key=True, index=True)

    speaker_id = Column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    name = Column(
        String(100),
        nullable=False,
    )

    sample_count = Column(
        Integer,
        default=1,
    )

    embedding_json = Column(
        Text,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
    )


class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"

    id = Column(Integer, primary_key=True, index=True)

    session_code = Column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    filename = Column(
        String(255),
        nullable=True,
    )

    speaker_id = Column(
        String(50),
        nullable=True,
    )

    duration = Column(
        Float,
        default=0.0,
    )

    real_probability = Column(
        Float,
        default=0.5,
    )

    synthetic_probability = Column(
        Float,
        default=0.5,
    )

    voice_classification = Column(
        String(20),
        default="UNCERTAIN",
    )

    speaker_status = Column(
        String(20),
        default="UNKNOWN",
    )

    speaker_similarity = Column(
        Float,
        default=0.5,
    )

    risk_score = Column(
        Integer,
        default=0,
    )

    risk_level = Column(
        String(20),
        default="LOW",
    )

    primary_threat = Column(
        String(50),
        default="SAFE",
    )

    transcript = Column(
        Text,
        default="",
    )

    signals_json = Column(
        Text,
        default="[]",
    )

    contributing_factors_json = Column(
        Text,
        default="[]",
    )

    recommended_action = Column(
        Text,
        default="",
    )

    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
    )


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)

    session_code = Column(
        String(50),
        index=True,
        nullable=False,
    )

    severity = Column(
        String(20),
        nullable=False,
    )

    title = Column(
        String(150),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=False,
    )

    risk_score = Column(
        Integer,
        default=0,
    )

    status = Column(
        String(20),
        default="NEW",
    )

    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String(50),
        index=True,
        nullable=False,
    )

    action = Column(
        String(100),
        nullable=False,
    )

    resource = Column(
        String(100),
        nullable=False,
    )

    result = Column(
        String(20),
        default="SUCCESS",
    )

    metadata_json = Column(
        Text,
        default="{}",
    )

    timestamp = Column(
        DateTime,
        default=datetime.datetime.utcnow,
    )
