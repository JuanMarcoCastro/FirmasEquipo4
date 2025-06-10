#!/usr/bin/env python3
"""
Professional Digital Signature Manager for Casa Monarca
Handles certificate generation, PDF signing, and signature verification using PyHanko
"""

import argparse
import json
import sys
import base64
from datetime import datetime, timedelta
from pathlib import Path
import tempfile
import os

try:
    from cryptography import x509
    from cryptography.x509.oid import NameOID, ExtensionOID
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from pyhanko import stamp
    from pyhanko.pdf_utils.reader import PdfFileReader
    from pyhanko.pdf_utils.writer import PdfFileWriter
    from pyhanko.sign import signers, fields
    from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
    import io
except ImportError as e:
    print(json.dumps({"error": f"Missing required Python packages: {e}"}))
    sys.exit(1)

def generate_certificate_and_key(
    common_name: str,
    email_address: str,
    country_name: str = "MX",
    organization_name: str = "Casa Monarca",
    organizational_unit_name: str = "General",
    days_valid: int = 365
):
    """
    Generate a self-signed certificate and private key with specified parameters
    """
    try:
        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )

        # Create certificate subject and issuer
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, country_name),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, organization_name),
            x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, organizational_unit_name),
            x509.NameAttribute(NameOID.COMMON_NAME, common_name),
            x509.NameAttribute(NameOID.EMAIL_ADDRESS, email_address),
        ])

        # Set certificate validity period
        valid_from = datetime.utcnow()
        valid_to = valid_from + timedelta(days=days_valid)

        # Build certificate
        cert_builder = x509.CertificateBuilder()
        cert_builder = cert_builder.subject_name(subject)
        cert_builder = cert_builder.issuer_name(issuer)
        cert_builder = cert_builder.public_key(private_key.public_key())
        cert_builder = cert_builder.serial_number(x509.random_serial_number())
        cert_builder = cert_builder.not_valid_before(valid_from)
        cert_builder = cert_builder.not_valid_after(valid_to)

        # Add extensions
        cert_builder = cert_builder.add_extension(
            x509.SubjectAlternativeName([
                x509.RFC822Name(email_address),
            ]),
            critical=False,
        )

        cert_builder = cert_builder.add_extension(
            x509.BasicConstraints(ca=False, path_length=None),
            critical=True,
        )

        cert_builder = cert_builder.add_extension(
            x509.KeyUsage(
                digital_signature=True,
                content_commitment=True,
                key_encipherment=False,
                data_encipherment=False,
                key_agreement=False,
                key_cert_sign=False,
                crl_sign=False,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        )

        # Sign the certificate
        certificate = cert_builder.sign(private_key, hashes.SHA256())

        # Serialize to PEM format
        private_key_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )

        certificate_pem = certificate.public_bytes(serialization.Encoding.PEM)

        # Extract certificate information
        cert_info = {
            "common_name": common_name,
            "email_address": email_address,
            "country_name": country_name,
            "organization_name": organization_name,
            "organizational_unit_name": organizational_unit_name,
            "serial_number": certificate.serial_number,
            "valid_from": valid_from.isoformat(),
            "valid_to": valid_to.isoformat(),
            "issuer_common_name": common_name,  # Self-signed
            "fingerprint_sha256": certificate.fingerprint(hashes.SHA256()).hex()
        }

        return private_key_pem, certificate_pem, cert_info

    except Exception as e:
        raise Exception(f"Error generating certificate: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description="Professional Digital Signature Manager")
    parser.add_argument("--action", required=True, choices=["generate_certificate", "sign_pdf", "verify_signatures"])
    
    # Certificate generation arguments
    parser.add_argument("--user_name", help="Common Name for certificate")
    parser.add_argument("--email", help="Email address for certificate")
    parser.add_argument("--country_name", default="MX", help="Country code")
    parser.add_argument("--org_name", default="Casa Monarca", help="Organization name")
    parser.add_argument("--org_unit_name", default="General", help="Organizational unit name")
    parser.add_argument("--days_valid", type=int, default=365, help="Certificate validity in days")
    
    # PDF signing arguments
    parser.add_argument("--pdf_path", help="Path to PDF file to sign")
    parser.add_argument("--cert_path", help="Path to certificate file")
    parser.add_argument("--key_path", help="Path to private key file")
    parser.add_argument("--output_path", help="Path for signed PDF output")
    
    args = parser.parse_args()

    try:
        if args.action == "generate_certificate":
            if not all([args.user_name, args.email]):
                print(json.dumps({"error": "user_name and email are required for certificate generation"}))
                sys.exit(1)
            
            private_key_pem, certificate_pem, cert_info = generate_certificate_and_key(
                common_name=args.user_name,
                email_address=args.email,
                country_name=args.country_name,
                organization_name=args.org_name,
                organizational_unit_name=args.org_unit_name,
                days_valid=args.days_valid
            )
            
            result = {
                "success": True,
                "private_key_pem_base64": base64.b64encode(private_key_pem).decode('utf-8'),
                "certificate_pem_base64": base64.b64encode(certificate_pem).decode('utf-8'),
                "certificate_info": cert_info
            }
            
            print(json.dumps(result))
            
        else:
            print(json.dumps({"error": f"Action '{args.action}' not implemented yet"}))
            sys.exit(1)
            
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
