-- ==============================================================================
-- Database Migration: User Authentication & Audit Traceability (User Story)
-- ==============================================================================

-- 1. Create or replace audit trigger function to automatically record updated_at & updated_by
CREATE OR REPLACE FUNCTION set_audit_updated_fields()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add audit columns to 'patients' table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Add audit columns to 'treatments' table
ALTER TABLE treatments 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Add audit columns to 'treatment_payments' table
ALTER TABLE treatment_payments 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Attach triggers to auto-update updated_at & updated_by on every row update
DROP TRIGGER IF EXISTS trg_patients_audit_updated ON patients;
CREATE TRIGGER trg_patients_audit_updated
BEFORE UPDATE ON patients
FOR EACH ROW
EXECUTE FUNCTION set_audit_updated_fields();

DROP TRIGGER IF EXISTS trg_treatments_audit_updated ON treatments;
CREATE TRIGGER trg_treatments_audit_updated
BEFORE UPDATE ON treatments
FOR EACH ROW
EXECUTE FUNCTION set_audit_updated_fields();

DROP TRIGGER IF EXISTS trg_treatment_payments_audit_updated ON treatment_payments;
CREATE TRIGGER trg_treatment_payments_audit_updated
BEFORE UPDATE ON treatment_payments
FOR EACH ROW
EXECUTE FUNCTION set_audit_updated_fields();

-- 6. Create indexes on audit columns for performance and fast query lookups
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_updated_at ON patients(updated_at);

CREATE INDEX IF NOT EXISTS idx_treatments_created_by ON treatments(created_by);
CREATE INDEX IF NOT EXISTS idx_treatments_updated_at ON treatments(updated_at);

CREATE INDEX IF NOT EXISTS idx_treatment_payments_created_by ON treatment_payments(created_by);
CREATE INDEX IF NOT EXISTS idx_treatment_payments_updated_at ON treatment_payments(updated_at);

-- 7. Enable Row Level Security (RLS) & establish strict policies for authenticated users
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
