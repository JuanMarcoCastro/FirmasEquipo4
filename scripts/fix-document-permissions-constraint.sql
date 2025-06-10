-- Fix document permissions table to allow multiple permission types per user per document

-- First, let's see the current structure and constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'document_permissions'::regclass;

-- Drop the problematic unique constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'document_permisiones_document_id_user_id_key' 
        AND conrelid = 'document_permissions'::regclass
    ) THEN
        ALTER TABLE document_permissions 
        DROP CONSTRAINT document_permisiones_document_id_user_id_key;
        
        RAISE NOTICE 'Dropped constraint: document_permisiones_document_id_user_id_key';
    END IF;
END $$;

-- Create a new unique constraint that includes permission_type
-- This allows multiple permission types per user per document
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'document_permissions_unique_user_document_type' 
        AND conrelid = 'document_permissions'::regclass
    ) THEN
        ALTER TABLE document_permissions 
        ADD CONSTRAINT document_permissions_unique_user_document_type 
        UNIQUE (document_id, user_id, permission_type);
        
        RAISE NOTICE 'Created new constraint: document_permissions_unique_user_document_type';
    END IF;
END $$;

-- Verify the new constraint structure
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'document_permissions'::regclass
AND contype = 'u'; -- unique constraints only

-- Show current permissions to verify data integrity
SELECT 
    dp.document_id,
    u.full_name,
    u.email,
    dp.permission_type,
    dp.created_at
FROM document_permissions dp
JOIN users u ON dp.user_id = u.id
ORDER BY dp.document_id, u.full_name, dp.permission_type;
