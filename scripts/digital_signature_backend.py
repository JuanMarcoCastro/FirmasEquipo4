import os
import io
import base64
import hashlib
from datetime import datetime, timedelta
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from pyhanko import stamp
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.sign import signers, fields
from pyhanko.pdf_utils.reader import PdfFileReader
import supabase

class DigitalSignatureManager:
    def __init__(self, supabase_url, supabase_key):
        """Inicializar el gestor de firmas digitales"""
        self.supabase = supabase.create_client(supabase_url, supabase_key)
        
    def generate_certificate_and_key(self, user_name, email, user_id):
        """
        Generar par de claves y certificado digital para un usuario
        """
        print(f"🔐 Generando certificado para {user_name} ({email})")
        
        # Generar clave privada RSA
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        
        # Crear el certificado
        subject = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "MX"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Ciudad de México"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, "Ciudad de México"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Casa Monarca - Ayuda Humanitaria al Migrante A.B.P."),
            x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "Sistemas Digitales"),
            x509.NameAttribute(NameOID.COMMON_NAME, user_name),
            x509.NameAttribute(NameOID.EMAIL_ADDRESS, email),
        ])
        
        # Construir certificado autofirmado
        certificate = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            subject  # Autofirmado
        ).public_key(
            private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.utcnow()
        ).not_valid_after(
            datetime.utcnow() + timedelta(days=365)  # Válido por 1 año
        ).add_extension(
            x509.KeyUsage(
                digital_signature=True,
                key_encipherment=False,
                key_agreement=False,
                key_cert_sign=False,
                crl_sign=False,
                content_commitment=True,
                data_encipherment=False,
                encipher_only=False,
                decipher_only=False
            ),
            critical=True
        ).sign(private_key, hashes.SHA256())
        
        # Serializar a PEM
        private_key_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()  # En producción usar contraseña
        )
        
        certificate_pem = certificate.public_bytes(serialization.Encoding.PEM)
        
        print(f"✅ Certificado generado exitosamente")
        print(f"📋 Serial Number: {certificate.serial_number}")
        print(f"📅 Válido hasta: {certificate.not_valid_after}")
        
        return private_key_pem, certificate_pem, certificate.serial_number
    
    def save_certificate_to_supabase(self, user_id, user_name, private_key_pem, certificate_pem, serial_number):
        """
        Guardar certificado y clave privada en Supabase Storage
        """
        print(f"💾 Guardando certificado en Supabase para usuario {user_id}")
        
        try:
            # Crear nombres únicos para los archivos
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            cert_filename = f"{user_id}/certificate_{timestamp}.pem"
            key_filename = f"{user_id}/private_key_{timestamp}.pem"
            
            # Subir certificado
            cert_response = self.supabase.storage.from_('certificates').upload(
                cert_filename, 
                certificate_pem,
                {"content-type": "application/x-pem-file"}
            )
            
            # Subir clave privada (en producción, cifrar antes)
            key_response = self.supabase.storage.from_('certificates').upload(
                key_filename, 
                private_key_pem,
                {"content-type": "application/x-pem-file"}
            )
            
            # Guardar metadatos en la tabla user_certificates
            cert_data = {
                "user_id": user_id,
                "certificate_name": f"Certificado Digital - {user_name}",
                "certificate_path": cert_filename,
                "private_key_path": key_filename,
                "serial_number": str(serial_number),
                "is_active": True,
                "expires_at": (datetime.utcnow() + timedelta(days=365)).isoformat()
            }
            
            db_response = self.supabase.table('user_certificates').insert(cert_data).execute()
            
            print(f"✅ Certificado guardado exitosamente")
            print(f"📁 Certificado: {cert_filename}")
            print(f"🔑 Clave privada: {key_filename}")
            
            return db_response.data[0]['id']
            
        except Exception as e:
            print(f"❌ Error guardando certificado: {str(e)}")
            raise e
    
    def get_user_certificate(self, user_id, certificate_id=None):
        """
        Obtener certificado y clave privada de un usuario desde Supabase
        """
        try:
            query = self.supabase.table('user_certificates').select('*').eq('user_id', user_id).eq('is_active', True)
            
            if certificate_id:
                query = query.eq('id', certificate_id)
            
            result = query.execute()
            
            if not result.data:
                raise Exception("No se encontró certificado activo para el usuario")
            
            cert_info = result.data[0]
            
            # Descargar archivos desde Supabase Storage
            cert_response = self.supabase.storage.from_('certificates').download(cert_info['certificate_path'])
            key_response = self.supabase.storage.from_('certificates').download(cert_info['private_key_path'])
            
            return {
                'certificate_pem': cert_response,
                'private_key_pem': key_response,
                'certificate_info': cert_info
            }
            
        except Exception as e:
            print(f"❌ Error obteniendo certificado: {str(e)}")
            raise e
    
    def sign_pdf_with_certificate(self, pdf_bytes, user_id, certificate_id, signature_reason="Firma digital"):
        """
        Firmar PDF usando el certificado del usuario
        """
        print(f"✍️ Firmando PDF para usuario {user_id}")
        
        try:
            # Obtener certificado del usuario
            cert_data = self.get_user_certificate(user_id, certificate_id)
            
            # Cargar clave privada y certificado
            private_key = serialization.load_pem_private_key(
                cert_data['private_key_pem'], 
                password=None
            )
            
            certificate = x509.load_pem_x509_certificate(cert_data['certificate_pem'])
            
            # Crear el firmante
            signer = signers.SimpleSigner.load(
                cert_data['private_key_pem'],
                cert_data['certificate_pem'],
                ca_chain_files=(),
                key_passphrase=None
            )
            
            # Leer el PDF
            pdf_reader = PdfFileReader(io.BytesIO(pdf_bytes))
            
            # Crear writer incremental
            output_buffer = io.BytesIO()
            writer = IncrementalPdfFileWriter(output_buffer)
            
            # Configurar campo de firma
            signature_meta = signers.PdfSignatureMetadata(
                field_name='Signature',
                reason=signature_reason,
                location='Casa Monarca - Sistema Digital',
                signer_name=cert_data['certificate_info']['certificate_name']
            )
            
            # Aplicar firma
            fields.append_signature_field(
                writer, 
                signature_meta,
                signer=signer
            )
            
            # Obtener PDF firmado
            output_buffer.seek(0)
            signed_pdf_bytes = output_buffer.getvalue()
            
            print(f"✅ PDF firmado exitosamente")
            print(f"📄 Tamaño original: {len(pdf_bytes)} bytes")
            print(f"📄 Tamaño firmado: {len(signed_pdf_bytes)} bytes")
            
            return signed_pdf_bytes
            
        except Exception as e:
            print(f"❌ Error firmando PDF: {str(e)}")
            raise e
    
    def verify_pdf_signatures(self, pdf_bytes):
        """
        Verificar todas las firmas en un PDF
        """
        print(f"🔍 Verificando firmas en PDF")
        
        try:
            pdf_reader = PdfFileReader(io.BytesIO(pdf_bytes))
            
            # Obtener campos de firma
            signature_fields = fields.enumerate_sig_fields(pdf_reader)
            
            signatures_info = []
            
            for field_name, sig_obj, sig_field in signature_fields:
                try:
                    # Verificar firma
                    status = sig_obj.compute_integrity_info()
                    
                    # Obtener información del certificado
                    cert_info = sig_obj.signer_info.signer_cert
                    
                    signature_info = {
                        'field_name': field_name,
                        'signer_name': cert_info.subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value,
                        'signer_email': cert_info.subject.get_attributes_for_oid(NameOID.EMAIL_ADDRESS)[0].value,
                        'signing_time': sig_obj.signer_info.signing_time,
                        'is_valid': status.intact,
                        'reason': getattr(sig_obj, 'reason', 'No especificado'),
                        'location': getattr(sig_obj, 'location', 'No especificado')
                    }
                    
                    signatures_info.append(signature_info)
                    
                except Exception as e:
                    print(f"⚠️ Error verificando firma {field_name}: {str(e)}")
            
            print(f"✅ Verificación completada. {len(signatures_info)} firmas encontradas")
            
            return {
                'total_signatures': len(signatures_info),
                'signatures': signatures_info,
                'verification_time': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Error verificando PDF: {str(e)}")
            raise e
    
    def set_pdf_signature_limit(self, document_id, max_signatures):
        """
        Establecer límite de firmas para un documento
        """
        try:
            update_data = {
                'requires_signatures': max_signatures,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table('documents').update(update_data).eq('id', document_id).execute()
            
            print(f"✅ Límite de firmas establecido: {max_signatures} para documento {document_id}")
            
            return result.data[0] if result.data else None
            
        except Exception as e:
            print(f"❌ Error estableciendo límite de firmas: {str(e)}")
            raise e

# Ejemplo de uso
def demo_complete_workflow():
    """
    Demostración completa del flujo de firma digital
    """
    print("🚀 Iniciando demostración completa de firma digital")
    
    # Configuración (usar variables de entorno reales)
    SUPABASE_URL = "https://your-project.supabase.co"
    SUPABASE_KEY = "your-anon-key"
    
    # Inicializar gestor
    signature_manager = DigitalSignatureManager(SUPABASE_URL, SUPABASE_KEY)
    
    # 1. Generar certificado para usuario
    user_id = "user123"
    user_name = "Juan Pérez"
    email = "juan.perez@casamonarca.org"
    
    private_key_pem, certificate_pem, serial_number = signature_manager.generate_certificate_and_key(
        user_name, email, user_id
    )
    
    # 2. Guardar en Supabase
    cert_id = signature_manager.save_certificate_to_supabase(
        user_id, user_name, private_key_pem, certificate_pem, serial_number
    )
    
    # 3. Simular PDF (en la práctica vendría del frontend)
    sample_pdf = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n..."
    
    # 4. Firmar PDF
    signed_pdf = signature_manager.sign_pdf_with_certificate(
        sample_pdf, user_id, cert_id, "Aprobación del documento"
    )
    
    # 5. Verificar firmas
    verification_result = signature_manager.verify_pdf_signatures(signed_pdf)
    
    print("🎉 Demostración completada exitosamente!")
    print(f"📊 Resultado de verificación: {verification_result}")

if __name__ == "__main__":
    demo_complete_workflow()
