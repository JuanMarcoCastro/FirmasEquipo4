# FirmasEquipo4

Integrantes del equipo (601):
- Juan Marco Castro Trinidad
- Fedra Fernanda Mandujano López
- Miranda Isabel Rada Chau
- Eliani González Laguna
- Alfredo D

---

# Reto
Implementar protocolos basados en criptografía de clave pública de manera eficiente e ideal con contramedidas con el fin de desarrollar un sistema funcional de firma digital que garantice la autenticidad e integridad de los documentos y que esté adaptado a las necesidades de una organización social que trabaja con migrantes.

---

##  Equipo de desarrollo

| Nombre             | Rol                         |
|--------------------|-----------------------------|
| Fedra              | Frontend                    |
| Miranda            | Frontend                    |
| Eliani             | Firma Digital en Python     |
| Marco              | Backend + conexión BD       |
| Alfredo            | Backend + conexión BD       |

---

# Casa Monarca - Sistema de Gestión Documental

Sistema completo de gestión documental con firma digital para Casa Monarca - Ayuda Humanitaria al Migrante A.B.P.

## 🚀 Características

- **Autenticación y Autorización**: Sistema completo con roles (Admin, Coordinador, Staff, Personal Externo)
- **Gestión de Documentos**: Subida, visualización y organización de documentos
- **Firma Digital**: Implementación de firma digital con certificados generados automáticamente
- **Control de Permisos**: Sistema granular de permisos por documento y usuario
- **Dashboard Interactivo**: Estadísticas y métricas en tiempo real
- **Responsive Design**: Interfaz adaptable a todos los dispositivos

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Base de Datos**: PostgreSQL (Supabase)
- **Autenticación**: Supabase Auth
- **UI Components**: shadcn/ui
- **Firma Digital**: PDF-lib (demo), PyHanko (producción)

## 📋 Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Git

## 🔧 Instalación Local

### 1. Clonar el Repositorio

\`\`\`bash
git clone <repository-url>
cd casa-monarca-app
\`\`\`

### 2. Instalar Dependencias

\`\`\`bash
npm install
# o
yarn install
\`\`\`

### 3. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env.local`:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Edita `.env.local` con tus configuraciones:

\`\`\`env
# Supabase Configuration (REQUERIDO)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# JWT Secret (obtener de Supabase Dashboard > Settings > API)
SUPABASE_JWT_SECRET=tu_jwt_secret

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu_nextauth_secret_aleatorio
\`\`\`

### 4. Configurar Supabase

#### 4.1 Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota la URL y las claves API

#### 4.2 Ejecutar Scripts de Base de Datos

Ejecuta los siguientes scripts SQL en el editor SQL de Supabase (en orden):

\`\`\`sql
-- 1. Crear tablas principales
-- Ejecutar scripts/create-certificate-content-table.sql
-- Ejecutar scripts/create-document-signatures-table.sql
-- Ejecutar scripts/fix-document-signatures-table.sql
-- Ejecutar scripts/fix-document-permissions-constraint.sql
-- Ejecutar scripts/fix-permissions-constraints-final.sql
\`\`\`

#### 4.3 Configurar Storage

En Supabase Dashboard > Storage:

1. Crear bucket `documents` (público)
2. Crear bucket `signed_documents` (público)
3. Crear bucket `certificates` (privado)

#### 4.4 Configurar Políticas RLS

\`\`\`sql
-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certificates ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar según necesidades)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
\`\`\`

### 5. Ejecutar la Aplicación

\`\`\`bash
npm run dev
# o
yarn dev
\`\`\`

La aplicación estará disponible en `http://localhost:3000`

## 👥 Usuarios de Prueba

Después de configurar la base de datos, puedes crear usuarios de prueba:

\`\`\`sql
-- Insertar usuarios de prueba (ejecutar después del registro)
INSERT INTO users (id, email, full_name, role, department, is_active) VALUES
('user-id-1', 'admin@casamonarca.org', 'Administrador Sistema', 'system_admin', 'Humanitaria', true),
('user-id-2', 'coord@casamonarca.org', 'Coordinador Área', 'area_coordinator', 'Legal', true),
('user-id-3', 'staff@casamonarca.org', 'Personal Operativo', 'area_staff', 'Psicosocial', true);
\`\`\`

## 🔐 Configuración de Autenticación

### Configurar Proveedores de Auth en Supabase

1. Ve a Authentication > Providers
2. Configura Email (habilitado por defecto)
3. Opcional: Configurar Google, GitHub, etc.

### Configurar Redirects

En Authentication > URL Configuration:
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

## 📁 Estructura del Proyecto

\`\`\`
casa-monarca-app/
├── app/                          # App Router de Next.js
│   ├── dashboard/               # Páginas del dashboard
│   ├── api/                     # API Routes
│   └── auth/                    # Páginas de autenticación
├── components/                  # Componentes React
│   ├── ui/                      # Componentes UI (shadcn)
│   ├── auth/                    # Componentes de autenticación
│   ├── documents/               # Componentes de documentos
│   └── dashboard/               # Componentes del dashboard
├── lib/                         # Utilidades y configuraciones
├── scripts/                     # Scripts SQL
└── public/                      # Archivos estáticos
\`\`\`

## 🔧 Comandos Útiles

\`\`\`bash
# Desarrollo
npm run dev

# Construcción
npm run build

# Iniciar producción
npm start

# Linting
npm run lint

# Formateo de código
npm run format
\`\`\`

## 🐛 Solución de Problemas

### Error: "Failed to create Supabase client"

1. Verifica que las variables de entorno estén correctas
2. Asegúrate de que el proyecto de Supabase esté activo
3. Verifica las claves API en Supabase Dashboard

### Error: "Table doesn't exist"

1. Ejecuta todos los scripts SQL en orden
2. Verifica que las tablas se crearon en Supabase Dashboard

### Error: "Row Level Security"

1. Configura las políticas RLS apropiadas
2. Temporalmente puedes deshabilitar RLS para pruebas:
   \`\`\`sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   \`\`\`

### Error de permisos de Storage

1. Verifica que los buckets estén creados
2. Configura las políticas de Storage apropiadas

## 📚 Documentación Adicional

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico, contacta a: tech@casamonarca.org

---

**Casa Monarca - Ayuda Humanitaria al Migrante A.B.P.**
