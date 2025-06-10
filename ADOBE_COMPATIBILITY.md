# 🔍 Adobe Acrobat Compatibility Guide

## ¿Por qué Adobe Acrobat no reconoce las firmas?

### **Causas Comunes:**

1. **Certificados Autofirmados**
   - Adobe Acrobat es muy estricto con certificados que no están en su lista de confianza
   - Los certificados autofirmados aparecen como "no confiables" pero siguen siendo válidos criptográficamente

2. **Formato de Firma**
   - Adobe prefiere ciertos formatos específicos de firma digital
   - Hemos optimizado PyHanko para usar PKCS#7 Detached que es más compatible

3. **Extensiones de Certificado**
   - Adobe busca extensiones específicas en los certificados
   - Hemos añadido las extensiones necesarias para mejor reconocimiento

## ✅ Mejoras Implementadas

### **Certificados Mejorados:**
- ✅ **Extended Key Usage** con OID específico para firma de documentos
- ✅ **Subject Alternative Name** con email
- ✅ **Enhanced Key Usage** para compatibilidad con Adobe
- ✅ **Organizational Unit** para mejor identificación

### **Firmas Optimizadas:**
- ✅ **PKCS#7 Detached** como subfilter preferido por Adobe
- ✅ **Metadatos completos** (contacto, ubicación, motivo)
- ✅ **Timestamp explícito** en UTC
- ✅ **Byte range reservado** más grande para firmas complejas

### **Verificación Mejorada:**
- ✅ **Información detallada** del certificado
- ✅ **Tipo de firma** identificado
- ✅ **Compatibilidad con Adobe** marcada explícitamente

## 🔧 Cómo Verificar en Adobe Acrobat

### **Pasos para Verificar:**

1. **Abrir el PDF firmado en Adobe Acrobat**
2. **Buscar el panel de firmas:**
   - Ve a `View` → `Navigation Panels` → `Signatures`
   - O busca un ícono de firma en la barra lateral

3. **Verificar la firma:**
   - Haz clic derecho en la firma
   - Selecciona `Verify Signature`
   - Revisa los detalles del certificado

### **Estados Posibles:**

- 🟡 **"Signature validity is UNKNOWN"** - Certificado autofirmado (normal)
- 🟢 **"Signature is valid"** - Firma criptográficamente correcta
- 🔴 **"Signature is invalid"** - Problema con la firma

### **Añadir Certificado a la Lista de Confianza:**

1. **Hacer clic derecho en la firma**
2. **Seleccionar "Signature Properties"**
3. **Hacer clic en "Show Certificate"**
4. **Hacer clic en "Trust" tab**
5. **Seleccionar "Add to Trusted Identities"**
6. **Marcar "Use this certificate as a trusted root"**

## 🛠️ Herramientas Alternativas de Verificación

### **PDF-Tools Online:**
- [PDF24 Signature Checker](https://tools.pdf24.org/en/verify-pdf-signature)
- [SmallPDF Signature Verification](https://smallpdf.com/verify-pdf-signature)

### **Línea de Comandos:**
\`\`\`bash
# Verificar con PyHanko directamente
python3 -m pyhanko sign verify documento_firmado.pdf

# Verificar con OpenSSL (si el certificado está extraído)
openssl verify -CAfile certificado.pem
\`\`\`

### **Programáticamente:**
\`\`\`python
from pyhanko.pdf_utils.reader import PdfFileReader
from pyhanko.sign.validation import validate_pdf_signature

# Cargar PDF
with open('documento_firmado.pdf', 'rb') as f:
    reader = PdfFileReader(f)
    
# Verificar firmas
for sig in reader.embedded_signatures:
    status = validate_pdf_signature(sig)
    print(f"Firma válida: {status.valid}")
    print(f"Documento íntegro: {status.intact}")
\`\`\`

## 📋 Checklist de Verificación

- [ ] El PDF se abre sin errores
- [ ] Adobe muestra un panel de firmas
- [ ] La firma aparece en la lista (aunque sea como "no confiable")
- [ ] Los metadatos de la firma son visibles
- [ ] El certificado se puede examinar
- [ ] La verificación criptográfica es exitosa

## 🎯 Próximos Pasos para Máxima Compatibilidad

1. **Certificados de CA Comercial:**
   - Usar certificados de DigiCert, GlobalSign, etc.
   - Mayor confianza automática en Adobe

2. **Timestamp Authority:**
   - Añadir timestamps de autoridades reconocidas
   - Mejor validación a largo plazo

3. **Firma Visible:**
   - Añadir apariencia visual a las firmas
   - Mejor experiencia de usuario en Adobe

4. **LTV (Long Term Validation):**
   - Embebido de información de revocación
   - Validación independiente de conectividad
