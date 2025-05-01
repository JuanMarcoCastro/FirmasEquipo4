from fastapi import FastAPI
from app.routers import firmas, usuarios

app = FastAPI(title="API Firma Digital")

app.include_router(firmas.router)
app.include_router(usuarios.router)

@app.get("/")
def root():
    return {"message": "API funcionando correctamente"}
