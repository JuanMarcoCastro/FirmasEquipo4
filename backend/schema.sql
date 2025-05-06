-- Crear la base de datos
CREATE DATABASE firma_digital;

-- Conectar a la base de datos
\c firma_digital;

-- Crear tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Sub_Admin', 'Management', 'Employer', 'Public')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de carpetas
CREATE TABLE folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER REFERENCES folders(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de archivos
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    original_name VARCHAR(100) NOT NULL,
    folder_id INTEGER REFERENCES folders(id),
    uploaded_by INTEGER REFERENCES users(id),
    file_path VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modificar la tabla de archivos para incluir el campo is_cloud_stored
ALTER TABLE files ADD COLUMN IF NOT EXISTS is_cloud_stored BOOLEAN DEFAULT FALSE;

-- Crear tabla de firmas
CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files(id),
    user_id INTEGER REFERENCES users(id),
    signature_data TEXT NOT NULL,
    signature_type VARCHAR(20) NOT NULL CHECK (signature_type IN ('simple', 'advanced')),
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de firmas pendientes
CREATE TABLE pending_signatures (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files(id),
    user_id INTEGER REFERENCES users(id),
    requested_by INTEGER REFERENCES users(id),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de notificaciones
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    file_id INTEGER REFERENCES files(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar usuario administrador por defecto
INSERT INTO users (name, email, password_hash, role)
VALUES ('Admin', 'admin@example.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Admin');
-- Contraseña: 123

-- Crear carpeta raíz por defecto
INSERT INTO folders (name, parent_id, created_by)
VALUES ('Root', NULL, 1);
