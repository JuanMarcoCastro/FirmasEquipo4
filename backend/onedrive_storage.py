import os
import requests
import msal
import time
from io import BytesIO

class OneDriveStorage:
    def __init__(self, config):
        """
        Inicializa el cliente de OneDrive con la configuración proporcionada.
        
        Args:
            config: Diccionario con la configuración de Azure AD
                - client_id: ID de la aplicación registrada en Azure AD
                - client_secret: Secreto de la aplicación
                - tenant_id: ID del inquilino de Azure AD
                - scopes: Permisos requeridos (ej. ['Files.ReadWrite.All'])
        """
        self.config = config
        self.access_token = None
        self.token_expires = 0
        self.app = msal.ConfidentialClientApplication(
            config['client_id'],
            authority=f"https://login.microsoftonline.com/{config['tenant_id']}",
            client_credential=config['client_secret']
        )
    
    def _get_token(self):
        """Obtiene un token de acceso para Microsoft Graph API."""
        now = time.time()
        
        # Si el token actual es válido, lo reutilizamos
        if self.access_token and self.token_expires > now + 60:
            return self.access_token
            
        # Obtenemos un nuevo token
        result = self.app.acquire_token_for_client(scopes=self.config['scopes'])
        
        if "access_token" in result:
            self.access_token = result['access_token']
            self.token_expires = now + result['expires_in']
            return self.access_token
        else:
            error_description = result.get("error_description", "No error description")
            raise Exception(f"Error al obtener token: {error_description}")
    
    def upload_file(self, file_path, destination_path):
        """
        Sube un archivo a OneDrive.
        
        Args:
            file_path: Ruta local del archivo
            destination_path: Ruta en OneDrive donde se guardará el archivo
            
        Returns:
            dict: Información del archivo subido
        """
        token = self._get_token()
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/octet-stream'
        }
        
        # Si el archivo es mayor a 4MB, usamos upload session
        file_size = os.path.getsize(file_path)
        
        if file_size <= 4 * 1024 * 1024:  # 4MB
            # Subida simple para archivos pequeños
            with open(file_path, 'rb') as file:
                url = f"https://graph.microsoft.com/v1.0/me/drive/root:/{destination_path}:/content"
                response = requests.put(url, headers=headers, data=file)
                
                if response.status_code in (200, 201):
                    return response.json()
                else:
                    raise Exception(f"Error al subir archivo: {response.text}")
        else:
            # Subida en sesión para archivos grandes
            url = f"https://graph.microsoft.com/v1.0/me/drive/root:/{destination_path}:/createUploadSession"
            response = requests.post(url, headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            })
            
            if response.status_code != 200:
                raise Exception(f"Error al crear sesión de subida: {response.text}")
                
            upload_url = response.json()['uploadUrl']
            
            # Subir en fragmentos de 10MB
            chunk_size = 10 * 1024 * 1024
            with open(file_path, 'rb') as file:
                chunk_number = 0
                while True:
                    chunk = file.read(chunk_size)
                    if not chunk:
                        break
                        
                    start = chunk_number * chunk_size
                    end = start + len(chunk) - 1
                    
                    headers = {
                        'Content-Length': str(len(chunk)),
                        'Content-Range': f'bytes {start}-{end}/{file_size}'
                    }
                    
                    response = requests.put(upload_url, headers=headers, data=chunk)
                    
                    if response.status_code not in (200, 201, 202):
                        raise Exception(f"Error al subir fragmento: {response.text}")
                        
                    if response.status_code in (200, 201):
                        return response.json()
                        
                    chunk_number += 1
    
    def download_file(self, file_path):
        """
        Descarga un archivo de OneDrive.
        
        Args:
            file_path: Ruta del archivo en OneDrive
            
        Returns:
            BytesIO: Contenido del archivo
        """
        token = self._get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        url = f"https://graph.microsoft.com/v1.0/me/drive/root:/{file_path}:/content"
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            return BytesIO(response.content)
        else:
            raise Exception(f"Error al descargar archivo: {response.text}")
    
    def delete_file(self, file_path):
        """
        Elimina un archivo de OneDrive.
        
        Args:
            file_path: Ruta del archivo en OneDrive
        """
        token = self._get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        url = f"https://graph.microsoft.com/v1.0/me/drive/root:/{file_path}"
        response = requests.delete(url, headers=headers)
        
        if response.status_code != 204:
            raise Exception(f"Error al eliminar archivo: {response.text}")
    
    def create_folder(self, folder_path):
        """
        Crea una carpeta en OneDrive.
        
        Args:
            folder_path: Ruta de la carpeta a crear
            
        Returns:
            dict: Información de la carpeta creada
        """
        token = self._get_token()
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Extraer el nombre de la carpeta y la ruta padre
        parts = folder_path.split('/')
        folder_name = parts[-1]
        parent_path = '/'.join(parts[:-1]) if len(parts) > 1 else ''
        
        if parent_path:
            url = f"https://graph.microsoft.com/v1.0/me/drive/root:/{parent_path}:/children"
        else:
            url = "https://graph.microsoft.com/v1.0/me/drive/root/children"
            
        data = {
            "name": folder_name,
            "folder": {},
            "@microsoft.graph.conflictBehavior": "rename"
        }
        
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code in (200, 201):
            return response.json()
        else:
            raise Exception(f"Error al crear carpeta: {response.text}")
    
    def list_files(self, folder_path=''):
        """
        Lista los archivos en una carpeta de OneDrive.
        
        Args:
            folder_path: Ruta de la carpeta
            
        Returns:
            list: Lista de archivos y carpetas
        """
        token = self._get_token()
        headers = {'Authorization': f'Bearer {token}'}
        
        if folder_path:
            url = f"https://graph.microsoft.com/v1.0/me/drive/root:/{folder_path}:/children"
        else:
            url = "https://graph.microsoft.com/v1.0/me/drive/root/children"
            
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            return response.json().get('value', [])
        else:
            raise Exception(f"Error al listar archivos: {response.text}")
