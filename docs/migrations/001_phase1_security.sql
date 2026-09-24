-- ============================================================
-- VIGIL PHASE 1 SECURITY MIGRATION
-- PostgreSQL / Supabase
-- ============================================================

-- Add account status.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS
account_status VARCHAR(20)
NOT NULL
DEFAULT 'PENDING';


-- Add approval timestamp.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS
approved_at TIMESTAMPTZ NULL;


-- Add last login timestamp.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS
last_login TIMESTAMPTZ NULL;


-- ============================================================
-- LEGACY ROLE MIGRATION
-- ============================================================

-- Old VIGIL roles become normal USER accounts.

UPDATE users
SET role = 'USER'
WHERE role IS NULL
OR role IN (
    'ANALYST',
    'OPERATOR',
    'VIEWER'
);


-- ============================================================
-- PRESERVE EXISTING ACTIVE USERS
-- ============================================================

UPDATE users
SET account_status = 'ACTIVE'
WHERE account_status = 'PENDING'
AND is_active = TRUE;


-- ============================================================
-- ROLE CONSTRAINT
-- ============================================================

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;


ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (
    role IN (
        'USER',
        'ADMIN',
        'SUPER_ADMIN'
    )
);


-- ============================================================
-- ACCOUNT STATUS CONSTRAINT
-- ============================================================

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_account_status_check;


ALTER TABLE users
ADD CONSTRAINT users_account_status_check
CHECK (
    account_status IN (
        'PENDING',
        'ACTIVE',
        'REJECTED',
        'SUSPENDED'
    )
);
