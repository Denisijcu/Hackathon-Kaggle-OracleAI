# routes/dashboard.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/status")
async def dashboard_status():
    return {"status": "dashboard module ready"}