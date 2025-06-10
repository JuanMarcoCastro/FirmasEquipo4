-- Verificar permisos existentes
SELECT 
  dp.id, 
  dp.document_id, 
  dp.user_id, 
  dp.permission_type,
  u.full_name,
  u.email,
  d.title as document_title
FROM 
  document_permissions dp
JOIN 
  users u ON dp.user_id = u.id
JOIN 
  documents d ON dp.document_id = d.id
ORDER BY 
  dp.document_id, dp.user_id;

-- Verificar documentos sin permisos
SELECT 
  d.id, 
  d.title, 
  d.uploaded_by,
  u.full_name as uploader_name,
  COUNT(dp.id) as permission_count
FROM 
  documents d
LEFT JOIN 
  document_permissions dp ON d.id = dp.document_id
JOIN 
  users u ON d.uploaded_by = u.id
GROUP BY 
  d.id, d.title, d.uploaded_by, u.full_name
HAVING 
  COUNT(dp.id) = 0;

-- Verificar usuarios sin permisos
SELECT 
  u.id, 
  u.full_name, 
  u.email,
  u.role,
  COUNT(dp.id) as permission_count
FROM 
  users u
LEFT JOIN 
  document_permissions dp ON u.id = dp.user_id
GROUP BY 
  u.id, u.full_name, u.email, u.role
ORDER BY 
  permission_count ASC;

-- Verificar permisos de firma
SELECT 
  dp.id, 
  dp.document_id, 
  dp.user_id, 
  u.full_name,
  u.email,
  d.title as document_title
FROM 
  document_permissions dp
JOIN 
  users u ON dp.user_id = u.id
JOIN 
  documents d ON dp.document_id = d.id
WHERE 
  dp.permission_type = 'sign'
ORDER BY 
  dp.document_id, dp.user_id;
