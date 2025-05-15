-- Crear la base de datos
CREATE DATABASE casamonarca;

-- Conectar a la base de datos
\c casamonarca;

-- Crear tabla de usuarios
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    role VARCHAR(20) NOT NULL,
    area VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de documentos
CREATE TABLE documents (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    onedrive_id VARCHAR(255),
    area VARCHAR(50) NOT NULL,
    uploaded_by VARCHAR(36) REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de firmas
CREATE TABLE signatures (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) REFERENCES documents(id),
    user_id VARCHAR(36) REFERENCES users(id),
    signature_hash VARCHAR(255) NOT NULL,
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (document_id, user_id)
);

-- Crear tabla de notificaciones
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id),
    title VARCHAR(100) NOT NULL,
    message VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla para códigos de verificación de dos factores
CREATE TABLE two_factor_codes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id),
    code VARCHAR(10) NOT NULL,
    expiry_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_documents_area ON documents(area);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_signatures_document_id ON signatures(document_id);
CREATE INDEX idx_signatures_user_id ON signatures(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
-- Crear índice para búsqueda rápida por usuario
CREATE INDEX idx_two_factor_user_id ON two_factor_codes(user_id);

-- Crear usuario administrador por defecto
INSERT INTO users (id, name, email, password_hash, role, area, status)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Admin',
    'admin@casamonarca.com',
    -- Contraseña: admin123 (hash generado con bcrypt)
    '$2b$12$1xxxxxxxxxxxxxxxxxxxxuZLbwxnpY0o58unSvIPxddLxGystU9e',
    'admin',
    'Administración',
    'active'
);

-- Crear usuarios de prueba para cada rol y área
INSERT INTO users (id, name, email, password_hash, role, area, status)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Sub Admin', 'sub_admin@casamonarca.com', '$2b$12$1xxxxxxxxxxxxxxxxxxxxuZLbwxnpY0o58unSvIPxddLxGystU9e', 'sub_admin', 'Legal', 'active'),
    ('22222222-2222-2222-2222-222222222222', 'Coordinador Humanitaria', 'coord_humanitaria@casamonarca.com', '$2b$12$1xxxxxxxxxxxxxxxxxxxxuZLbwxnpY0o58unSvIPxddLxGystU9e', 'management', 'Humanitaria', 'active'),
    ('33333333-3333-3333-3333-333333333333', 'Coordinador Psicosocial', 'coord_psicosocial@casamonarca.com', '$2b$12$1xxxxxxxxxxxxxxxxxxxxuZLbwxnpY0o58unSvIPxddLxGystU9e', 'management', 'Psicosocial', 'active'),
    ('44444444-4444-4444-4444-444444444444', 'Coordinador Legal', 'coord_legal@casamonarca.com', '$2b$12$1xxxxxxxxxxxxxxxxxxxxuZLbwxnpY0o58unSvIPxddLxGystU9e', 'management', 'Legal', 'active'),
    ('55555555-5555-5555-5555-555555555555', 'Coordinador Comunicación', 'coord_comunicacion@casamonarca.com', '$2b$12$1xxxxxxxxxxxxxxxxxxxxuZLbwxnpY0o58unSvIPxddLxGystU9e', 'management', 'Comunicación', 'active'),
    ('66666666-6666-6666-6666-666666666666', 'Coordinador Almacén', 'coord_almacen@casamonarca.com', '$2b$12$1xxxxxxxxxxxxxxxxxxxxuZLbwxnpY0o58unSvIPxddLxGystU9e', 'management', 'Almacén', 'active'),
    ('77777777-7777-7777-7777-777777777777', 'Operativo Humanitaria', 'ops_humanitaria@casamonarca.com', '$2b$12$1xxxxxxxxxxxxxxxxxxxxuZLbwxnpY0o58unSvIPxddLxGystU9e', 'employer', 'Humanitaria', 'active'),
    ('88888888-8888-8888-8888-888888888888', 'Operativo Psicosocial', 'ops_psicosocial@casamonarca.com', '$2b$12$1xxxxxxxxxxxxxxxxxxxxuZLbwxnpY0o58unSvIPxddLxGystU9e', 'employer', 'Psicosocial', 'active'),
    ('99999999-9999-9999-9999-999999999999', 'Operativo Legal', 'ops_legal@casamonarca.com', '$2b$12$1xxxxxxxxxxxxxxxxxxxxuZLbwxnpY0o58unSvIPxddLxGystU9e', 'employer', 'Legal', 'active'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Operativo Comunicación', 'ops_comunicacion@casamonarca.com', '$2b$12$1xxxxxxxxxxxxxxxxxxxxuZLbwxnpY0o58unSvIPxddLxGystU9e', 'employer', 'Comunicación', 'active'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Operativo Almacén', 'ops_almacen@casamonarca.com', '$2b$12$1xxxxxxxxxxxxxxxxxxxxuZLbwxnpY0o58unSvIPxddLxGystU9e', 'employer', 'Almacén', 'active'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Externo', 'externo@casamonarca.com', '$2b$12$1xxxxxxxxxxxxxxxxxxxxuZLbwxnpY0o58unSvIPxddLxGystU9e', 'public', NULL, 'active');

-- Agregar usuario de prueba con el correo proporcionado
INSERT INTO users (id, name, email, password_hash, role, area, status)
VALUES (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Juan Marco',
    'juanmarco.ct@gmail.com',
    -- Contraseña: admin123 (hash generado con bcrypt)
    '$2b$12$1xxxxxxxxxxxxxxxxxxxxuZLbwxnpY0o58unSvIPxddLxGystU9e',
    'admin',
    'Administración',
    'active'
);
