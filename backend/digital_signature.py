from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import os
import datetime
import hashlib
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO

class DigitalSignature:
    def __init__(self):
        self.private_key = None
        self.public_key = None
    
    def generate_key_pair(self):
        """Genera un par de claves RSA para firmas digitales"""
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        self.public_key = self.private_key.public_key()
        return self.private_key, self.public_key
    
    def save_keys(self, private_key_path, public_key_path, password=None):
        """Guarda las claves en archivos"""
        if not self.private_key or not self.public_key:
            self.generate_key_pair()
        
        # Serializar clave privada
        if password:
            encryption_algorithm = serialization.BestAvailableEncryption(password.encode())
        else:
            encryption_algorithm = serialization.NoEncryption()
        
        private_pem = self.private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=encryption_algorithm
        )
        
        # Serializar clave pública
        public_pem = self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        # Guardar en archivos
        with open(private_key_path, 'wb') as f:
            f.write(private_pem)
        
        with open(public_key_path, 'wb') as f:
            f.write(public_pem)
    
    def load_keys(self, private_key_path, public_key_path, password=None):
        """Carga las claves desde archivos"""
        # Cargar clave privada
        with open(private_key_path, 'rb') as f:
            private_pem = f.read()
        
        if password:
            self.private_key = serialization.load_pem_private_key(
                private_pem,
                password=password.encode()
            )
        else:
            self.private_key = serialization.load_pem_private_key(
                private_pem,
                password=None
            )
        
        # Cargar clave pública
        with open(public_key_path, 'rb') as f:
            public_pem = f.read()
        
        self.public_key = serialization.load_pem_public_key(public_pem)
        
        return self.private_key, self.public_key
    
    def sign_data(self, data):
        """Firma datos utilizando la clave privada"""
        if not self.private_key:
            raise ValueError("Private key not loaded")
        
        if isinstance(data, str):
            data = data.encode()
        
        signature = self.private_key.sign(
            data,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        
        return signature
    
    def verify_signature(self, data, signature):
        """Verifica una firma utilizando la clave pública"""
        if not self.public_key:
            raise ValueError("Public key not loaded")
        
        if isinstance(data, str):
            data = data.encode()
        
        try:
            self.public_key.verify(
                signature,
                data,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except Exception:
            return False
    
    def sign_pdf(self, input_path, output_path, signature_info):
        """Firma un documento PDF y añade una página con la información de la firma"""
        # Leer el PDF original
        reader = PdfReader(input_path)
        writer = PdfWriter()
        
        # Copiar todas las páginas al nuevo PDF
        for page in reader.pages:
            writer.add_page(page)
        
        # Calcular hash del documento
        file_hash = self._calculate_file_hash(input_path)
        
        # Firmar el hash
        signature = self.sign_data(file_hash)
        signature_hex = signature.hex()
        
        # Crear una página de firma
        packet = BytesIO()
        c = canvas.Canvas(packet, pagesize=letter)
        
        # Añadir información de la firma
        c.setFont("Helvetica-Bold", 16)
        c.drawString(100, 750, "Certificado de Firma Digital")
        
        c.setFont("Helvetica", 12)
        c.drawString(100, 700, f"Documento: {os.path.basename(input_path)}")
        c.drawString(100, 680, f"Fecha de firma: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        c.drawString(100, 660, f"Firmado por: {signature_info.get('name', 'N/A')}")
        c.drawString(100, 640, f"Cargo: {signature_info.get('role', 'N/A')}")
        c.drawString(100, 620, f"Email: {signature_info.get('email', 'N/A')}")
        
        c.setFont("Helvetica", 10)
        c.drawString(100, 580, "Hash del documento (SHA-256):")
        c.drawString(100, 560, file_hash.hex()[:64])
        c.drawString(100, 540, file_hash.hex()[64:])
        
        c.drawString(100, 500, "Firma digital (primeros 128 caracteres):")
        c.drawString(100, 480, signature_hex[:64])
        c.drawString(100, 460, signature_hex[64:128])
        
        c.setFont("Helvetica", 8)
        c.drawString(100, 100, "Este documento ha sido firmado digitalmente y su integridad está garantizada.")
        c.drawString(100, 80, "Para verificar la autenticidad de este documento, utilice la clave pública del firmante.")
        
        c.save()
        
        # Mover al inicio del buffer
        packet.seek(0)
        signature_page = PdfReader(packet).pages[0]
        
        # Agregar la página de firma
        writer.add_page(signature_page)
        
        # Guardar el PDF firmado
        with open(output_path, "wb") as output_file:
            writer.write(output_file)
        
        return {
            'file_hash': file_hash.hex(),
            'signature': signature_hex,
            'signed_by': signature_info.get('name', 'N/A'),
            'timestamp': datetime.datetime.now().isoformat()
        }
    
    def _calculate_file_hash(self, file_path):
        """Calcula el hash SHA-256 de un archivo"""
        sha256_hash = hashlib.sha256()
        
        with open(file_path, "rb") as f:
            # Leer el archivo en bloques para manejar archivos grandes
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        
        return sha256_hash.digest()

# Ejemplo de uso
if __name__ == "__main__":
    # Crear instancia de firma digital
    ds = DigitalSignature()
    
    # Generar par de claves
    private_key, public_key = ds.generate_key_pair()
    
    # Guardar claves en archivos
    ds.save_keys("private_key.pem", "public_key.pem", password="secreto")
    
    # Cargar claves desde archivos
    ds.load_keys("private_key.pem", "public_key.pem", password="secreto")
    
    # Firmar datos
    data = "Este es un mensaje que será firmado digitalmente"
    signature = ds.sign_data(data)
    
    # Verificar firma
    is_valid = ds.verify_signature(data, signature)
    print(f"¿La firma es válida? {is_valid}")
    
    # Firmar un PDF (si existe)
    if os.path.exists("documento.pdf"):
        signature_info = {
            'name': 'Juan Pérez',
            'role': 'Gerente',
            'email': 'juan@example.com'
        }
        
        result = ds.sign_pdf("documento.pdf", "documento_firmado.pdf", signature_info)
        print(f"Documento firmado. Hash: {result['file_hash'][:16]}...")
