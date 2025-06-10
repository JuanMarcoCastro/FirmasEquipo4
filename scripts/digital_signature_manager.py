import os
import io
import json
import base64
import argparse
from datetime import datetime, timedelta
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.sign import signers, fields
from pyhanko.pdf_utils.reader import PdfFileReader
from pyhanko.sign.validation import validate_pdf_signature

class DigitalSignatureManager:
    """
    Manages digital signature operations: certificate generation, signing, and verification.
    """

    def _generate_cert_and_key(self, user_name, email):
        """Generates a new RSA private key and a self-signed X.509 certificate."""
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "MX"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Casa Monarca A.B.P."),
            x509.NameAttribute(NameOID.COMMON_NAME, user_name),
            x509.NameAttribute(NameOID.EMAIL_ADDRESS, email),
        ])
        certificate = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(private_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.utcnow())
            .not_valid_after(datetime.utcnow() + timedelta(days=365))
            .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
            .sign(private_key, hashes.SHA256())
        )
        private_key_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        )
        certificate_pem = certificate.public_bytes(serialization.Encoding.PEM)
        return private_key_pem, certificate_pem

    def sign_pdf(self, pdf_bytes, user_name, email, reason="Firma de conformidad"):
        """Applies a digital signature to a PDF document incrementally."""
        private_key_pem, certificate_pem = self._generate_cert_and_key(user_name, email)
        
        signer = signers.SimpleSigner.load(
            private_key_pem, certificate_pem, ca_chain_files=[], key_passphrase=None
        )

        # Use IncrementalPdfFileWriter to add signatures without invalidating previous ones
        w = IncrementalPdfFileWriter(io.BytesIO(pdf_bytes))
        
        signature_meta = signers.PdfSignatureMetadata(
            field_name=f'Signature-{user_name.replace(" ", "")}',
            reason=reason,
            location='Sistema Digital Casa Monarca',
            signer_name=user_name,
        )
        
        fields.append_signature_field(w, sig_meta=signature_meta)
        
        output_buffer = io.BytesIO()
        w.write(output_buffer, signer=signer, field_name=signature_meta.field_name)
        output_buffer.seek(0)
        
        return output_buffer.getvalue()

    def verify_signatures(self, pdf_bytes):
        """Verifies all digital signatures in a PDF and returns their details."""
        pdf_reader = PdfFileReader(io.BytesIO(pdf_bytes))
        signatures = pdf_reader.embedded_signatures
        
        results = []
        for sig in signatures:
            try:
                status = validate_pdf_signature(sig)
                cert_info = status.signer_cert
                
                # Extract subject common name (signer's name)
                signer_name = "N/A"
                try:
                    signer_name = cert_info.subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
                except (IndexError, AttributeError):
                    pass

                results.append({
                    "signer_name": signer_name,
                    "signing_time": status.signing_time.strftime("%Y-%m-%d %H:%M:%S %Z"),
                    "reason": sig.reason or "No especificado",
                    "location": sig.location or "No especificado",
                    "valid": status.valid,
                    "intact": status.intact,
                    "trusted": status.trusted,
                    "summary": status.summary(),
                })
            except Exception as e:
                results.append({"error": str(e), "valid": False})
        
        return results

def main():
    """Main function to handle command-line arguments."""
    parser = argparse.ArgumentParser(description="Digital Signature Manager for PDFs.")
    parser.add_argument("--action", required=True, choices=["sign", "verify"], help="Action to perform.")
    parser.add_argument("--pdf_base64", required=True, help="Base64 encoded PDF content.")
    parser.add_argument("--user_name", help="User name for signing.")
    parser.add_argument("--email", help="User email for signing.")
    parser.add_argument("--reason", default="Firma de conformidad", help="Reason for signing.")
    
    args = parser.parse_args()
    
    manager = DigitalSignatureManager()
    pdf_bytes = base64.b64decode(args.pdf_b64)
    
    if args.action == "sign":
        if not args.user_name or not args.email:
            print(json.dumps({"error": "User name and email are required for signing."}))
            return
        signed_pdf_bytes = manager.sign_pdf(pdf_bytes, args.user_name, args.email, args.reason)
        print(json.dumps({"signed_pdf_base64": base64.b64encode(signed_pdf_bytes).decode('utf-8')}))
    
    elif args.action == "verify":
        verification_results = manager.verify_signatures(pdf_bytes)
        print(json.dumps(verification_results))

if __name__ == "__main__":
    main()
