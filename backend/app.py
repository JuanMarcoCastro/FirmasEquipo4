from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
import uuid
from datetime import datetime, timedelta
import jwt
from functools import wraps
from pyhanko.sign import signers
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.sign.fields import SigFieldSpec
import tempfile
import requests
from msal import ConfidentialClientApplication

# Agregar estas líneas al archivo app.py existente, después de las importaciones
from utils.two_factor_auth import TwoFactorAuth
import secrets

app = Flask(__name__)
CORS(app)

# Configuración de la base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:password@localhost/casamonarca'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'casamonarca_secret_key'

db = SQLAlchemy(app)

# Modelos de la base de datos
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # admin, sub_admin, management, employer, public
    area = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(20), default='pending')  # active, pending, inactive
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    onedrive_id = db.Column(db.String(255), nullable=True)
    area = db.Column(db.String(50), nullable=False)
    uploaded_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, signed, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('documents', lazy=True))

class Signature(db.Model):
    __tablename__ = 'signatures'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = db.Column(db.String(36), db.ForeignKey('documents.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    signature_hash = db.Column(db.String(255), nullable=False)
    signed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    document = db.relationship('Document', backref=db.backref('signatures', lazy=True))
    user = db.relationship('User', backref=db.backref('signatures', lazy=True))

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # document, user, system
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('notifications', lazy=True))

# Agregar esta tabla al modelo de datos
class TwoFactorCode(db.Model):
    __tablename__ = 'two_factor_codes'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    code = db.Column(db.String(10), nullable=False)
    expiry_time = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('two_factor_codes', lazy=True))

# Función para verificar el token JWT
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
            
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
            
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
    
    return decorated

# Configuración de OneDrive
ONEDRIVE_CLIENT_ID = os.environ.get('ONEDRIVE_CLIENT_ID')
ONEDRIVE_CLIENT_SECRET = os.environ.get('ONEDRIVE_CLIENT_SECRET')
ONEDRIVE_TENANT_ID = os.environ.get('ONEDRIVE_TENANT_ID')
ONEDRIVE_AUTHORITY = f'https://login.microsoftonline.com/{ONEDRIVE_TENANT_ID}'
ONEDRIVE_SCOPE = ['https://graph.microsoft.com/.default']

# Función para obtener token de OneDrive
def get_onedrive_token():
    app = ConfidentialClientApplication(
        ONEDRIVE_CLIENT_ID,
        authority=ONEDRIVE_AUTHORITY,
        client_credential=ONEDRIVE_CLIENT_SECRET
    )
    
    result = app.acquire_token_for_client(scopes=ONEDRIVE_SCOPE)
    
    if "access_token" in result:
        return result['access_token']
    else:
        print(result.get("error"))
        print(result.get("error_description"))
        return None

# Función para subir archivo a OneDrive
def upload_to_onedrive(file_path, file_name):
    token = get_onedrive_token()
    
    if not token:
        return None
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/pdf'
    }
    
    with open(file_path, 'rb') as file:
        file_data = file.read()
    
    # Subir a OneDrive (carpeta Documents)
    url = f'https://graph.microsoft.com/v1.0/me/drive/root:/Documents/{file_name}:/content'
    response = requests.put(url, headers=headers, data=file_data)
    
    if response.status_code == 201 or response.status_code == 200:
        return response.json().get('id')
    else:
        print(f"Error uploading to OneDrive: {response.status_code}")
        print(response.text)
        return None

# Función para firmar PDF con pyHanko
def sign_pdf(input_path, output_path, signer_name):
    with open(input_path, 'rb') as in_file:
        pdf_writer = IncrementalPdfFileWriter(in_file)
        
        # Crear un firmante
        signer = signers.SimpleSigner.load_pkcs12(
            pfx_file='path/to/certificate.pfx',
            passphrase=b'password'
        )
        
        # Especificar campo de firma
        sig_field_spec = SigFieldSpec(
            sig_field_name=f'Signature_{uuid.uuid4().hex[:8]}',
            box=(100, 100, 500, 150)
        )
        
        # Firmar el PDF
        with open(output_path, 'wb') as out_file:
            signers.sign_pdf(
                pdf_writer,
                signature_meta=signers.PdfSignatureMetadata(
                    field_name=sig_field_spec.sig_field_name,
                    name=signer_name,
                    location='CasaMonarca'
                ),
                signer=signer,
                output=out_file
            )
    
    return output_path

# Rutas de la API
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing email or password'}), 400
        
    user = User.query.filter_by(email=data['email']).first()
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    if not user.check_password(data['password']):
        return jsonify({'message': 'Invalid password'}), 401
        
    if user.status != 'active':
        return jsonify({'message': 'User account is not active'}), 403
    
    # Generar token JWT
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'area': user.area
        }
    })

# Agregar estas rutas a la aplicación
@app.route('/api/auth/request-2fa', methods=['POST'])
def request_two_factor():
    data = request.get_json()
    
    if not data or not data.get('email'):
        return jsonify({'message': 'Missing email'}), 400
        
    user = User.query.filter_by(email=data['email']).first()
    
    if not user:
        # Por seguridad, no revelar que el usuario no existe
        return jsonify({'message': 'If the email exists, a verification code has been sent'}), 200
    
    # Generar y enviar código de verificación
    code, expiry_time = TwoFactorAuth.send_verification_code(user.email, user.name)
    
    # Guardar código en la base de datos
    two_factor = TwoFactorCode(
        user_id=user.id,
        code=code,
        expiry_time=expiry_time
    )
    
    db.session.add(two_factor)
    db.session.commit()
    
    # Generar token temporal para la sesión de verificación
    temp_token = secrets.token_urlsafe(32)
    
    return jsonify({
        'message': 'Verification code sent',
        'temp_token': temp_token,
        'expires_in': 300  # 5 minutos en segundos
    })

@app.route('/api/auth/verify-2fa', methods=['POST'])
def verify_two_factor():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('code'):
        return jsonify({'message': 'Missing required fields'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user:
        return jsonify({'message': 'Invalid verification'}), 401
    
    # Buscar el código más reciente para este usuario
    two_factor = TwoFactorCode.query.filter_by(user_id=user.id).order_by(TwoFactorCode.created_at.desc()).first()
    
    if not two_factor:
        return jsonify({'message': 'No verification code found'}), 401
    
    # Verificar el código
    if not TwoFactorAuth.verify_code(two_factor.code, data['code'], two_factor.expiry_time):
        return jsonify({'message': 'Invalid or expired code'}), 401
    
    # Eliminar el código usado
    db.session.delete(two_factor)
    db.session.commit()
    
    # Generar token JWT
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'area': user.area
        }
    })

@app.route('/api/users', methods=['GET'])
@token_required
def get_users(current_user):
    # Verificar si el usuario tiene permisos de administrador
    if current_user.role not in ['admin', 'sub_admin']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    users = User.query.all()
    
    output = []
    for user in users:
        user_data = {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'area': user.area,
            'status': user.status,
            'created_at': user.created_at.isoformat()
        }
        output.append(user_data)
    
    return jsonify({'users': output})

@app.route('/api/users', methods=['POST'])
@token_required
def create_user(current_user):
    # Verificar si el usuario tiene permisos de administrador
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('email') or not data.get('password') or not data.get('role'):
        return jsonify({'message': 'Missing required fields'}), 400
    
    # Verificar si el correo ya existe
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
    
    new_user = User(
        name=data['name'],
        email=data['email'],
        role=data['role'],
        area=data.get('area'),
        status='active' if current_user.role == 'admin' else 'pending'
    )
    
    new_user.set_password(data['password'])
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201

@app.route('/api/users/<user_id>', methods=['PUT'])
@token_required
def update_user(current_user, user_id):
    # Verificar si el usuario tiene permisos de administrador o es el propio usuario
    if current_user.role != 'admin' and current_user.id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    user = User.query.filter_by(id=user_id).first()
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    data = request.get_json()
    
    if data.get('name'):
        user.name = data['name']
    
    if data.get('area'):
        user.area = data['area']
    
    if data.get('role') and current_user.role == 'admin':
        user.role = data['role']
    
    if data.get('status') and current_user.role == 'admin':
        user.status = data['status']
    
    if data.get('password'):
        user.set_password(data['password'])
    
    db.session.commit()
    
    return jsonify({'message': 'User updated successfully'})

@app.route('/api/documents', methods=['GET'])
@token_required
def get_documents(current_user):
    # Filtrar documentos según el rol y área del usuario
    if current_user.role == 'admin':
        documents = Document.query.all()
    elif current_user.role == 'sub_admin':
        documents = Document.query.all()
    elif current_user.role == 'management':
        documents = Document.query.filter_by(area=current_user.area).all()
    else:
        documents = Document.query.filter(
            (Document.area == current_user.area) | 
            (Document.uploaded_by == current_user.id)
        ).all()
    
    output = []
    for document in documents:
        document_data = {
            'id': document.id,
            'name': document.name,
            'area': document.area,
            'status': document.status,
            'uploaded_by': document.user.name,
            'created_at': document.created_at.isoformat()
        }
        output.append(document_data)
    
    return jsonify({'documents': output})

@app.route('/api/documents', methods=['POST'])
@token_required
def upload_document(current_user):
    # Verificar si el usuario tiene permisos para subir documentos
    if current_user.role == 'public':
        return jsonify({'message': 'Unauthorized'}), 403
    
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    
    if not file.filename.endswith('.pdf'):
        return jsonify({'message': 'Only PDF files are allowed'}), 400
    
    # Guardar el archivo temporalmente
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, file.filename)
    file.save(file_path)
    
    # Subir a OneDrive
    onedrive_id = upload_to_onedrive(file_path, file.filename)
    
    # Crear registro en la base de datos
    new_document = Document(
        name=file.filename,
        file_path=file_path,
        onedrive_id=onedrive_id,
        area=request.form.get('area', current_user.area),
        uploaded_by=current_user.id
    )
    
    db.session.add(new_document)
    db.session.commit()
    
    # Crear notificaciones para los usuarios que deben firmar
    if request.form.get('signers'):
        signers = request.form.get('signers').split(',')
        
        for signer_id in signers:
            user = User.query.filter_by(id=signer_id).first()
            
            if user:
                notification = Notification(
                    user_id=user.id,
                    title='Documento pendiente de firma',
                    message=f'Tienes un documento pendiente de firma: {file.filename}',
                    type='document'
                )
                
                db.session.add(notification)
        
        db.session.commit()
    
    return jsonify({
        'message': 'Document uploaded successfully',
        'document_id': new_document.id
    }), 201

@app.route('/api/documents/<document_id>/sign', methods=['POST'])
@token_required
def sign_document(current_user, document_id):
    # Verificar si el usuario tiene permisos para firmar documentos
    if current_user.role == 'public':
        return jsonify({'message': 'Unauthorized'}), 403
    
    document = Document.query.filter_by(id=document_id).first()
    
    if not document:
        return jsonify({'message': 'Document not found'}), 404
    
    # Verificar si el usuario puede firmar este documento (según su área)
    if current_user.role != 'admin' and current_user.area != document.area:
        return jsonify({'message': 'Unauthorized to sign this document'}), 403
    
    # Verificar si el documento ya está firmado por este usuario
    existing_signature = Signature.query.filter_by(
        document_id=document_id,
        user_id=current_user.id
    ).first()
    
    if existing_signature:
        return jsonify({'message': 'Document already signed by this user'}), 400
    
    # Firmar el PDF
    output_path = os.path.join(
        os.path.dirname(document.file_path),
        f'signed_{os.path.basename(document.file_path)}'
    )
    
    signed_path = sign_pdf(document.file_path, output_path, current_user.name)
    
    # Generar hash de la firma
    signature_hash = generate_password_hash(f"{document_id}_{current_user.id}_{datetime.utcnow()}")
    
    # Crear registro de firma
    new_signature = Signature(
        document_id=document_id,
        user_id=current_user.id,
        signature_hash=signature_hash
    )
    
    db.session.add(new_signature)
    
    # Actualizar estado del documento si es necesario
    document.status = 'signed'
    
    # Subir documento firmado a OneDrive
    onedrive_id = upload_to_onedrive(
        signed_path,
        f'signed_{document.name}'
    )
    
    # Crear notificación para el propietario del documento
    if document.uploaded_by != current_user.id:
        notification = Notification(
            user_id=document.uploaded_by,
            title='Documento firmado',
            message=f'{current_user.name} ha firmado el documento: {document.name}',
            type='document'
        )
        
        db.session.add(notification)
    
    db.session.commit()
    
    return jsonify({'message': 'Document signed successfully'})

@app.route('/api/notifications', methods=['GET'])
@token_required
def get_notifications(current_user):
    notifications = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).all()
    
    output = []
    for notification in notifications:
        notification_data = {
            'id': notification.id,
            'title': notification.title,
            'message': notification.message,
            'type': notification.type,
            'read': notification.read,
            'created_at': notification.created_at.isoformat()
        }
        output.append(notification_data)
    
    return jsonify({'notifications': output})

@app.route('/api/notifications/<notification_id>/read', methods=['PUT'])
@token_required
def mark_notification_read(current_user, notification_id):
    notification = Notification.query.filter_by(id=notification_id, user_id=current_user.id).first()
    
    if not notification:
        return jsonify({'message': 'Notification not found'}), 404
    
    notification.read = True
    db.session.commit()
    
    return jsonify({'message': 'Notification marked as read'})

@app.route('/api/notifications/read-all', methods=['PUT'])
@token_required
def mark_all_notifications_read(current_user):
    Notification.query.filter_by(user_id=current_user.id, read=False).update({'read': True})
    db.session.commit()
    
    return jsonify({'message': 'All notifications marked as read'})

if __name__ == '__main__':
    # Crear las tablas en la base de datos
    with app.app_context():
        db.create_all()
        
        # Crear usuario administrador si no existe
        admin = User.query.filter_by(email='admin@casamonarca.com').first()
        if not admin:
            admin = User(
                name='Admin',
                email='admin@casamonarca.com',
                role='admin',
                area='Administración',
                status='active'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
    
    app.run(debug=True)
