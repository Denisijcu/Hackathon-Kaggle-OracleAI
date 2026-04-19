# routes/oracle.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/oracle", tags=["Oracle"])

# Este router está vacío porque tus endpoints ya están en main.py
# Solo lo necesitamos para que la importación no falle

@router.get("/ping")
async def ping():
    return {"status": "oracle router active"}
