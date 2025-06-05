from fastapi import FastAPI, HTTPException, Body, UploadFile, File
from fastapi.responses import JSONResponse
import httpx
import tempfile
import os
import shutil
from pydantic import BaseModel
from typing import Optional

# Importaciones de PyHanko (asegúrate de tenerlas configuradas)
# from pyhanko.pdf_utils.reader import PdfFileReader
# from pyhanko.signers import SimpleSigner
# from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
# from pyhanko.signers.fields import SigFieldSpec
# from pyhanko.signers.pdf_cms import select_signature_mechanism
# from pyhanko.signers.timestamps import HTTPTimeStamper # Si usas TSA
# from pyhanko.keys import load_cert_from_pemder, load_certs_from_pemder
# from pyhanko.signers.pkcs11 import PKCS11Signer # Si usas HSM/Token
# from pyhanko.signers.pkcs11 import open_pkcs11_session
# from cryptography.hazmat.primitives import serialization

app = FastAPI(
    title="Servicio de Firma de Documentos con PyHanko",
    description="Un API para firmar digitalmente documentos PDF utilizando PyHanko.",
    version="0.1.0"
)

# --- Modelos de Datos ---
class SignerInfo(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    # Puedes añadir más campos relevantes aquí

class SigningRequest(BaseModel):
    document_url: str
    original_file_name: str
    signer_info: Optional[SignerInfo] = None
    # Aquí podrías añadir más campos, como:
    # signature_level: str = "PAdES-B-T" # Nivel de firma PAdES
    # certificate_alias: Optional[str] = None # Para seleccionar un certificado específico si tienes varios

class SigningResponse(BaseModel):
    message: str
    signed_document_url: Optional[str] = None
    new_file_name: Optional[str] = None
    error_details: Optional[str] = None

# --- Configuración (Ejemplos - DEBES AJUSTAR ESTO) ---
# Deberás configurar esto de forma segura, por ejemplo, usando variables de entorno
CERTIFICATE_DIR = os.path.join(os.path.dirname(__file__), "certificates")
PFX_FILE_PATH = os.path.join(CERTIFICATE_DIR, "tu_certificado.pfx") # Cambia esto
PFX_PASSPHRASE = b"tu_contraseña_pfx"  # Cambia esto y usa variables de entorno

# URL base de tu Supabase Storage (o donde subirás los firmados)
# Ejemplo: SUPABASE_STORAGE_BASE_URL = "https://<project_ref>.supabase.co/storage/v1/object/public/signed-documents"
# Asegúrate de que el bucket "signed-documents" exista y tenga los permisos adecuados.
# Esta URL se usará para construir la URL del documento firmado.
# Necesitarás una forma de subir el archivo a este bucket (ej. usando la librería de Supabase para Python o su API HTTP).
SIGNED_DOCS_BUCKET_URL = os.getenv("SIGNED_DOCS_BUCKET_URL", "http://localhost:8000/mock_storage/signed-documents")


# --- Funciones Auxiliares (Simuladas/Ejemplos) ---

async def download_document(url: str, dest_folder: str) -> str:
    """Descarga un documento desde una URL a una carpeta temporal."""
    file_name = url.split("/")[-1].split("?")[0] # Intenta obtener un nombre de archivo
    if not file_name:
        file_name = "temp_document.pdf"
    
    local_path = os.path.join(dest_folder, file_name)
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status() # Lanza excepción para códigos 4xx/5xx
            with open(local_path, "wb") as f:
                f.write(response.content)
            print(f"Documento descargado: {local_path}")
            return local_path
        except httpx.HTTPStatusError as e:
            print(f"Error HTTP al descargar {url}: {e}")
            raise HTTPException(status_code=e.response.status_code, detail=f"Error al descargar el documento original: {e.response.text}")
        except Exception as e:
            print(f"Error genérico al descargar {url}: {e}")
            raise HTTPException(status_code=500, detail=f"Error interno al descargar el documento: {str(e)}")

def sign_pdf_with_pyhanko(input_pdf_path: str, output_pdf_path: str, signer_name: Optional[str] = "Firmante por Defecto") -> bool:
    """
    Firma un PDF usando PyHanko.
    ESTA ES UNA IMPLEMENTACIÓN DE EJEMPLO MUY BÁSICA.
    DEBES ADAPTARLA COMPLETAMENTE A TUS NECESIDADES DE PYHANKO:
    - Carga de certificados (PFX, PEM, HSM/PKCS#11).
    - Configuración del `SimpleSigner` o `PKCS11Signer`.
    - Definición de la apariencia de la firma (si es visible).
    - Nivel de firma PAdES (B-T, B-LT, B-LTA).
    - Uso de Timestamp Authority (TSA).
    """
    print(f"Intentando firmar: {input_pdf_path} -> {output_pdf_path}")
    
    # --- INICIO: Lógica de PyHanko (EJEMPLO BÁSICO CON PFX) ---
    # ¡¡¡ADVERTENCIA!!! Esto es solo un esqueleto. Necesitas implementar la carga
    # segura de certificados y la configuración detallada de PyHanko.
    try:
        # Ejemplo de carga de PFX (NO USAR PASSPHRASE DIRECTAMENTE EN CÓDIGO EN PRODUCCIÓN)
        # signer = SimpleSigner.load_pkcs12(
        #     pfx_file=PFX_FILE_PATH,
        #     passphrase=PFX_PASSPHRASE
        # )
        # print(f"Certificado PFX cargado desde: {PFX_FILE_PATH}")

        # Ejemplo con certificado y clave PEM (sin encriptar la clave, o desencriptar antes)
        # with open(os.path.join(CERTIFICATE_DIR, 'signer.crt.pem'), 'rb') as cert_file:
        #     signing_cert = load_cert_from_pemder(cert_file.read())
        # with open(os.path.join(CERTIFICATE_DIR, 'signer.key.pem'), 'rb') as key_file:
        #     # Si la clave está encriptada, necesitarás la passphrase aquí
        #     priv_key = serialization.load_pem_private_key(key_file.read(), password=None) # o b'tu_passphrase_key'
        #
        # # Si tienes certificados intermedios/raíz en un archivo pem:
        # # other_certs = []
        # # with open(os.path.join(CERTIFICATE_DIR, 'chain.pem'), 'rb') as chain_file:
        # #     other_certs.extend(load_certs_from_pemder(chain_file.read()))
        #
        # signer = SimpleSigner(
        #     signing_cert=signing_cert,
        #     signing_key=priv_key,
        #     # cert_registry=InMemorySigningCertRegistry(signing_cert, *other_certs) # Si tienes cadena
        # )
        # print("Certificado y clave PEM cargados.")


        # Simulación de firma: Copia el archivo de entrada al de salida
        # REEMPLAZA ESTO CON LA LÓGICA REAL DE PYHANKO
        shutil.copyfile(input_pdf_path, output_pdf_path)
        print(f"SIMULACIÓN: Documento '{input_pdf_path}' copiado a '{output_pdf_path}' como si estuviera firmado.")
        # Ejemplo de cómo sería una firma real (muy simplificado):
        # with open(input_pdf_path, 'rb') as doc_in:
        #     w = IncrementalPdfFileWriter(doc_in)
        #     with open(output_pdf_path, 'wb') as doc_out:
        #         # Aquí puedes configurar SigFieldSpec para firmas visibles, metadatos, etc.
        #         # mechanism = select_signature_mechanism(signer.signing_cert, signer.pkcs11_session_info is not None)
        #         # pdf_signer = signers.PdfSigner(
        #         #     pdf_timestamper=HTTPTimeStamper(url='URL_DE_TU_TSA_SI_USAS') if TSA_URL else None,
        #         #     signature_meta=signers.PdfSignatureMetadata(
        #         #         field_name='Signature1', # O un nombre de campo existente
        #         #         name=signer_name or "Firmante Autorizado",
        #         #         location="Oficina Central", # Ejemplo
        #         #         reason="Aprobación del documento", # Ejemplo
        #         #     ),
        #         #     signer=signer,
        #         #     # Para firmas visibles:
        #         #     # sig_field_spec=SigFieldSpec(
        #         #     #   sig_field_name='Signature1',
        #         #     #   box=(x1, y1, x2, y2) # Coordenadas del campo de firma
        #         #     # ),
        #         # )
        #         # pdf_signer.sign_pdf(w, output=doc_out)
        # print(f"Documento firmado con PyHanko: {output_pdf_path}")
        return True
    except FileNotFoundError:
        print(f"Error: Archivo de certificado no encontrado en {PFX_FILE_PATH} o PEMs. Verifica la ruta y configuración.")
        # No relanzar HTTPException aquí directamente si quieres manejarlo en el endpoint
        return False
    except Exception as e:
        print(f"Error durante la firma con PyHanko: {e}")
        # import traceback
        # traceback.print_exc()
        return False
    # --- FIN: Lógica de PyHanko ---

async def upload_signed_document(local_signed_path: str, original_file_name: str) -> tuple[Optional[str], Optional[str]]:
    """
    Sube el documento firmado a un almacenamiento (ej. Supabase Storage)
    y devuelve la URL pública y el nuevo nombre del archivo.
    ESTA ES UNA IMPLEMENTACIÓN SIMULADA.
    """
    # Simulación:
    # En un caso real, usarías la librería de Supabase para Python o su API HTTP
    # para subir `local_signed_path` al bucket configurado.
    
    new_file_name = f"signed_{original_file_name}"
    if not new_file_name.lower().endswith(".pdf"):
        new_file_name += ".pdf"
        
    # Simulación de subida: simplemente construye una URL ficticia
    # signed_url = f"{SIGNED_DOCS_BUCKET_URL}/{new_file_name}"
    
    # Para probar localmente sin Supabase, podrías "subir" a una carpeta local servida por FastAPI
    # (necesitarías configurar StaticFiles en FastAPI para esto)
    mock_storage_dir = os.path.join(os.path.dirname(__file__), "mock_storage", "signed-documents")
    os.makedirs(mock_storage_dir, exist_ok=True)
    destination_path = os.path.join(mock_storage_dir, new_file_name)
    shutil.copyfile(local_signed_path, destination_path)
    
    # La URL sería relativa a cómo sirves estos archivos estáticos.
    # Si FastAPI sirve 'mock_storage' en la raíz:
    signed_url = f"/mock_storage/signed-documents/{new_file_name}" # Ajusta si sirves desde otra ruta
    
    print(f"SIMULACIÓN: Documento firmado '{local_signed_path}' subido a '{destination_path}' (URL: {signed_url})")
    return signed_url, new_file_name


# --- Endpoint de Firma ---
@app.post("/sign_document", response_model=SigningResponse)
async def sign_document_route(payload: SigningRequest):
    """
    Endpoint para solicitar la firma de un documento.
    1. Descarga el documento desde `document_url`.
    2. Firma el documento usando PyHanko (configuración de ejemplo).
    3. Sube el documento firmado al almacenamiento.
    4. Devuelve la URL del documento firmado.
    """
    temp_dir = tempfile.mkdtemp()
    downloaded_pdf_path = None
    signed_pdf_path = None

    try:
        # 1. Descargar el documento
        print(f"Recibida solicitud para firmar: {payload.original_file_name} desde {payload.document_url}")
        downloaded_pdf_path = await download_document(payload.document_url, temp_dir)
        
        # 2. Preparar para firmar
        base_name, ext = os.path.splitext(os.path.basename(downloaded_pdf_path))
        signed_pdf_path = os.path.join(temp_dir, f"{base_name}_signed{ext}")
        
        signer_display_name = payload.signer_info.name if payload.signer_info else "Firmante del Sistema"

        # 3. Firmar con PyHanko
        # Aquí deberías pasar la información del firmante y del certificado si es necesario
        success = sign_pdf_with_pyhanko(downloaded_pdf_path, signed_pdf_path, signer_name=signer_display_name)
        
        if not success:
            # El error específico ya se habrá impreso en sign_pdf_with_pyhanko
            raise HTTPException(status_code=500, detail="Error durante el proceso de firma con PyHanko. Revisa los logs del servidor Python.")

        # 4. Subir el documento firmado
        signed_url, new_name = await upload_signed_document(signed_pdf_path, payload.original_file_name)
        
        if not signed_url:
            raise HTTPException(status_code=500, detail="Error al subir el documento firmado.")

        return SigningResponse(
            message="Documento firmado y subido exitosamente (simulado).",
            signed_document_url=signed_url,
            new_file_name=new_name
        )

    except HTTPException as http_exc: # Relanzar HTTPExceptions conocidas
        return JSONResponse(
            status_code=http_exc.status_code,
            content=SigningResponse(
                message="Error en el proceso de firma.",
                error_details=str(http_exc.detail)
            ).model_dump(exclude_none=True)
        )
    except Exception as e:
        print(f"Error inesperado en /sign_document: {e}")
        # import traceback
        # traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content=SigningResponse(
                message="Error interno del servidor en el servicio de firma.",
                error_details=str(e)
            ).model_dump(exclude_none=True)
        )
    finally:
        # 5. Limpiar archivos temporales
        if os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
                print(f"Directorio temporal limpiado: {temp_dir}")
            except Exception as e:
                print(f"Error al limpiar directorio temporal {temp_dir}: {e}")

# --- Para servir archivos estáticos de mock_storage (opcional, para pruebas locales) ---
from fastapi.staticfiles import StaticFiles
# Crea el directorio si no existe para que StaticFiles no falle al inicio
os.makedirs(os.path.join(os.path.dirname(__file__), "mock_storage"), exist_ok=True)
app.mount("/mock_storage", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "mock_storage")), name="mock_storage")


if __name__ == "__main__":
    import uvicorn
    # Nota: Uvicorn por defecto corre en 127.0.0.1. Si tu Next.js está en un contenedor Docker
    # o VM diferente, necesitarás correr FastAPI en 0.0.0.0
    # Ejemplo: uvicorn.run(app, host="0.0.0.0", port=8000)
    print("Iniciando servidor FastAPI en http://localhost:8000")
    print(f"Coloca tus certificados en: {CERTIFICATE_DIR}")
    print(f"Asegúrate de que PFX_FILE_PATH ({PFX_FILE_PATH}) y PFX_PASSPHRASE estén configurados si usas PFX.")
    print("Los documentos firmados (simulados) se guardarán en la carpeta 'python_signing_service/mock_storage/signed-documents'")
    print("Y serán accesibles (simuladamente) en http://localhost:8000/mock_storage/signed-documents/<nombre_archivo>")
    uvicorn.run(app, host="localhost", port=8000)
