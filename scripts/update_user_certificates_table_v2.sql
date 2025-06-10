-- Añadir columnas para almacenar información detallada del certificado
ALTER TABLE public.user_certificates
ADD COLUMN IF NOT EXISTS cert_common_name TEXT,
ADD COLUMN IF NOT EXISTS cert_email TEXT,
ADD COLUMN IF NOT EXISTS cert_organization TEXT,
ADD COLUMN IF NOT EXISTS cert_organizational_unit TEXT,
ADD COLUMN IF NOT EXISTS cert_country TEXT,
ADD COLUMN IF NOT EXISTS cert_serial_number TEXT,
ADD COLUMN IF NOT EXISTS cert_valid_from TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cert_valid_to TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cert_issuer_common_name TEXT,
ADD COLUMN IF NOT EXISTS cert_fingerprint_sha256 TEXT;

-- Comentario para la tabla
COMMENT ON TABLE public.user_certificates IS 'Almacena certificados de usuario y sus metadatos detallados.';

-- Comentarios para las nuevas columnas
COMMENT ON COLUMN public.user_certificates.cert_common_name IS 'Common Name (CN) del certificado.';
COMMENT ON COLUMN public.user_certificates.cert_email IS 'Email del subject del certificado.';
COMMENT ON COLUMN public.user_certificates.cert_organization IS 'Organization (O) del subject del certificado.';
COMMENT ON COLUMN public.user_certificates.cert_organizational_unit IS 'Organizational Unit (OU) del subject del certificado.';
COMMENT ON COLUMN public.user_certificates.cert_country IS 'Country (C) del subject del certificado.';
COMMENT ON COLUMN public.user_certificates.cert_serial_number IS 'Número de serie del certificado.';
COMMENT ON COLUMN public.user_certificates.cert_valid_from IS 'Fecha de inicio de validez del certificado (Not Before).';
COMMENT ON COLUMN public.user_certificates.cert_valid_to IS 'Fecha de fin de validez del certificado (Not After).';
COMMENT ON COLUMN public.user_certificates.cert_issuer_common_name IS 'Common Name (CN) del emisor del certificado.';
COMMENT ON COLUMN public.user_certificates.cert_fingerprint_sha256 IS 'Huella digital SHA-256 del certificado.';

-- Actualizar políticas RLS si es necesario para asegurar que el usuario pueda leer estos nuevos campos
-- (Las políticas existentes de SELECT para el user_id deberían ser suficientes)

-- Opcional: Crear un índice en cert_fingerprint_sha256 si se va a buscar por él
-- CREATE INDEX IF NOT EXISTS idx_user_certificates_fingerprint ON public.user_certificates(cert_fingerprint_sha256);

SELECT 'Tabla user_certificates actualizada con nuevos campos para detalles del certificado.';
