-- Este script actualiza la tabla document_signatures para asegurar compatibilidad
-- con el nuevo sistema de firmas PyHanko

-- 1. Asegurar que la tabla document_signatures tenga todos los campos necesarios
ALTER TABLE IF EXISTS document_signatures
ADD COLUMN IF NOT EXISTS signature_reason TEXT,
ADD COLUMN IF NOT EXISTS signature_position JSONB;

-- 2. Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_document_signatures_user_id ON document_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_document_id ON document_signatures(document_id);

-- 3. Asegurar que las políticas RLS estén correctamente configuradas
-- Política para SELECT: un usuario puede ver firmas de documentos a los que tiene acceso
CREATE POLICY IF NOT EXISTS "Users can view signatures for documents they have access to"
ON document_signatures FOR SELECT
USING (
  user_id = auth.uid() OR 
  document_id IN (
    SELECT document_id FROM document_permissions WHERE user_id = auth.uid()
  )
);

-- Política para INSERT: un usuario solo puede crear firmas para sí mismo
CREATE POLICY IF NOT EXISTS "Users can only create signatures for themselves"
ON document_signatures FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 4. Asegurar que la tabla tenga las restricciones de integridad referencial correctas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'document_signatures_document_id_fkey'
  ) THEN
    ALTER TABLE document_signatures
    ADD CONSTRAINT document_signatures_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'document_signatures_user_id_fkey'
  ) THEN
    ALTER TABLE document_signatures
    ADD CONSTRAINT document_signatures_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- 5. Comentario para documentar la tabla
COMMENT ON TABLE document_signatures IS 'Almacena las firmas digitales realizadas con PyHanko en documentos PDF';
