from fastapi import APIRouter, File, UploadFile, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import base64
import cv2
import numpy as np
from datetime import datetime
import os
import json
import asyncio
from config import MODOS  # ✅ Agregar este import arriba
from typing import Optional

from dotenv import load_dotenv  # ✅ AGREGAR ESTO

load_dotenv()  # ✅ Y ESTO

try:
    from google_adapter import call_google_ai
    print("✅ [VISION] google_adapter importado OK:", call_google_ai)
except ImportError as e:
    print(f"❌ [VISION] ImportError: {e}")
    async def call_google_ai(*args, **kwargs):
        return {"error": "Adaptador no encontrado"}

router = APIRouter(prefix="/api/vision", tags=["Vision"])

# ✅ ESTADO GLOBAL DEL NÚCLEO
vision_state = {
    "active": False,
    "camera_id": 0,
    "detection_mode": "fall_detection",
    "alerts_sent": 0,
    "clients": set()
}

GOOGLE_API_KEY = os.getenv("GOOGLE_AI_API_KEY")
DEFAULT_MODEL_ID = "gemma-4-26b-a4b-it"


# ─────────────────────────────────────────────────────────────
# 🚶‍♂️ DETECTOR DE CAÍDAS (HARDENING MEDIAPIPE)
# ─────────────────────────────────────────────────────────────
class FallDetector:
    def __init__(self):
        self.mediapipe_available = False
        try:
            import mediapipe as mp
            self.mp_pose = mp.solutions.pose
            self.pose = self.mp_pose.Pose(
                static_image_mode=False,
                model_complexity=0,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            self.mediapipe_available = True
            print("✅ [SENTINEL] MediaPipe Engine Online")
        except Exception as e:
            print(f"⚠️ [SENTINEL] MediaPipe Offline: {e}")

    def detect(self, frame):
        if not self.mediapipe_available:
            return {"fall_detected": False, "confidence": 0}

        try:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose.process(rgb)
            if not results.pose_landmarks:
                return {"fall_detected": False, "confidence": 0}

            l = results.pose_landmarks.landmark
            shoulder_y = (l[11].y + l[12].y) / 2
            hip_y = (l[23].y + l[24].y) / 2

            is_falling = shoulder_y > hip_y
            return {
                "fall_detected": is_falling,
                "confidence": 0.9 if is_falling else 0
            }
        except:
            return {"fall_detected": False, "confidence": 0}

fall_detector = FallDetector()


# ─────────────────────────────────────────────────────────────
# 👁️ ENDPOINT DE ANÁLISIS (SENTINEL & PROTOCOLO DE DEFENSA)
# ─────────────────────────────────────────────────────────────
@router.post("/analyze")
async def vision_analyze(
    prompt: str = Query("Describe la escena"),
    modo: str = Query("community"),
    role: str = Query("parent"),
    lang: str = Query("es"),
    model_id: Optional[str] = Query(None),  # ✅ AGREGAR
    thinking: bool = Query(False), 
    file: UploadFile = File(...)
):
    try:
        # 1. Ingesta y Resize Táctico
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        h, w = img.shape[:2]
        img_resized = cv2.resize(img, (640, int(h * (640 / w))))
        _, buffer = cv2.imencode('.jpg', img_resized, [cv2.IMWRITE_JPEG_QUALITY, 80])
        encoded_image = base64.b64encode(buffer).decode("utf-8")

        # 2. ✅ Tomar system_prompt y params del config según el modo
        config = MODOS.get(modo, MODOS.get("community", {}))
        system_prompt = config.get("system_prompt", "")

        # 3. ✅ Messages con system_prompt + imagen + prompt
        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{encoded_image}"
                        }
                    },
                    {
                        "type": "text",
                        "text": f"[Rol: {role}] [Idioma: {lang}] {prompt}"
                    }
                ]
            }
        ]

        # 4. ✅ Llamada correcta al adaptador con params del config
        result = await call_google_ai(
            api_key=GOOGLE_API_KEY,
            model_id=model_id or DEFAULT_MODEL_ID,
            messages=messages,
            temperature=config.get("temperature", 0.3),
            max_tokens=config.get("max_tokens", 512),
            stop=config.get("stop", ["\n\n\n"]),
             thinking=thinking 
        )

        # 5. LÓGICA DE AMENAZAS SENTINEL (intacta)
        if "choices" in result:
            content = result["choices"][0]["message"]["content"]

            threat_keywords = [
                "arma", "intruso", "fuego", "peligro", "atracador",
                "mascara", "cuchillo", "encapuchado", "rostro cubierto",
                "agachado", "sospechoso"
            ]

            is_threat = any(word in content.lower() for word in threat_keywords)

            result["sentinel_analysis"] = {
                "alert_level": "CRITICAL" if is_threat else "NORMAL",
                "threat_detected": is_threat,
                "audio_trigger": is_threat,
                "timestamp": datetime.now().isoformat(),
                "ai_description": content
            }

            if is_threat:
                vision_state["alerts_sent"] += 1
                print(f"🚨 [SENTINEL ALERT]: {content}")

        # 🧹 Hardening de RAM
        del nparr, img, img_resized, buffer
        return result

    except Exception as e:
        print(f"❌ [VISION_ERROR]: {str(e)}")
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})


# ─────────────────────────────────────────────────────────────
# 🛰️ WEBSOCKET (DETECCIÓN DE CAÍDAS Y ALERTAS EN VIVO)
# ─────────────────────────────────────────────────────────────
@router.websocket("/ws/vision")
async def vision_websocket(websocket: WebSocket):
    await websocket.accept()
    vision_state["clients"].add(websocket)
    print(f"✅ [SENTINEL_WS] Cliente conectado. Total: {len(vision_state['clients'])}")

    try:
        while True:
            data = await websocket.receive_text()
            await asyncio.sleep(0.05)  # Freno de mano ~10 FPS

            try:
                frame_data = json.loads(data)
                if frame_data.get("type") == "frame":
                    img_bytes = base64.b64decode(frame_data["data"])
                    n_arr = np.frombuffer(img_bytes, np.uint8)
                    frame = cv2.imdecode(n_arr, cv2.IMREAD_COLOR)

                    if frame is not None:
                        fall_res = fall_detector.detect(frame)

                        if fall_res["fall_detected"]:
                            await websocket.send_json({
                                "type": "alert",
                                "event": "FALL_DETECTED",
                                "audio_trigger": True
                            })

                        await websocket.send_json({
                            "type": "detection",
                            "fall": fall_res["fall_detected"],
                            "timestamp": datetime.now().isoformat()
                        })

                    del n_arr, frame
            except:
                continue

    except WebSocketDisconnect:
        vision_state["clients"].discard(websocket)
        print("❌ [SENTINEL_WS] Cliente desconectado")


# ─────────────────────────────────────────────────────────────
# 🛠️ UTILIDADES
# ─────────────────────────────────────────────────────────────
@router.get("/status")
async def get_vision_status():
    return {
        "active": vision_state["active"],
        "alerts": vision_state["alerts_sent"],
        "clients_connected": len(vision_state["clients"]),
        "mediapipe": fall_detector.mediapipe_available
    }
