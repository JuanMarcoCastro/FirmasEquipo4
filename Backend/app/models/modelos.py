from sqlalchemy import Column, Integer, String, ForeignKey, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from app.db import Base

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True)
    nombre = Column(String)
    email = Column(String, unique=True)
    contrasena = Column(String)

    firmas = relationship("Firma", back_populates="usuario")

class Documento(Base):
    __tablename__ = "documentos"
    id = Column(Integer, primary_key=True)
    titulo = Column(String)
    contenido = Column(Text)
    fecha_subida = Column(TIMESTAMP)

    firmas = relationship("Firma", back_populates="documento")

class Firma(Base):
    __tablename__ = "firmas"
    id = Column(Integer, primary_key=True)
    documento_id = Column(Integer, ForeignKey("documentos.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    fecha_firma = Column(TIMESTAMP)
    estatus = Column(String)

    documento = relationship("Documento", back_populates="firmas")
    usuario = relationship("Usuario", back_populates="firmas")
