-- Script corregido para actualizar la tabla document_signatures
-- Dividido en pasos simples para evitar errores de sintaxis

-- 1. Asegurar que la tabla document_signatures tenga todos los campos necesarios
ALTER TABLE document_signatures
ADD COLUMN IF NOT EXISTS signature_reason TEXT;

ALTER TABLE document_signatures
ADD COLUMN IF NOT EXISTS signature_position JSONB;

-- 2. Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_document_signatures_user_id ON document_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_document_id ON document_signatures(document_id);

-- 3. Eliminar políticas existentes si existen (para recrearlas)
DROP POLICY IF EXISTS "Users can view signatures for documents they have access to" ON document_signatures;
DROP POLICY IF EXISTS "Users can only create signatures for themselves" ON document_signatures;

-- 4. Crear políticas RLS
CREATE POLICY "Users can view signatures for documents they have access to"
ON document_signatures FOR SELECT
USING (
  user_id = auth.uid() OR 
  document_id IN (
    SELECT document_id FROM document_permissions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can only create signatures for themselves"
ON document_signatures FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 5. Habilitar RLS en la tabla si no está habilitado
ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;
