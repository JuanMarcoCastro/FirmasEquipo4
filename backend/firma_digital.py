#LIBRERIAS
import sys #Accede a los argumentos desde la línea de comandos (gestiona archivos desde la terminal)
from pathlib import Path #Permite trabajar con rutas de archivos (utilizado para el pdf) (gestiona archivos desde la terminal)
from os.path import exists #Comprueba si existe un archivo (gestiona archivos desde la terminal)
from pyhanko.sign import signers #Permite firmar y verificar el PDF
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter #Permite editar el PDF
from pyhanko.pdf_utils.reader import PdfFileReader #Permite leer y analizar archivos PDF
from PyPDF2 import PdfReader, PdfWriter  #Permite manipular leer y escribir metadatos en el PDF

#FUNCIONES PARA LOS METADATOS

#Establece un límite de firmas en el PDF
def set_max_signers(pdf_path: str, max_signers: int):
    reader = PdfReader(pdf_path) #Abre el PDF
    writer = PdfWriter() #Crea un nuevo escritor de PDF para añadir metadatos
    for page in reader.pages: #Itera sobre las páginas del PDF original
        writer.add_page(page) #Copia las páginas del PDF original al nuevo escritor
    metadata = reader.metadata or {} #Extrae los metadatos del PDF original, si no existen, crea un diccionario vacío
    metadata.update({"/MaxSigners": str(max_signers)}) #Copia las páginas del PDF y añade un metadato personalizado (lo indica el usuario) siendo ahora el límite de firmas permitidas
    writer.add_metadata(metadata) #Guarda el PDF con ese metadato
    with open(pdf_path, "wb") as f: #Abre el PDF en modo escritura binaria
        writer.write(f) #Escribe el PDF con los metadatos actualizados
    print(f"🔐 Límite de firmas ({max_signers}) guardado en el PDF.") #Conformación de guardado

#Lanza un error si no encuentra ese dato
def get_max_signers(pdf_path: str) -> int:
    reader = PdfReader(pdf_path) #Lee los metadatos del PDF
    metadata = reader.metadata #Extrae los metadatos del PDF
    max_signers = metadata.get("/MaxSigners") #Analiza el metadato personalizado del PDF
    if max_signers is None: #Analiza si no existe el metadato
        raise ValueError("❌ El PDF no contiene un límite de firmas ('/MaxSigners').") #Si no existe el metadato lanza un error
    return int(max_signers) #Devuelve el límite de firmas permitido en el PDF

#FUNCIÓN PARA FIRMAR EL PDF

#Firma un PDF de forma in-place (modifica el PDF original directamente sin generar uno nuevo)
def sign_pdf_inplace(
    pdf_path: str, #Ruta al PDF que se quiere firmar (documento.pdf)
    key_path: str, #Ruta a la clave privada (key.pem)
    cert_path: str, #Ruta al certificado digital (cert.pem)
    ca_chain_paths: tuple = (), #Cadena de certificados intermedios
    passphrase: str = None, #Contraseña del archivo (key.pem)
    field_name: str = "Signature1" #Define metadatos de la firma (nombre del campo de firma)
) -> None:

    if not exists(pdf_path): #Comprueba si el PDF existe
        raise FileNotFoundError(f"PDF no encontrado: {pdf_path}") #Si no existe el PDF lanza un error
    if not exists(key_path): #Comprueba si la clave privada existe
        raise FileNotFoundError(f"Clave privada no encontrada: {key_path}") #Si no existe la clave privada lanza un error
    if not exists(cert_path): #Comprueba si el certificado existe
        raise FileNotFoundError(f"Certificado no encontrado: {cert_path}") #Si no existe el certificado lanza un error

    signer = signers.SimpleSigner.load( #Carga el firmante con la clave y el certificado
        key_path, #Carga la clave privada desde el archivo
        cert_path, #Carga el certificado desde el archivo
        ca_chain_files=ca_chain_paths, #Carga la cadena de certificados intermedios
        key_passphrase=passphrase.encode() if passphrase else None #Codifica la contraseña si se proporciona
    )

    metadata = signers.PdfSignatureMetadata( #Metadatos de la firma
        field_name=field_name #Define el nombre del campo de firma
    )

    pdf_signer = signers.PdfSigner( #Crea un firmante de PDF
        metadata, #Metadatos de la firma
        signer=signer #Firmante que contiene la clave y el certificado
    )

    with open(pdf_path, "r+b") as pdf_file: #Abre el PDF en modo lectura y escritura binaria
        writer = IncrementalPdfFileWriter(pdf_file) #Abre el PDF en modo lectura y escritura binaria
        pdf_signer.sign_pdf( #Firma el PDF
            writer, #Firma el PDF
            in_place=True, #Modifica el PDF original directamente
            output=pdf_file #Escribe los cambios en el mismo archivo
        )

#FUNCIÓN QUE VERIFICA LA FORMA EN EL PDF

#Verifica si hay firmas en el PDF y muestra información sobre ellas
def check_signatures(pdf_path: str) -> bool:
    if not exists(pdf_path): #Comprueba si el PDF existe
        print(f"Error: PDF no encontrado en la ruta: {pdf_path}") #Si no existe el PDF lanza un error
        return False

    try:
        with open(pdf_path, 'rb') as f: #Abre el PDF en modo lectura binaria
            reader = PdfFileReader(f) #Crea un lector de PDF
            signatures = reader.embedded_signatures #Extrae las firmas incrustadas del PDF
            if signatures: #Comprueba si hay firmas en el PDF
                print(f"✅ Se encontraron {len(signatures)} firma(s) en '{pdf_path}':") #Si hay firmas, muestra la cantidad de firmas encontradas
                for i, sig in enumerate(signatures): #Itera sobre las firmas encontradas
                    print(f"  Firma {i+1}:") #Muestra información sobre cada firma
                    print(f"    Campo de firma: {sig.field_name}") #Muestra el nombre del campo de firma
                return True
            else:
                print(f"⚠️ No se encontraron firmas en '{pdf_path}'.") #Si no hay firmas indica que no se encontraron firmas
                return False
    except Exception as e: #Analiza los errores que ocurran al intentar leer el PDF
        print(f"❌ Error al verificar el PDF '{pdf_path}': {e}") #Si ocurre un error al leer el PDF lanza un mensaje de error
        return False

#FUNCIÓN PRINCIPAL

#Codigo principal desde la terminal
if __name__ == "__main__":
    if len(sys.argv) < 4: #Comprueba si se han pasado suficientes argumentos
        print("Uso: python firma_digital.py <pdf> <key.pem> <cert.pem> [set_max <n>] [passphrase]") #Si no se han pasado suficientes argumentos lanza un mensaje de uso
        sys.exit(1) #Salir con error si no se pasan los argumentos necesarios

    pdf_file = sys.argv[1] #Ruta al PDF que se quiere firmar (documento.pdf)
    key_file = sys.argv[2] #Ruta a la clave privada (key.pem)
    cert_file = sys.argv[3] #Ruta al certificado digital (cert.pem)

    #Establece un límite de firmas
    if len(sys.argv) >= 6 and sys.argv[4] == "set_max":
        try: #Comprueba si se ha pasado el argumento "set_max"
            max_signers = int(sys.argv[5]) #Convierte el argumento a un entero
            set_max_signers(pdf_file, max_signers) #Establece el límite de firmas en el PDF
            sys.exit(0) #Salir con éxito si se establece el límite de firmas
        except Exception as e: #Analiza los errores que ocurran al intentar establecer el límite de firmas
            print(f"❌ Error al establecer el límite de firmas: {e}") #Si ocurre un error al establecer el límite de firmas lanza un mensaje de error
            sys.exit(1) #Salir con error si ocurre un error al establecer el límite de firmas

    pwd = sys.argv[4] if len(sys.argv) > 4 else None #Contraseña del archivo (key.pem) si se proporciona

    # Obtiene el límite de firmas desde el PDF
    try:
        max_signers = get_max_signers(pdf_file) #Obtiene el límite de firmas del PDF
    except Exception as e: #Analiza los errores que ocurran al intentar obtener el límite de firmas
        print(e) #Si ocurre un error al obtener el límite de firmas lanza un mensaje de error
        sys.exit(1) #Salir con error si ocurre un error al obtener el límite de firmas

    with open(pdf_file, 'rb') as f: #Abre el PDF en modo lectura binaria
        reader = PdfFileReader(f) #Crea un lector de PDF
        existing_signatures = reader.embedded_signatures #Extrae las firmas incrustadas del PDF
        current_count = len(existing_signatures) #Cuenta la cantidad de firmas existentes en el PDF

    if current_count >= max_signers: #Comprueba si la cantidad de firmas existentes es mayor o igual al límite de firmas
        print(f"⚠️ Ya hay {current_count} firma(s). No se permiten más de {max_signers}.") #Si la cantidad de firmas existentes es mayor o igual al límite de firmas lanza un mensaje de advertencia
        sys.exit(1) #Salir con error si la cantidad de firmas existentes es mayor o igual al límite de firmas

    try:
        next_field = f"Signature{current_count + 1}" #Define el nombre del campo de firma para la siguiente firma
        sign_pdf_inplace(pdf_file, key_file, cert_file, passphrase=pwd, field_name=next_field) #Firma el PDF con la clave y el certificado
        print(f"✅ PDF firmado exitosamente por el firmante {current_count + 1}: '{pdf_file}'") #Si la firma se realiza correctamente lanza un mensaje de éxito
    except Exception as e: #Analiza los errores que ocurran al intentar firmar el PDF
        print(f"❌ Error al firmar el PDF: {e}") #Si ocurre un error al firmar el PDF lanza un mensaje de error
        sys.exit(1) #Salir con error si ocurre un error al firmar el PDF

    print("🔍 Verificando firmas...") #Lanza un mensaje de verificación de firmas
    check_signatures(pdf_file) #Verifica las firmas en el PDF firmado