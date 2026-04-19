# routes/sentinel.py
from fastapi import APIRouter, HTTPException
from datetime import datetime
import psutil
import platform
import os



router = APIRouter(prefix="/api/sentinel", tags=["Sentinel"])

def get_system_metrics():
    """Obtiene métricas reales del sistema"""
    return {
        "cpu": {
            "percent": psutil.cpu_percent(interval=0.5),
            "cores": psutil.cpu_count(),
            "frequency": psutil.cpu_freq().current if psutil.cpu_freq() else None
        },
        "memory": {
            "percent": psutil.virtual_memory().percent,
            "total": psutil.virtual_memory().total,
            "available": psutil.virtual_memory().available,
            "used": psutil.virtual_memory().used
        },
        "disk": {
            "percent": psutil.disk_usage('/').percent,
            "total": psutil.disk_usage('/').total,
            "used": psutil.disk_usage('/').used,
            "free": psutil.disk_usage('/').free
        },
        "system": {
            "hostname": platform.node(),
            "os": platform.system(),
            "os_version": platform.release(),
            "architecture": platform.machine(),
            "python_version": platform.python_version()
        },
        "timestamp": datetime.now().isoformat()
    }

@router.get("/health")
async def health_check():
    """Endpoint básico de salud"""
    return {
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "version": "v4.1",
        "service": "VIC Sentinel"
    }

@router.get("/metrics")
async def get_metrics():
    """Obtiene métricas completas del sistema"""
    try:
        metrics = get_system_metrics()
        return {
            "status": "success",
            "data": metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ping")
async def ping():
    """Ping simple para verificar conectividad"""
    return {
        "pong": True,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/logs")
async def get_logs(limit: int = 50):
    """Obtiene logs del sistema (simulado o desde archivo)"""
    # Aquí puedes leer logs reales de un archivo
    logs = [
        {"timestamp": datetime.now().isoformat(), "level": "info", "message": "VIC Sentinel initialized"},
        {"timestamp": datetime.now().isoformat(), "level": "info", "message": f"CPU: {psutil.cpu_percent()}%"},
        {"timestamp": datetime.now().isoformat(), "level": "info", "message": f"RAM: {psutil.virtual_memory().percent}%"},
    ]
    return {"logs": logs[:limit]}

@router.get("/alerts")
async def get_alerts():
    """Obtiene alertas activas del sistema"""
    alerts = []
    
    # Verificar umbrales
    cpu = psutil.cpu_percent()
    memory = psutil.virtual_memory().percent
    disk = psutil.disk_usage('/').percent
    
    if cpu > 80:
        alerts.append({"severity": "high", "message": f"CPU usage critical: {cpu}%"})
    elif cpu > 60:
        alerts.append({"severity": "medium", "message": f"CPU usage high: {cpu}%"})
    
    if memory > 85:
        alerts.append({"severity": "high", "message": f"Memory usage critical: {memory}%"})
    elif memory > 70:
        alerts.append({"severity": "medium", "message": f"Memory usage high: {memory}%"})
    
    if disk > 85:
        alerts.append({"severity": "high", "message": f"Disk usage critical: {disk}%"})
    elif disk > 70:
        alerts.append({"severity": "medium", "message": f"Disk usage high: {disk}%"})
    
    return {"alerts": alerts, "count": len(alerts)}
