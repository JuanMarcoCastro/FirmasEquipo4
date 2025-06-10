-- Este script verifica las políticas RLS para la tabla documents
-- y asegura que los usuarios puedan eliminar sus propios documentos

-- Verificar políticas RLS existentes
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'documents';

-- Verificar si hay documentos huérfanos (sin usuario asociado)
SELECT
  d.id,
  d.title,
  d.uploaded_by,
  u.id as user_exists
FROM
  documents d
LEFT JOIN
  auth.users u ON d.uploaded_by = u.id
WHERE
  u.id IS NULL;

-- Verificar si hay documentos con dependencias (firmas o permisos)
-- que podrían impedir su eliminación
SELECT
  d.id,
  d.title,
  COUNT(ds.id) as signature_count,
  COUNT(dp.id) as permission_count
FROM
  documents d
LEFT JOIN
  document_signatures ds ON d.id = ds.document_id
LEFT JOIN
  document_permissions dp ON d.id = dp.document_id
GROUP BY
  d.id, d.title
HAVING
  COUNT(ds.id) > 0 OR COUNT(dp.id) > 0;

-- Crear o reemplazar la política RLS para permitir a los usuarios eliminar sus propios documentos
CREATE POLICY delete_own_documents ON documents
  FOR DELETE
  USING (auth.uid() = uploaded_by OR 
         EXISTS (
           SELECT 1 FROM users
           WHERE users.id = auth.uid() AND users.role = 'system_admin'
         ));

-- Verificar que la política se haya creado correctamente
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'documents' AND
  policyname = 'delete_own_documents';

-- Mensaje de confirmación
SELECT 'Verificación y configuración de políticas de eliminación completada' as message;
