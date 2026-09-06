-- ==============================================================================
-- Database Migration: User Authentication & Audit Traceability (User Story)
-- ==============================================================================

-- 1. Create or replace audit trigger function to automatically record timestamps, UUIDs & usernames
CREATE OR REPLACE FUNCTION set_audit_fields()
RETURNS TRIGGER AS $$
DECLARE
    v_email TEXT;
    v_username TEXT;
BEGIN
    -- Query user's email from auth.users (SECURITY DEFINER allows reading auth.users safely)
    IF auth.uid() IS NOT NULL THEN
        SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
        IF v_email IS NOT NULL THEN
            v_username := split_part(v_email, '@', 1);
        ELSE
            v_username := 'Usuario';
        END IF;
    ELSE
        v_username := 'Sistema';
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.created_at := COALESCE(NEW.created_at, NOW());
        NEW.created_by := COALESCE(NEW.created_by, auth.uid());
        NEW.created_by_name := COALESCE(NEW.created_by_name, v_username);
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_at := NOW();
        NEW.updated_by := auth.uid();
        NEW.updated_by_name := v_username;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add audit columns to 'patients' table (timestamps, UUIDs and usernames)
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
ADD COLUMN IF NOT EXISTS created_by_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by_name TEXT;

-- 3. Add audit columns to 'treatments' table
ALTER TABLE treatments 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
ADD COLUMN IF NOT EXISTS created_by_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by_name TEXT;

-- 4. Add audit columns to 'treatment_payments' table
ALTER TABLE treatment_payments 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
ADD COLUMN IF NOT EXISTS created_by_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by_name TEXT;

-- 5. Attach triggers to auto-record audit info on INSERT and UPDATE
DROP TRIGGER IF EXISTS trg_patients_audit_updated ON patients;
DROP TRIGGER IF EXISTS trg_patients_audit ON patients;
CREATE TRIGGER trg_patients_audit
BEFORE INSERT OR UPDATE ON patients
FOR EACH ROW
EXECUTE FUNCTION set_audit_fields();

DROP TRIGGER IF EXISTS trg_treatments_audit_updated ON treatments;
DROP TRIGGER IF EXISTS trg_treatments_audit ON treatments;
CREATE TRIGGER trg_treatments_audit
BEFORE INSERT OR UPDATE ON treatments
FOR EACH ROW
EXECUTE FUNCTION set_audit_fields();

DROP TRIGGER IF EXISTS trg_treatment_payments_audit_updated ON treatment_payments;
DROP TRIGGER IF EXISTS trg_treatment_payments_audit ON treatment_payments;
CREATE TRIGGER trg_treatment_payments_audit
BEFORE INSERT OR UPDATE ON treatment_payments
FOR EACH ROW
EXECUTE FUNCTION set_audit_fields();

-- 6. Backfill existing rows with username if created_by / updated_by exists
UPDATE patients p
SET created_by_name = COALESCE(split_part(u.email, '@', 1), 'Usuario')
FROM auth.users u
WHERE p.created_by = u.id AND p.created_by_name IS NULL;

UPDATE treatments t
SET created_by_name = COALESCE(split_part(u.email, '@', 1), 'Usuario')
FROM auth.users u
WHERE t.created_by = u.id AND t.created_by_name IS NULL;

UPDATE treatment_payments tp
SET created_by_name = COALESCE(split_part(u.email, '@', 1), 'Usuario')
FROM auth.users u
WHERE tp.created_by = u.id AND tp.created_by_name IS NULL;

-- 7. Create indexes on audit columns for performance and fast query lookups
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_updated_at ON patients(updated_at);

CREATE INDEX IF NOT EXISTS idx_treatments_created_by ON treatments(created_by);
CREATE INDEX IF NOT EXISTS idx_treatments_updated_at ON treatments(updated_at);

CREATE INDEX IF NOT EXISTS idx_treatment_payments_created_by ON treatment_payments(created_by);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_updated_at ON treatment_payments(updated_at);

-- 8. Enable Row Level Security (RLS) & establish strict policies for authenticated users
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_payments ENABLE ROW LEVEL SECURITY;

-- Drop obsolete or permissive anon policies if present
DROP POLICY IF EXISTS "Enable all operations for anon on treatment_payments" ON treatment_payments;
DROP POLICY IF EXISTS "Enable all operations for authenticated on patients" ON patients;
DROP POLICY IF EXISTS "Enable all operations for authenticated on treatments" ON treatments;
DROP POLICY IF EXISTS "Enable all operations for authenticated on treatment_payments" ON treatment_payments;

-- Create comprehensive CRUD policies for authenticated users
CREATE POLICY "Enable all operations for authenticated on patients" 
ON patients 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated on treatments" 
ON treatments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated on treatment_payments" 
ON treatment_payments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
