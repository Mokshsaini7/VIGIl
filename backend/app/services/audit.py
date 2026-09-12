"""
VIGIL — Audit Logging Service
Records system actions, security events, model executions, and user operations.
"""

import json
import datetime
from sqlalchemy.orm import Session
from app.db.models import AuditLog


def record_audit(
    db: Session,
    username: str,
    action: str,
    resource: str,
    result: str = "SUCCESS",
    metadata: dict = None
):
    """Inserts a structured audit trail event into the audit_logs table."""
    try:
        log_entry = AuditLog(
            username=username,
            action=action,
            resource=resource,
            result=result,
            metadata_json=json.dumps(metadata or {}),
            timestamp=datetime.datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[AUDIT LOG ERROR] Failed to record audit log: {e}")
