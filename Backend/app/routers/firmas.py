from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import modelos
from datetime import datetime

router = APIRouter(prefix="/firmas", tags=["Firmas"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/firmar")
def firmar_documento(documento_id: int, usuario_id: int, db: Session = Depends(get_db)):
    firma = modelos.Firma(documento_id=documento_id, usuario_id=usuario_id, fecha_firma=datetime.utcnow(), estatus="firmado")
    db.add(firma)
    db.commit()
    return {"mensaje": "Documento firmado"}

@router.get("/pendientes/{usuario_id}")
def documentos_pendientes(usuario_id: int, db: Session = Depends(get_db)):
    firmas = db.query(modelos.Firma).filter_by(usuario_id=usuario_id, estatus="pendiente").all()
    return firmas
