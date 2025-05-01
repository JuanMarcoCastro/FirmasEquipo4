from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Cambia los valores si usas otra contraseña o BD
DATABASE_URL = "postgresql://postgres:admin@localhost/firma_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()
