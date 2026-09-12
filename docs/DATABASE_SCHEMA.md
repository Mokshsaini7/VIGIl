# VIGIL Database Schema & Entity Documentation

## Database Engine Support
- **Development / Standalone:** SQLite 3 (`vigil.db`)
- **Production / Enterprise:** PostgreSQL 15+ with PostGIS geospatial extension

---

## Entity Relationship Diagram & Table Schema

### 1. `users`
Stores authenticated user accounts and security roles.
- `id` (INTEGER, Primary Key, Auto-increment)
- `username` (VARCHAR(50), Unique, Indexed, Not Null)
- `email` (VARCHAR(100), Unique, Indexed, Not Null)
- `hashed_password` (VARCHAR(255), Not Null)
- `role` (VARCHAR(20), Default: 'ANALYST') — Roles: `ADMIN`, `ANALYST`, `OPERATOR`, `VIEWER`
- `is_active` (BOOLEAN, Default: True)
- `created_at` (TIMESTAMP, Default: UTC Now)

### 2. `speaker_profiles`
Stores enrolled trusted voice reference embeddings (d-vectors).
- `id` (INTEGER, Primary Key)
- `speaker_id` (VARCHAR(50), Unique, Indexed, Not Null)
- `name` (VARCHAR(100), Not Null)
- `sample_count` (INTEGER, Default: 1)
- `embedding_json` (TEXT, Not Null) — JSON array of 128 float values
- `created_at` (TIMESTAMP, Default: UTC Now)

### 3. `analysis_sessions`
Stores historical session analysis logs and forensic reports.
- `id` (INTEGER, Primary Key)
- `session_code` (VARCHAR(50), Unique, Indexed, Not Null)
- `filename` (VARCHAR(255))
- `speaker_id` (VARCHAR(50))
- `duration` (FLOAT)
- `real_probability` (FLOAT)
- `synthetic_probability` (FLOAT)
- `voice_classification` (VARCHAR(20))
- `speaker_status` (VARCHAR(20))
- `speaker_similarity` (FLOAT)
- `risk_score` (INTEGER)
- `risk_level` (VARCHAR(20))
- `primary_threat` (VARCHAR(50))
- `transcript` (TEXT)
- `signals_json` (TEXT)
- `contributing_factors_json` (TEXT)
- `recommended_action` (TEXT)
- `created_at` (TIMESTAMP)

### 4. `alerts`
Security incident alert records.
- `id` (INTEGER, Primary Key)
- `session_code` (VARCHAR(50), Indexed, Not Null)
- `severity` (VARCHAR(20), Not Null) — `CRITICAL`, `HIGH`, `MODERATE`, `LOW`
- `title` (VARCHAR(150), Not Null)
- `description` (TEXT, Not Null)
- `risk_score` (INTEGER)
- `status` (VARCHAR(20), Default: 'NEW') — `NEW`, `ACKNOWLEDGED`, `RESOLVED`
- `created_at` (TIMESTAMP)

### 5. `audit_logs`
Immutable audit log records for administrative and security actions.
- `id` (INTEGER, Primary Key)
- `username` (VARCHAR(50), Indexed, Not Null)
- `action` (VARCHAR(100), Not Null)
- `resource` (VARCHAR(100), Not Null)
- `result` (VARCHAR(20), Default: 'SUCCESS')
- `metadata_json` (TEXT)
- `timestamp` (TIMESTAMP)
