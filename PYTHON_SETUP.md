# Configuración del Entorno Python para Firmas Digitales

Para que la funcionalidad de firma digital funcione, necesitas tener un entorno Python configurado con las dependencias necesarias.

## 1. Requisitos Previos

- **Python 3.8 o superior**: Asegúrate de tener Python instalado. Puedes verificarlo con `python3 --version`.
- **pip**: El gestor de paquetes de Python. Usualmente viene con Python.

## 2. Instalación de Dependencias

Ejecuta el siguiente comando en tu terminal para instalar las librerías requeridas desde el archivo `requirements.txt`:

\`\`\`bash
pip install -r requirements.txt
\`\`\`

Esto instalará:
- `pyhanko`: La librería principal para manejar firmas digitales en PDFs.
- `cryptography`: Para generar claves y certificados.
- `supabase-py`: Para interactuar con Supabase (si fuera necesario desde Python).

## 3. Verificación

Una vez instaladas, el backend de Next.js podrá ejecutar el script `scripts/digital_signature_manager.py` sin problemas. No se requiere ninguna otra configuración.

## 🚀 Configuración de Supabase

### 1. **Crear bucket para certificados**
\`\`\`sql
-- En Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificates', 'certificates', false);
\`\`\`

### 2. **Configurar políticas de Storage**
\`\`\`sql
-- Política para que usuarios puedan subir sus certificados
CREATE POLICY "Users can upload their certificates" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política para que usuarios puedan leer sus certificados
CREATE POLICY "Users can read their certificates" ON storage.objects
FOR SELECT USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
\`\`\`

### 3. **Actualizar tabla user_certificates**
\`\`\`sql
-- Agregar campos necesarios para certificados Python
ALTER TABLE user_certificates ADD COLUMN IF NOT EXISTS certificate_path TEXT;
ALTER TABLE user_certificates ADD COLUMN IF NOT EXISTS private_key_path TEXT;
ALTER TABLE user_certificates ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE user_certificates ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
\`\`\`

## 🔧 Uso del Sistema

### 1. **Generar Certificado**
- Ve a `/dashboard/python-signature`
- Haz clic en "Generar Certificado"
- El sistema creará automáticamente:
  - Clave privada RSA 2048-bit
  - Certificado X.509 autofirmado
  - Almacenamiento en Supabase Storage

### 2. **Firmar PDF**
- Sube un archivo PDF
- Escribe el motivo de la firma (opcional)
- Haz clic en "Firmar PDF"
- El archivo firmado se descargará automáticamente

### 3. **Verificar Firmas**
- Sube un PDF firmado
- Haz clic en "Verificar Firmas"
- Ve el resultado de la verificación con detalles

## 🛡️ Seguridad

### **En Desarrollo:**
- Claves privadas sin cifrar (solo para demo)
- Certificados autofirmados
- Almacenamiento en Supabase Storage

### **En Producción (Recomendado):**
- Cifrar claves privadas con passphrase
- Usar HSM (Hardware Security Modules)
- Certificados emitidos por CA confiable
- Implementar timestamping
- Usar PKCS#11 para acceso a claves

## 🔍 Verificación de Funcionamiento

### 1. **Probar script Python**
\`\`\`bash
cd scripts
python3 digital_signature_backend.py
\`\`\`

### 2. **Verificar dependencias**
\`\`\`bash
python3 -c "import pyhanko, cryptography, supabase; print('✅ Todas las dependencias instaladas')"
\`\`\`

### 3. **Probar conexión a Supabase**
\`\`\`bash
python3 -c "
import supabase
client = supabase.create_client('TU_URL', 'TU_KEY')
print('✅ Conexión a Supabase exitosa')
"
\`\`\`

## 📊 Arquitectura del Sistema

\`\`\`
[Frontend Next.js]
       ↓ API Routes
[Node.js Backend]
       ↓ spawn python3
[Python Script]
       ↓ PyHanko + Cryptography
[PDF Firmado] + [Supabase Storage]
\`\`\`

## 🎯 Funcionalidades Implementadas

✅ **Generación de certificados X.509**
✅ **Almacenamiento seguro en Supabase**
✅ **Firma digital de PDFs con PyHanko**
✅ **Verificación de firmas**
✅ **Interfaz web completa**
✅ **Descarga de PDFs firmados**
✅ **Metadatos de firmas en base de datos**

## 🚨 Troubleshooting

### **Error: "python3 not found"**
\`\`\`bash
# En Ubuntu/Debian
sudo apt install python3 python3-pip

# En macOS
brew install python3

# En Windows
# Descargar desde python.org
\`\`\`

### **Error: "Module not found"**
\`\`\`bash
pip install --upgrade pip
pip install -r requirements.txt
\`\`\`

### **Error: "Permission denied"**
\`\`\`bash
chmod +x scripts/digital_signature_backend.py
\`\`\`

### **Error de Supabase Storage**
- Verificar que el bucket 'certificates' existe
- Verificar políticas de acceso
- Verificar variables de entorno

## 📈 Próximos Pasos

1. **Implementar timestamping** para firmas con sello de tiempo
2. **Agregar soporte para múltiples firmantes**
3. **Implementar revocación de certificados**
4. **Agregar validación de cadena de certificados**
5. **Implementar firma en lote**
