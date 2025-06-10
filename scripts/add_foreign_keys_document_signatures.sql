-- Script separado para añadir las claves foráneas
-- Ejecutar este script después del anterior

-- Verificar y añadir clave foránea para document_id
DO $$
BEGIN
    -- Verificar si la restricción ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'document_signatures_document_id_fkey'
        AND table_name = 'document_signatures'
    ) THEN
        ALTER TABLE document_signatures
        ADD CONSTRAINT document_signatures_document_id_fkey
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Verificar y añadir clave foránea para user_id
DO $$
BEGIN
    -- Verificar si la restricción ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'document_signatures_user_id_fkey'
        AND table_name = 'document_signatures'
    ) THEN
        ALTER TABLE document_signatures
        ADD CONSTRAINT document_signatures_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;
