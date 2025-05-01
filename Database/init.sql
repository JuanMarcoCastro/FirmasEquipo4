CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    contrasena VARCHAR(255)
);

CREATE TABLE documentos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100),
    contenido TEXT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE firmas (
    id SERIAL PRIMARY KEY,
    documento_id INTEGER REFERENCES documentos(id),
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha_firma TIMESTAMP,
    estatus VARCHAR(20) -- pendiente, firmado, rechazado
);
