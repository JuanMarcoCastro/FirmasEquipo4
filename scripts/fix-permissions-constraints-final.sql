-- Comprehensive fix for document permissions constraints

-- First, let's see ALL constraints on the document_permissions table
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE 'Current constraints on document_permissions table:';
    
    FOR constraint_record IN 
        SELECT 
            conname as constraint_name,
            contype as constraint_type,
            pg_get_constraintdef(oid) as constraint_definition
        FROM pg_constraint 
        WHERE conrelid = 'document_permissions'::regclass
    LOOP
        RAISE NOTICE 'Constraint: % (Type: %) - %', 
            constraint_record.constraint_name, 
            constraint_record.constraint_type, 
            constraint_record.constraint_definition;
    END LOOP;
END $$;

-- Drop ALL unique constraints that might be causing issues
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- List of potential problematic constraint names
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'document_permissions'::regclass 
        AND contype = 'u' -- unique constraints only
        AND (
            conname LIKE '%document_id_user_id%' OR
            conname = 'document_permisiones_document_id_user_id_key' OR
            conname = 'document_permissions_document_id_user_id_key'
        )
    LOOP
        EXECUTE format('ALTER TABLE document_permissions DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Create the correct unique constraint that includes permission_type
DO $$
BEGIN
    -- Drop the new constraint if it exists (to recreate it)
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'document_permissions_unique_user_document_type' 
        AND conrelid = 'document_permissions'::regclass
    ) THEN
        ALTER TABLE document_permissions 
        DROP CONSTRAINT document_permissions_unique_user_document_type;
        RAISE NOTICE 'Dropped existing constraint: document_permissions_unique_user_document_type';
    END IF;
    
    -- Create the new constraint
    ALTER TABLE document_permissions 
    ADD CONSTRAINT document_permissions_unique_user_document_type 
    UNIQUE (document_id, user_id, permission_type);
    
    RAISE NOTICE 'Created new constraint: document_permissions_unique_user_document_type';
END $$;

-- Verify the final constraint structure
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE 'Final constraints on document_permissions table:';
    
    FOR constraint_record IN 
        SELECT 
            conname as constraint_name,
            contype as constraint_type,
            pg_get_constraintdef(oid) as constraint_definition
        FROM pg_constraint 
        WHERE conrelid = 'document_permissions'::regclass
        ORDER BY contype, conname
    LOOP
        RAISE NOTICE 'Constraint: % (Type: %) - %', 
            constraint_record.constraint_name, 
            constraint_record.constraint_type, 
            constraint_record.constraint_definition;
    END LOOP;
END $$;

-- Clean up any duplicate permissions that might exist
DO $$
DECLARE
    duplicate_record RECORD;
    keep_id UUID;
BEGIN
    RAISE NOTICE 'Checking for and cleaning up duplicate permissions...';
    
    FOR duplicate_record IN 
        SELECT document_id, user_id, permission_type, array_agg(id) as ids, count(*) as count
        FROM document_permissions 
        GROUP BY document_id, user_id, permission_type 
        HAVING count(*) > 1
    LOOP
        -- Keep the first ID, delete the rest
        keep_id := duplicate_record.ids[1];
        
        DELETE FROM document_permissions 
        WHERE document_id = duplicate_record.document_id 
        AND user_id = duplicate_record.user_id 
        AND permission_type = duplicate_record.permission_type 
        AND id != keep_id;
        
        RAISE NOTICE 'Cleaned up % duplicate permissions for document %, user %, type %', 
            duplicate_record.count - 1, 
            duplicate_record.document_id, 
            duplicate_record.user_id, 
            duplicate_record.permission_type;
    END LOOP;
END $$;

-- Show final data to verify everything is clean
SELECT 
    dp.document_id,
    u.full_name,
    u.email,
    dp.permission_type,
    dp.created_at
FROM document_permissions dp
JOIN users u ON dp.user_id = u.id
ORDER BY dp.document_id, u.full_name, dp.permission_type;
