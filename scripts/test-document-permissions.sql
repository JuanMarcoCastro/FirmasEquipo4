-- Script para verificar y crear permisos de prueba para documentos

-- Ver todos los documentos existentes
SELECT 
  d.id,
  d.title,
  d.status,
  u.full_name as uploaded_by,
  u.department
FROM documents d
LEFT JOIN users u ON d.uploaded_by = u.id
ORDER BY d.created_at DESC;

-- Ver todos los permisos de documentos existentes
SELECT 
  dp.document_id,
  d.title,
  dp.user_id,
  u.full_name,
  u.email,
  dp.permission_type,
  dp.created_at
FROM document_permissions dp
LEFT JOIN documents d ON dp.document_id = d.id
LEFT JOIN users u ON dp.user_id = u.id
ORDER BY dp.created_at DESC;

-- Ver usuarios disponibles
SELECT 
  id,
  full_name,
  email,
  role,
  department
FROM users
ORDER BY created_at DESC;

-- Ejemplo: Agregar permisos de firma para un documento específico
-- (Reemplaza los UUIDs con los valores reales de tu base de datos)

-- Primero, obtén el ID de un documento y el ID de un usuario:
-- INSERT INTO document_permissions (document_id, user_id, permission_type)
-- VALUES 
--   ('DOCUMENT_ID_AQUI', 'USER_ID_AQUI', 'sign'),
--   ('DOCUMENT_ID_AQUI', 'USER_ID_AQUI', 'view');

-- Ejemplo de cómo agregar permisos para múltiples usuarios a un documento:
-- INSERT INTO document_permissions (document_id, user_id, permission_type)
-- SELECT 
--   'DOCUMENT_ID_AQUI' as document_id,
--   id as user_id,
--   'sign' as permission_type
-- FROM users 
-- WHERE role IN ('operational_staff', 'area_coordinator')
-- AND id != 'OWNER_USER_ID'; -- Excluir al propietario del documento

-- Ver firmas existentes
SELECT 
  ds.document_id,
  d.title,
  ds.user_id,
  u.full_name,
  ds.signature_reason,
  ds.signed_at
FROM document_signatures ds
LEFT JOIN documents d ON ds.document_id = d.id
LEFT JOIN users u ON ds.user_id = u.id
ORDER BY ds.signed_at DESC;
