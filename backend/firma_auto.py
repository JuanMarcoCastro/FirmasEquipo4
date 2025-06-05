import subprocess
import os
from pyhanko.sign import signers
from pyhanko.sign.fields import SigFieldSpec
from pyhanko.sign.signers import PdfSigner, PdfSignatureMetadata

# ---------- ARCHIVOS ----------
input_pdf = 'documento.pdf'
output_pdf = 'documento_firmado.pdf'
key_file = 'private.key'
cert_file = 'certificate.crt'
pfx_file = 'certificado.p12'
pfx_password = '123456'  # Puedes cambiar esta contraseña

# ---------- 1. Generar clave y certificado autofirmado con OpenSSL ----------
if not os.path.exists(pfx_file):
    print('🔐 Generando certificado autofirmado...')
    
    subprocess.run(['openssl', 'genrsa', '-out', key_file, '2048'], check=True)

    subprocess.run([
        'openssl', 'req', '-new', '-x509', '-key', key_file,
        '-out', cert_file, '-days', '365',
        '-subj', '/CN=Usuario Prueba/O=Organizacion Prueba/C=MX'
    ], check=True)

    subprocess.run([
        'openssl', 'pkcs12', '-export',
        '-out', pfx_file,
        '-inkey', key_file,
        '-in', cert_file,
        '-passout', f'pass:{pfx_password}'
    ], check=True)

    print('✅ Certificado PFX generado con éxito.')

# ---------- 2. Cargar certificado y firmar el PDF ----------
print('✍️ Firmando PDF...')

signer = signers.SimpleSigner.load_pkcs12(
    pfx_file=pfx_file,
    passphrase=pfx_password.encode()
)

signature_meta = PdfSignatureMetadata(
    field_name='FirmaDigital',
    reason='Firma de prueba generada automáticamente',
    location='Script Python',
    signer_name='Usuario Prueba',
)

pdf_signer = PdfSigner(
    signature_meta=signature_meta,
    signer=signer,
    existing_fields_only=False,
    new_field_spec=SigFieldSpec(sig_field_name='FirmaDigital')
)

with open(input_pdf, 'rb') as inf, open(output_pdf, 'wb') as outf:
    pdf_signer.sign_pdf(inf, outf)

print(f'✅ PDF firmado: {output_pdf}')
