# Importamos la nueva clase de almacenamiento
from onedrive_storage import OneDriveStorage

# Configuración para OneDrive (añadir al inicio del archivo)
ONEDRIVE_CONFIG = {
    'client_id': os.environ.get('ONEDRIVE_CLIENT_ID', ''),
    'client_secret': os.environ.get('ONEDRIVE_CLIENT_SECRET', ''),
    'tenant_id': os.environ.get('ONEDRIVE_TENANT_ID', ''),
    'scopes': ['https://graph.microsoft.com/.default']
}

# Inicializar el cliente de OneDrive (añadir después de la configuración)
onedrive_storage = None
if all([ONEDRIVE_CONFIG['client_id'], ONEDRIVE_CONFIG['client_secret'], ONEDRIVE_CONFIG['tenant_id']]):
    onedrive_storage = OneDriveStorage(ONEDRIVE_CONFIG)
    print("OneDrive storage initialized")
else:
    print("OneDrive configuration incomplete, using local storage")

# Modificar la ruta para subir archivos (reemplazar la función upload_file existente)
@app.route('/api/files/upload', methods=['POST'])
@token_required
def upload_file(payload):
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
        
    file = request.files['file']
    folder_id = request.form.get('folder_id', 1)  # Carpeta raíz por defecto
    
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    
    # Generar nombre único para el archivo
    filename = str(uuid.uuid4()) + os.path.splitext(file.filename)[1]
    
    # Guardar archivo temporalmente
    temp_file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(temp_file_path)
    
    try:
        # Obtener información de la carpeta
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute('SELECT name FROM folders WHERE id = %s', (folder_id,))
        folder = cur.fetchone()
        
        if not folder:
            os.remove(temp_file_path)
            return jsonify({'message': 'Folder not found'}), 404
        
        # Definir la ruta en OneDrive
        onedrive_folder_path = f"FirmaDigital/{folder['name']}"
        onedrive_file_path = f"{onedrive_folder_path}/{filename}"
        
        # Si estamos usando OneDrive, subir el archivo
        file_path = temp_file_path
        if onedrive_storage:
            try:
                # Asegurarse de que la carpeta existe
                try:
                    onedrive_storage.create_folder("FirmaDigital")
                except Exception:
                    pass  # La carpeta ya existe
                    
                try:
                    onedrive_storage.create_folder(onedrive_folder_path)
                except Exception:
                    pass  # La carpeta ya existe
                
                # Subir el archivo
                file_info = onedrive_storage.upload_file(temp_file_path, onedrive_file_path)
                file_path = onedrive_file_path  # Guardar la ruta de OneDrive
                
                # Eliminar el archivo temporal
                os.remove(temp_file_path)
            except Exception as e:
                print(f"Error uploading to OneDrive: {e}")
                # Si falla la subida a OneDrive, usamos almacenamiento local
                file_path = temp_file_path
        
        # Guardar información en la base de datos
        cur.execute('''
        INSERT INTO files (name, original_name, folder_id, uploaded_by, file_path, file_size, file_type, is_cloud_stored)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        ''', (
            filename,
            file.filename,
            folder_id,
            payload['sub'],
            file_path,
            os.path.getsize(temp_file_path) if os.path.exists(temp_file_path) else 0,
            file.content_type,
            onedrive_storage is not None
        ))
        
        file_id = cur.fetchone()['id']
        
        cur.close()
        conn.close()
        
        return jsonify({
            'message': 'File uploaded successfully',
            'file_id': file_id,
            'file_name': file.filename,
            'stored_in_cloud': onedrive_storage is not None
        })
    except Exception as e:
        # Si ocurre un error, eliminar el archivo temporal
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        return jsonify({'message': f'Error: {str(e)}'}), 500

# Modificar la función para firmar documentos
@app.route('/api/files/sign', methods=['POST'])
@token_required
def sign_document(payload):
    data = request.get_json()
    file_id = data.get('file_id')
    signature_type = data.get('signature_type', 'simple')
    
    if not file_id:
        return jsonify({'message': 'File ID is required'}), 400
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Verificar si el archivo existe
    cur.execute('SELECT * FROM files WHERE id = %s', (file_id,))
    file = cur.fetchone()
    
    if not file:
        cur.close()
        conn.close()
        return jsonify({'message': 'File not found'}), 404
    
    # Verificar si el usuario tiene permiso para firmar
    cur.execute('''
    SELECT * FROM pending_signatures 
    WHERE file_id = %s AND user_id = %s
    ''', (file_id, payload['sub']))
    
    pending = cur.fetchone()
    
    # Si no hay una firma pendiente y el usuario no es el propietario, no puede firmar
    if not pending and file['uploaded_by'] != payload['sub']:
        cur.close()
        conn.close()
        return jsonify({'message': 'Not authorized to sign this document'}), 403
    
    try:
        # Generar datos de firma
        timestamp = datetime.datetime.now().isoformat()
        signature_data = f"Firmado por ID: {payload['sub']} en {timestamp}"
        
        # Descargar el archivo si está en OneDrive
        temp_file_path = None
        is_cloud_stored = file.get('is_cloud_stored', False)
        
        if is_cloud_stored and onedrive_storage:
            # Descargar el archivo de OneDrive
            file_content = onedrive_storage.download_file(file['file_path'])
            temp_file_path = os.path.join(UPLOAD_FOLDER, f"temp_{file['name']}")
            with open(temp_file_path, 'wb') as f:
                f.write(file_content.getvalue())
            input_file_path = temp_file_path
        else:
            # El archivo está en almacenamiento local
            input_file_path = file['file_path']
        
        # Firmar el PDF
        signed_file_name = f"signed_{file['name']}"
        signed_file_path = os.path.join(UPLOAD_FOLDER, signed_file_name)
        
        # Firmar el PDF localmente
        sign_pdf(input_file_path, signature_data, signed_file_path)
        
        # Si estamos usando OneDrive, subir el archivo firmado
        final_file_path = signed_file_path
        if is_cloud_stored and onedrive_storage:
            # Extraer la carpeta del path original
            onedrive_folder = os.path.dirname(file['file_path'])
            onedrive_signed_path = f"{onedrive_folder}/{signed_file_name}"
            
            # Subir el archivo firmado
            onedrive_storage.upload_file(signed_file_path, onedrive_signed_path)
            final_file_path = onedrive_signed_path
            
            # Eliminar archivos temporales
            os.remove(temp_file_path)
            os.remove(signed_file_path)
        
        # Registrar la firma en la base de datos
        cur.execute('''
        INSERT INTO signatures (file_id, user_id, signature_data, signature_type)
        VALUES (%s, %s, %s, %s)
        RETURNING id
        ''', (file_id, payload['sub'], signature_data, signature_type))
        
        signature_id = cur.fetchone()['id']
        
        # Si había una firma pendiente, eliminarla
        if pending:
            cur.execute('DELETE FROM pending_signatures WHERE id = %s', (pending['id'],))
        
        # Actualizar la ruta del archivo al firmado
        cur.execute('''
        UPDATE files SET file_path = %s WHERE id = %s
        ''', (final_file_path, file_id))
        
        # Verificar si hay más firmas pendientes
        cur.execute('SELECT * FROM pending_signatures WHERE file_id = %s', (file_id,))
        remaining_signatures = cur.fetchall()
        
        # Notificar a los usuarios pendientes
        for signature in remaining_signatures:
            # Crear notificación
            cur.execute('''
            INSERT INTO notifications (user_id, message, type, file_id)
            VALUES (%s, %s, %s, %s)
            ''', (
                signature['user_id'],
                f"El documento {file['original_name']} ha sido firmado y requiere tu firma",
                'signature_request',
                file_id
            ))
            
            # Enviar correo electrónico (en una implementación real)
            # send_email_notification(signature['user_id'], file_id)
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'message': 'Document signed successfully',
            'signature_id': signature_id,
            'remaining_signatures': len(remaining_signatures)
        })
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        
        # Limpiar archivos temporales si existen
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            
        return jsonify({'message': f'Error signing document: {str(e)}'}), 500
