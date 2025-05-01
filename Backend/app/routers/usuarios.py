from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import modelos

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/registrar")
def registrar_usuario(nombre: str, email: str, contrasena: str, db: Session = Depends(get_db)):
    usuario = modelos.Usuario(nombre=nombre, email=email, contrasena=contrasena)
    db.add(usuario)
    db.commit()
    return {"mensaje": "Usuario registrado exitosamente"}

@router.post("/login")
def login(email: str, contrasena: str, db: Session = Depends(get_db)):
    user = db.query(modelos.Usuario).filter_by(email=email, contrasena=contrasena).first()
    if not user:
        raise HTTPException(status_code=404, detail="Credenciales incorrectas")
    return {"mensaje": "Login exitoso", "usuario_id": user.id}
