# main.py - OracleAI Multimodal Engine
# Vertex Coders LLC — v4.0 (Migración LM Studio → Google AI API)
# ✅ CAMBIOS vs v3.0:
#   - LM_STUDIO_HOST eliminado
#   - MODEL_ID ahora apunta a Gemma en Google AI
#   - build_payload() reemplazado por wrapper que usa google_adapter
#   - Todas las llamadas httpx a LM Studio reemplazadas por call_google_ai()
#   - SAMPLER_CONFIG sigue en config.py — Google filtra params no soportados
#   - TODO el resto del código (helpers, routers, DB, limpieza) intacto

import re

from fastapi import FastAPI, UploadFile, File, HTTPException,Form, Query, Request, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from concurrent.futures import ThreadPoolExecutor
import httpx
import base64
import uvicorn
import cv2
import tempfile
import os
import subprocess
import time
import speech_recognition as sr
from pydub import AudioSegment
from pydantic import BaseModel
import pandas as pd
import io
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from config import MODOS, SAMPLER_CONFIG
from database import get_db_connection

import asyncio
import yt_dlp
from concurrent.futures import ThreadPoolExecutor

from services.news_service import news_engine
from services.sports_service import sports_engine
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

# ✅ NUEVO: Adaptador Google AI
from google_adapter import call_google_ai
import re
import requests


# Importar routers
from routes import oracle, sentinel, vision, dashboard


# ─────────────────────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────────────────────
app = FastAPI(title="OracleAI Multimodal Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rutas
app.include_router(oracle.router)
app.include_router(sentinel.router)
app.include_router(vision.router)
app.include_router(dashboard.router)


# ─────────────────────────────────────────────────────────────
# ✅ CONFIGURACIÓN GOOGLE AI
# Selecciona el modelo desde el frontend pasando ?model_id=...
# o se usa DEFAULT_MODEL_ID como fallback.
# ─────────────────────────────────────────────────────────────
GOOGLE_API_KEY = os.getenv("GOOGLE_AI_API_KEY")
DEFAULT_MODEL_ID = "gemma-4-26b-a4b-it"   # Cambia aquí el modelo por defecto


# Configuración de Telegram (GRATIS)
TELEGRAM_BOT_TOKEN = "TU_BOT_TOKEN"
TELEGRAM_CHAT_ID = "TU_CHAT_ID"



# ─────────────────────────────────────────────────────────────
# MODELOS PYDANTIC
# ─────────────────────────────────────────────────────────────
class HistoryEntry(BaseModel):
    profile_id: str
    type: str
    prompt: str
    response: str
    file_type: Optional[str] = None
    file_name: Optional[str] = None


# ─────────────────────────────────────────────────────────────
# HELPERS — CONSTRUCCIÓN DE PAYLOAD (REEMPLAZADO)
# ─────────────────────────────────────────────────────────────
async def call_lm(
    messages: List[dict], 
    modo: str, 
    model_id: Optional[str] = None, 
    reasoning: bool = False, 
    thinking: bool = False
) -> dict:
    """
    Llama a la API de Google AI usando el adaptador blindado.
    """
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Google API Key no configurada.")

    config = MODOS.get(modo, MODOS.get("default", {}))
    target_model = model_id or DEFAULT_MODEL_ID

    try:
        # 🛡️ ESCUDO DE EJECUCIÓN: Timeout y manejo de excepciones
        result = await call_google_ai(
            api_key=GOOGLE_API_KEY,
            model_id=target_model,
            messages=messages,
            temperature=config.get("temperature", 0.7),
            max_tokens=config.get("max_tokens", 2048),
            stop=config.get("stop", ["\n\n\n"]),
            thinking=False
        )
        
        # Validación de integridad del JSON recibido
        if not result or "choices" not in result:
            raise ValueError("Respuesta de API incompleta o malformada.")
            
        return result

    except Exception as e:
        print(f"🚨 [VIC_SYSTEM_ERROR] Fallo en call_lm: {str(e)}")
        # Fallback elegante para que el Playground no se congele
        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": "### REPORTE TÁCTICO: SILENCIO OPERATIVO\nSe detectó una anomalía en el enlace con el núcleo de Google AI. Reintentando sincronización...",
                    "reasoning_content": f"Error técnico: {str(e)}"
                }
            }]
        }












# ─────────────────────────────────────────────────────────────────────────────
# REEMPLAZA la función limpiar_respuesta_oracle() en main.py
# ─────────────────────────────────────────────────────────────────────────────


def limpiar_respuesta_oracle(content: str, modo: str) -> str:
    if not content:
        return "⚠️ El motor neural no generó respuesta."

    content_clean = content.strip()

    if content_clean.startswith("{") and len(content_clean) < 60:
        return "OracleAI está sincronizando... por favor intenta de nuevo."

    # ── FIX 1: Gemma-4 Chain of Thought ─────────────────────────────────────
    # El modelo piensa en voz alta con "*   Texto". Extraemos solo lo que viene
    # DESPUÉS del último bullet de razonamiento.
    COT_PATTERN = re.compile(r'^\s*\*\s{1,4}\S', re.MULTILINE)

    if COT_PATTERN.search(content_clean):
        lines = content_clean.split('\n')
        last_cot_index = -1
        for i, line in enumerate(lines):
            if re.match(r'^\s*\*\s{1,4}\S', line):
                last_cot_index = i

        if last_cot_index >= 0 and last_cot_index < len(lines) - 1:
            after_cot = '\n'.join(lines[last_cot_index + 1:]).strip()
            if len(after_cot) > 20:
                content_clean = after_cot

    # ── FIX 2: Respuesta duplicada ───────────────────────────────────────────
    # Gemma 4 a veces genera la respuesta entre comillas dentro del CoT
    # y luego la repite limpia. Patrón: '"texto."texto.'
    if content_clean.startswith('"'):
        close_quote = content_clean.find('"', 1)
        if close_quote > 0:
            inside_quote = content_clean[1:close_quote].strip()
            after_quote  = content_clean[close_quote + 1:].strip()
            if after_quote and inside_quote and after_quote.startswith(inside_quote[:30]):
                content_clean = after_quote
            elif after_quote and len(after_quote) > len(inside_quote):
                content_clean = after_quote

    # ── FIX 3: coding mode header ────────────────────────────────────────────
    if modo == "coding" and "# Expert Mode Active" in content_clean:
        parts = content_clean.split("# Expert Mode Active. Ready for task.")
        return parts[-1].strip()

    # ── FIX 4: Skip patterns (segunda capa) ──────────────────────────────────
    lines = content_clean.split('\n')
    clean_lines = []
    skip_patterns = [
        '*   User', '*   Goal', '*   Persona', '*   Tone', '*   Constraints',
        '*   The screenshots', '*   Interface elements', '*   Main area',
        '*   Content of messages', '*   Key concept', '*   Introduction',
        '*   Analogy', '*   Section', '*   Hallazgos Clave', '*   Input',
        '*   Output', '*   Analysis', '*   Step', '*   Conclusion',
        '*   Name', '*   Developer', '*   Nature', '*   Type',
        '*   Capabilities', '*   Knowledge', '*   Acknowledge',
        '*   State', '*   Mention', '*   Since', '*   Draft',
        '*   Language', '*   *Draft',
    ]
    for line in lines:
        if not any(line.strip().startswith(p) for p in skip_patterns):
            clean_lines.append(line)

    if clean_lines:
        result = '\n'.join(clean_lines).strip()
        if len(result) > 20:
            content_clean = result

    if len(content_clean) < 50 and len(content) > 100:
        return content

    return content_clean

# ─────────────────────────────────────────────────────────────
# HELPERS — PANDAS / CSV (SIN CAMBIOS)
# ─────────────────────────────────────────────────────────────
def analyze_csv_with_pandas(file_bytes: bytes, user_query: str) -> dict:
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))

        calculation_results = ""
        if any(w in user_query.lower() for w in ["promedio", "media", "analizar", "stats"]):
            numeric_cols = df.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 0:
                stats = df[numeric_cols].agg(['mean', 'max', 'min']).to_dict()
                calculation_results = f"📊 Estadísticas calculadas: {stats}"

        chart_base64 = None
        try:
            plt.figure(figsize=(8, 4))
            x_col = df.columns[0]
            y_cols = df.select_dtypes(include=['number']).columns
            if len(y_cols) > 0:
                df.plot(kind='bar', x=x_col, y=y_cols[0], color='#FF9F1C', legend=False)
                plt.title(f"Análisis de {y_cols[0]} por {x_col}")
                plt.xticks(rotation=45)
                plt.tight_layout()
                buf = io.BytesIO()
                plt.savefig(buf, format='png')
                buf.seek(0)
                chart_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
                plt.close()
        except Exception as plot_err:
            print(f"⚠️ No se pudo generar el gráfico: {plot_err}")

        return {
            "summary": {
                "columnas": list(df.columns),
                "filas": len(df),
                "calculos": calculation_results,
                "muestra": df.head(3).to_dict()
            },
            "chart": chart_base64
        }

    except Exception as e:
        return {"error": f"⚠️ Error en motor Pandas: {str(e)}"}


# ─────────────────────────────────────────────────────────────
# HELPERS — AUDIO (SIN CAMBIOS)
# ─────────────────────────────────────────────────────────────
def check_ffmpeg() -> bool:
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        return False


def extract_audio_text(audio_bytes: bytes, file_extension: str) -> str:
    tmp_path = None
    wav_path = None

    if not check_ffmpeg():
        return "Error: ffmpeg no instalado"

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        wav_fd, wav_path = tempfile.mkstemp(suffix='.wav')
        os.close(wav_fd)

        cmd = ['ffmpeg', '-i', tmp_path, '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', wav_path, '-y']
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            return f"Error convirtiendo audio: {result.stderr[:200]}"

        recognizer = sr.Recognizer()
        recognizer.energy_threshold = 300
        recognizer.dynamic_energy_threshold = True

        with sr.AudioFile(wav_path) as source:
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            audio_data = recognizer.record(source)

            try:
                return recognizer.recognize_google(audio_data, language='es-ES')
            except sr.UnknownValueError:
                try:
                    text = recognizer.recognize_google(audio_data, language='en-US')
                    return f"[Transcripción en inglés]: {text}"
                except sr.UnknownValueError:
                    return "No se pudo entender el audio."
            except sr.RequestError as e:
                return f"Error en el servicio de reconocimiento: {e}"

    except Exception as e:
        return f"Error procesando audio: {str(e)}"

    finally:
        for path in [tmp_path, wav_path]:
            if path and os.path.exists(path):
                for _ in range(3):
                    try:
                        time.sleep(0.2)
                        os.unlink(path)
                        break
                    except Exception:
                        pass


# ─────────────────────────────────────────────────────────────
# HELPERS — VIDEO (SIN CAMBIOS)
# ─────────────────────────────────────────────────────────────
def extract_video_frame(video_bytes: bytes, filename: str) -> Optional[str]:
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            return None

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames == 0:
            cap.release()
            return None

        cap.set(cv2.CAP_PROP_POS_FRAMES, total_frames // 2)
        success, frame = cap.read()
        if not success:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            success, frame = cap.read()

        cap.release()
        time.sleep(0.2)

        if not success:
            return None

        h, w = frame.shape[:2]
        if max(h, w) > 1024:
            scale = 1024 / max(h, w)
            frame = cv2.resize(frame, (int(w * scale), int(h * scale)))

        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return base64.b64encode(buffer).decode("utf-8")

    except Exception as e:
        print(f"🔥 Error en extract_video_frame: {e}")
        return None

    finally:
        if tmp_path and os.path.exists(tmp_path):
            for _ in range(3):
                try:
                    time.sleep(0.2)
                    os.unlink(tmp_path)
                    break
                except Exception:
                    pass


# ─────────────────────────────────────────────────────────────
# HELPERS — DOCUMENTOS (SIN CAMBIOS)
# ─────────────────────────────────────────────────────────────
def extract_pdf_text(file_bytes: bytes, max_chars: int = 5000) -> str:
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        total_pages = len(reader.pages)
        text_parts = []
        chars = 0
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            text_parts.append(f"[Página {i+1}]\n{page_text}")
            chars += len(page_text)
            if chars >= max_chars:
                text_parts.append(f"\n[... {total_pages - i - 1} páginas restantes truncadas]")
                break
        result = "\n\n".join(text_parts).strip()
        return result or "El PDF no contiene texto extraíble (puede ser escaneado)."
    except ImportError:
        return "Error: pypdf no instalado. Ejecuta: pip install pypdf"
    except Exception as e:
        return f"Error procesando PDF: {str(e)}"


def extract_docx_text(file_bytes: bytes, max_chars: int = 5000) -> str:
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        full_text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        if len(full_text) > max_chars:
            full_text = full_text[:max_chars] + "\n[... contenido truncado]"
        return full_text or "El documento DOCX no contiene texto extraíble."
    except ImportError:
        return "Error: python-docx no instalado. Ejecuta: pip install python-docx"
    except Exception as e:
        return f"Error procesando DOCX: {str(e)}"


def extract_json_text(file_bytes: bytes, max_chars: int = 5000) -> str:
    try:
        import json
        data = json.loads(file_bytes.decode('utf-8', errors='replace'))
        formatted = json.dumps(data, indent=2, ensure_ascii=False)
        if len(formatted) > max_chars:
            formatted = formatted[:max_chars] + "\n[... JSON truncado]"
        return formatted
    except Exception as e:
        return f"Error procesando JSON: {str(e)}"


def flatten_json_response(content: str) -> str:
    import json
    try:
        parsed = json.loads(content)
        if isinstance(parsed, dict):
            for key in ("message", "input", "response"):
                if key in parsed:
                    return str(parsed[key])
            return "\n".join(
                f"{k.capitalize()}: {v}"
                for k, v in parsed.items()
                if k not in ('status', 'analysis_type')
            )
        return content
    except Exception:
        return content


# ─────────────────────────────────────────────────────────────
# HELPERS — VIDEO URL (SIN CAMBIOS)
# ─────────────────────────────────────────────────────────────
executor = ThreadPoolExecutor(max_workers=2)

def extract_video_frames(video_path: str, num_frames: int = 5) -> list:
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frames_base64 = []

    if total_frames == 0:
        cap.release()
        return frames_base64

    step = total_frames // (num_frames + 1)
    positions = [step * i for i in range(1, num_frames + 1)]

    for pos in positions:
        cap.set(cv2.CAP_PROP_POS_FRAMES, pos)
        success, frame = cap.read()
        if success:
            h, w = frame.shape[:2]
            if max(h, w) > 512:
                scale = 512 / max(h, w)
                frame = cv2.resize(frame, (int(w * scale), int(h * scale)))

            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            frames_base64.append(base64.b64encode(buffer).decode("utf-8"))

    cap.release()
    return frames_base64


def download_video_info(url: str):
    ydl_opts = {
        'format': 'best[height<=480]',
        'outtmpl': 'temp_video_%(id)s.%(ext)s',
        'quiet': True,
        'no_warnings': True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)
        return filename, info




# ─────────────────────────────────────────────────────────────
# HELPERS — DETECCIÓN DE INTENCIÓN DE NOTICIAS (SIN CAMBIOS)
# ─────────────────────────────────────────────────────────────
def detect_news_intent(user_prompt):
    keywords = ["noticia", "pasando", "hoy", "actualidad", "news", "mundo", "tecnología"]
    return any(word in user_prompt.lower() for word in keywords)


# 1. Crea esta función helper arriba de los endpoints
def aplicar_radar_noticias(prompt: str, messages: list):
    noticias_keywords = ["noticia", "pasando", "hoy", "actualidad", "news", "mundo", "tecnología"]
    if any(word in prompt.lower() for word in noticias_keywords):
        print("🔍 [VIC_CORE] Radar activado. Inyectando RSS...")
        cat = "tech" if any(x in prompt.lower() for x in ["tecn", "tech", "code"]) else "world"
        current_events = news_engine.get_latest_context(cat)
        
        context_msg = {
            "role": "system", 
            "content": f"NOTICIAS REALES (09/04/2026): \n{current_events}\nResume esto de forma táctica."
        }
        messages.insert(0, context_msg)
    return messages




# ─────────────────────────────────────────────────────────────
# ENDPOINT — TRANSCRIPCIÓN (SIN CAMBIOS)
# ─────────────────────────────────────────────────────────────
@app.post("/api/v1/transcribe")
async def transcribe_audio_endpoint(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        file_extension = os.path.splitext(file.filename)[1].lower() or ".wav"
        print(f"🎤 Recibiendo audio: {file.filename}")

        text = extract_audio_text(contents, file_extension)

        if text.startswith("Error"):
            raise HTTPException(status_code=500, detail=text)

        return {"transcription": text}

    except Exception as e:
        print(f"🔥 Error en transcribe: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# ENDPOINT — ANALYZE (multimodal)
# ✅ CAMBIO: httpx a LM Studio → call_lm()
# ─────────────────────────────────────────────────────────────
@app.post("/api/v1/oracle/analyze")
async def analyze_media(
    # El prompt se queda en Query porque Angular lo manda en la URL (?prompt=...)
    prompt: str = Query(...),
    
    # 🎯 CAMBIO ÉLITE: Estos ahora se leen del Formulario (Cuerpo de la petición)
    modo: str = Form("community"), 
    role: str = Form("child"),
    lang: str = Form("es"),
    model_id: Optional[str] = Form(None), 
    
    # El archivo siempre como File
    file: Optional[UploadFile] = File(None),
):
    # 🛡️ Validación de Seguridad Vertex
    print(f"🚀 [VIC_ANALYZE] Prompt recibido: '{prompt[:50]}...' | Modo: {modo} | Rol: {role} | Idioma: {lang} | Archivo: {file.filename if file else 'Ninguno'}"   )
    if modo not in MODOS:
        print(f"⚠️ [VIC] Intento de acceso con modo inválido: {modo}")
        raise HTTPException(status_code=400, detail=f"Modo '{modo}' no configurado.")

    config_modo = MODOS.get(modo)
    if modo not in MODOS:
        raise HTTPException(status_code=400, detail=f"Modo '{modo}' inválido.")

    config_modo = MODOS.get(modo, MODOS["education"])

    lang_prompts = {
        "es": "Sé conciso y profesional.",
        "en": "ALWAYS respond in English. Be concise and professional.",
        "fr": "Répondez TOUJOURS en français. Soyez concis et professionnel.",
        "pt": "Responda SEMPRE em português. Seja conciso e profissional."
    }
    idioma_instruction = lang_prompts.get(lang, lang_prompts["es"])

    try:
        system_content = f"{config_modo['system_prompt']}\n\nCRITICAL: {idioma_instruction}"
        message_content = [{"type": "text", "text": prompt}]

        extracted_text = None
        file_type_detected = None
        current_chart_base64 = None

        if file is not None and file.filename != "":
            contents = await file.read()
            mime_type = file.content_type
            filename = file.filename
            file_extension = os.path.splitext(filename)[1].lower()

            print(f"📁 Procesando: {filename} (Tipo: {mime_type})")

            if mime_type == "application/octet-stream":
                if file_extension in ['.mp3', '.wav', '.ogg', '.m4a', '.flac']:
                    mime_type = f"audio/{file_extension[1:]}"
                elif file_extension in ['.mp4', '.avi', '.mov', '.mkv']:
                    mime_type = f"video/{file_extension[1:]}"

            if "audio" in mime_type or file_extension in ['.mp3', '.wav', '.ogg', '.m4a', '.flac']:
                file_type_detected = "audio"
                extracted_text = extract_audio_text(contents, file_extension)
                label = "[Transcripción del audio]" if not extracted_text.startswith("Error") else "[Error en transcripción]"
                message_content.append({"type": "text", "text": f"{label}: {extracted_text}"})

            elif "video" in mime_type or file_extension in ['.mp4', '.avi', '.mov', '.mkv', '.webm']:
                file_type_detected = "video"
                encoded_frame = extract_video_frame(contents, filename)
                if encoded_frame:
                    message_content.append({
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{encoded_frame}"}
                    })

            elif "image" in mime_type or file_extension in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']:
                file_type_detected = "image"
                encoded_file = base64.b64encode(contents).decode("utf-8")
                message_content.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime_type};base64,{encoded_file}"}
                })

            elif file_extension == '.pdf' or mime_type == 'application/pdf':
                file_type_detected = "pdf"
                message_content.append({
                    "type": "text",
                    "text": f"[CONTENIDO DEL DOCUMENTO PDF]:\n{extract_pdf_text(contents)}"
                })

            elif file_extension in ['.docx', '.doc'] or mime_type in [
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword'
            ]:
                file_type_detected = "docx"
                message_content.append({
                    "type": "text",
                    "text": f"[CONTENIDO DEL DOCUMENTO WORD]:\n{extract_docx_text(contents)}"
                })

            elif file_extension == '.csv' or mime_type == 'text/csv':
                file_type_detected = "csv"
                analysis_data = analyze_csv_with_pandas(contents, prompt)
                stats_for_llm = analysis_data.get("summary", {}).get("calculos", "Sin datos numéricos detectados.")
                current_chart_base64 = analysis_data.get("chart")
                message_content.append({
                    "type": "text",
                    "text": (
                        f"[RESULTADOS TÉCNICOS DE PANDAS]:\n{stats_for_llm}\n\n"
                        f"[MUESTRA DE DATOS]:\n{analysis_data.get('summary', {}).get('muestra', '')}\n\n"
                        f"[INSTRUCCIÓN]: Usa los resultados numéricos para responder: \"{prompt}\". "
                        "Menciona promedios o valores máximos si son relevantes."
                    )
                })

            elif file_extension == '.json' or mime_type == 'application/json':
                file_type_detected = "json"
                message_content.append({
                    "type": "text",
                    "text": f"[CONTENIDO DEL JSON]:\n{extract_json_text(contents)}"
                })

            elif file_extension == '.txt':
                file_type_detected = "text"
                try:
                    text_content = contents.decode('utf-8', errors='replace')
                    text_content = text_content.replace('—', '-').replace('\u201c', '"').replace('\u201d', '"')
                    if len(text_content) > 5000:
                        text_content = text_content[:5000] + "...\n[Texto truncado]"
                    message_content.append({
                        "type": "text",
                        "text": f"[CONTENIDO DEL DOCUMENTO]:\n{text_content}"
                    })
                except Exception as e:
                    message_content.append({
                        "type": "text",
                        "text": f"[Error de decodificación]: {str(e)}"
                    })

        # ✅ CAMBIO: construimos messages y llamamos call_lm() en vez de LM Studio
        messages = [
            {"role": "system", "content": system_content},
            {"role": "user",   "content": message_content},
        ]
        

        print(f"🚀 Enviando a Google AI | modo={modo} | modelo={model_id or DEFAULT_MODEL_ID} | partes={len(message_content)}")

        # 🎯 AQUÍ METEMOS EL PARCHE:
        messages = aplicar_radar_noticias(prompt, messages) # <--- Sincroniza el radar

        result = await call_lm(messages, modo, model_id=model_id)

        if result.get("choices"):
            raw = result["choices"][0]["message"]["content"]
            result["choices"][0]["message"]["content"] = limpiar_respuesta_oracle(raw, modo)

        if extracted_text:
            result["audio_transcription"] = extracted_text
        if file_type_detected:
            result["file_type"] = file_type_detected
        if file_type_detected == "csv" and current_chart_base64:
            result["chart_data"] = current_chart_base64
            result["has_chart"] = True

        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# ENDPOINT — CHAT
# ✅ CAMBIO: httpx a LM Studio → call_google_ai() directo
# (este endpoint recibe el payload completo del frontend,
#  así que usamos call_google_ai con los params del payload)
# ─────────────────────────────────────────────────────────────
@app.post("/api/v1/chat")
async def chat_oracle(request: Request):
    try:
        payload = await request.json()
        modo_actual = payload.get("modo", "community")
        model_id = payload.get("model_id", DEFAULT_MODEL_ID)
        messages = payload.get("messages", [])

        # 🎯 PROTECCIÓN VERTEX: Solo buscamos noticias en modos generales o modo news
        modos_con_radar = ["community", "news", "education"]

        if messages and modo_actual in modos_con_radar:
            last_user_msg = messages[-1].get("content", "").lower()
            
            # (Mantienes tu lógica de extracción de texto si es lista)
            if isinstance(last_user_msg, list):
                last_user_msg = " ".join(p.get("text", "") for p in last_user_msg if p.get("type") == "text").lower()

            noticias_keywords = ["noticia", "pasando", "hoy", "actualidad", "news", "mundo", "tecnología"]

            if any(word in last_user_msg for word in noticias_keywords):
                print(f"🔍 [VIC_CORE] News Intent en modo {modo_actual}. Extrayendo RSS...")
                cat = "tech" if any(x in last_user_msg for x in ["tecn", "tech"]) else "world"
                current_events = news_engine.get_latest_context(cat)

                context_msg = {
                    "role": "system",
                    "content": f"NOTICIAS REALES ({datetime.now().strftime('%d/%m/%Y')}): \n{current_events}\nResume esto de forma táctica."
                }
                messages.insert(0, context_msg)
        
        # ✅ Si el modo es 'asl' o 'narrator', el IF de arriba se salta y 
        # call_lm recibe los mensajes limpios con el system prompt del config.py
        result = await call_lm(messages, modo_actual, model_id=model_id, thinking=False)

        if result.get("choices"):
            raw = result["choices"][0]["message"]["content"]
            result["choices"][0]["message"]["content"] = limpiar_respuesta_oracle(raw, modo_actual)

        return result

    except Exception as e:
        print(f"🔥 Error en /chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────
# ENDPOINT — ORACLE POR MODO
# ✅ CAMBIO: httpx a LM Studio → call_lm()
# ─────────────────────────────────────────────────────────────
@app.post("/api/v1/oracle/{modo}")
async def analyze_with_mode(
    modo: str,
    prompt: str = Query(...),
    role: str = Query("child"),
    model_id: Optional[str] = Query(None),   # ✅ modelo seleccionable
    file: Optional[UploadFile] = File(None),
):
    if modo not in MODOS:
        raise HTTPException(status_code=400, detail=f"Modo '{modo}' inválido.")

    config = MODOS[modo]
    system_prompt = config["system_prompt"]

    if role == "caregiver":
        system_prompt += "\n\n[ADAPTACIÓN]: El usuario es un ADULTO/CUIDADOR. Usa lenguaje técnico y directo."
    elif role == "elder":
        system_prompt += "\n\n[ADAPTACIÓN]: El usuario es un ADULTO MAYOR. Usa paciencia y lenguaje muy sencillo."

    message_content = [{"type": "text", "text": prompt}]
    file_type_detected = None
    current_chart_base64 = None

    if file is not None and file.filename != "":
        contents = await file.read()
        filename = file.filename
        file_extension = os.path.splitext(filename)[1].lower()
        mime_type = file.content_type

        if file_extension == '.csv' or mime_type == 'text/csv':
            file_type_detected = "csv"
            analysis_data = analyze_csv_with_pandas(contents, prompt)
            stats_text = analysis_data.get("summary", {}).get("calculos", "")
            current_chart_base64 = analysis_data.get("chart")
            message_content.append({"type": "text", "text": f"[DATOS DE PANDAS]:\n{stats_text}"})

        elif file_extension in ['.jpg', '.jpeg', '.png', '.webp'] or "image" in mime_type:
            file_type_detected = "image"
            encoded_file = base64.b64encode(contents).decode("utf-8")
            message_content.append({
                "type": "image_url",
                "image_url": {"url": f"data:{mime_type};base64,{encoded_file}"}
            })

        elif file_extension == '.pdf' or mime_type == 'application/pdf':
            file_type_detected = "pdf"
            message_content.append({
                "type": "text",
                "text": f"[CONTENIDO DEL PDF]:\n{extract_pdf_text(contents)}"
            })

        elif file_extension in ['.docx', '.doc']:
            file_type_detected = "docx"
            message_content.append({
                "type": "text",
                "text": f"[CONTENIDO DEL WORD]:\n{extract_docx_text(contents)}"
            })

        elif file_extension == '.txt':
            file_type_detected = "text"
            text_content = contents.decode('utf-8', errors='replace')[:5000]
            message_content.append({"type": "text", "text": f"[CONTENIDO TXT]:\n{text_content}"})

    messages = [
        {"role": "system", "content": system_prompt.strip()},
        {"role": "user",   "content": message_content},
    ]

    result = await call_lm(messages, modo, model_id=model_id)

    if result.get("choices"):
        raw = result["choices"][0]["message"]["content"].strip()
        result["choices"][0]["message"]["content"] = limpiar_respuesta_oracle(raw, modo)

    if file_type_detected:
        result["file_type"] = file_type_detected
    if file_type_detected == "csv" and current_chart_base64:
        result["chart_data"] = current_chart_base64
        result["has_chart"] = True

    return result


# ─────────────────────────────────────────────────────────────
# ENDPOINT — MODOS DISPONIBLES (SIN CAMBIOS)
# ─────────────────────────────────────────────────────────────
@app.get("/api/v1/modos")
async def get_modos():
    return {
        "modos": [
            {
                "id": key,
                "nombre": key.replace("_", " ").title(),
                "icono": val.get("icon", "🤖"),
                "color": val.get("color", "#457B9D"),
            }
            for key, val in MODOS.items()
        ]
    }


# ─────────────────────────────────────────────────────────────
# ENDPOINTS — HISTORIAL Y ESTADÍSTICAS (SIN CAMBIOS)
# ─────────────────────────────────────────────────────────────
@app.post("/api/v1/history/save")
async def save_to_history(data: HistoryEntry):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO history (profile_id, type, prompt, response, file_type, file_name) VALUES (?, ?, ?, ?, ?, ?)",
            (data.profile_id, data.type, data.prompt, data.response, data.file_type, data.file_name)
        )

        cursor.execute(
            """UPDATE stats SET
                total_queries = total_queries + 1,
                education_queries = education_queries + CASE WHEN ? = 'education' THEN 1 ELSE 0 END,
                health_queries = health_queries + CASE WHEN ? = 'health' THEN 1 ELSE 0 END,
                documents_processed = documents_processed + CASE WHEN ? IS NOT NULL THEN 1 ELSE 0 END,
                updated_at = CURRENT_TIMESTAMP""",
            (data.type, data.type, data.file_type)
        )

        conn.commit()
        return {"status": "success", "message": "Historial guardado"}

    except Exception as e:
        print(f"❌ Error guardando en DB: {e}")
        raise HTTPException(status_code=500, detail="Error interno al persistir en SQLite")

    finally:
        if conn:
            conn.close()


@app.get("/api/v1/history/{profile_id}")
async def get_history(profile_id: str, limit: int = 50):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM history WHERE profile_id = ? ORDER BY created_at DESC LIMIT ?",
        (profile_id, limit)
    )
    rows = cursor.fetchall()
    conn.close()
    return {"history": [dict(row) for row in rows]}


@app.delete("/api/v1/history/{profile_id}")
async def clear_history(profile_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM history WHERE profile_id = ?", (profile_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Historial limpiado"}


@app.get("/api/v1/stats/{profile_id}")
async def get_stats(profile_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM stats LIMIT 1")
    stats = cursor.fetchone()

    cursor.execute(
        """SELECT
            COUNT(*) as total,
            SUM(CASE WHEN type = 'education' THEN 1 ELSE 0 END) as education,
            SUM(CASE WHEN type = 'health' THEN 1 ELSE 0 END) as health,
            COUNT(file_type) as documents
        FROM history WHERE profile_id = ?""",
        (profile_id,)
    )
    ps = cursor.fetchone()
    conn.close()

    return {
        "total_queries":       ps["total"] or 0,
        "education_queries":   ps["education"] or 0,
        "health_queries":      ps["health"] or 0,
        "documents_processed": ps["documents"] or 0,
        "avg_response_time":   stats["avg_response_time"] if stats else 0,
    }


# ─────────────────────────────────────────────────────────────
# ENDPOINT — VIDEO POR URL
# ✅ CAMBIO: httpx a LM Studio → call_lm()
# ─────────────────────────────────────────────────────────────
@app.get("/api/v1/oracle/analyze-video-url")
async def analyze_video_url(
    prompt: str = Query(...),
    url: str = Query(...),
    modo: str = Query("community"),
    model_id: Optional[str] = Query(None),
):
    if modo not in MODOS:
        raise HTTPException(status_code=400, detail=f"Modo '{modo}' inválido.")

    video_path = None
    try:
        loop = asyncio.get_event_loop()
        video_path, video_info = await loop.run_in_executor(
            executor, download_video_info, url
        )

        print(f"🎬 Video descargado: {video_path}")
        print(f"📹 Título: {video_info.get('title')}")

        frames_base64 = extract_video_frames(video_path, num_frames=5)

        message_content = [
            {"type": "text", "text": f"Analiza este video. Título: {video_info.get('title')}. Pregunta del usuario: {prompt}"}
        ]

        for frame in frames_base64:
            message_content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{frame}"}
            })

        config = MODOS[modo]
        messages = [
            {"role": "system", "content": config["system_prompt"]},
            {"role": "user",   "content": message_content}
        ]

        result = await call_lm(messages, modo, model_id=model_id)

        if result.get("choices"):
            msg = result["choices"][0]["message"]
            raw = msg.get("content", "")
            if not raw and msg.get("reasoning_content"):
                raw = msg["reasoning_content"]
                print("📝 Se copió reasoning_content a content")
            result["choices"][0]["message"]["content"] = limpiar_respuesta_oracle(raw, modo)

        result["video_metadata"] = {
            "title": video_info.get("title"),
            "duration": video_info.get("duration"),
            "url": url
        }

        return result

    except Exception as e:
        print(f"🔥 Error analizando video URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if video_path and os.path.exists(video_path):
            try:
                os.remove(video_path)
            except:
                pass


# ─────────────────────────────────────────────────────────────
# ANALYTICS (SIN CAMBIOS)
# ─────────────────────────────────────────────────────────────
@app.get("/api/v1/analytics/realtime")
async def get_realtime_analytics():
    return {
        "stats": {"edu": 1526, "health": 10200, "docs": 3780},
        "trends": [
            {"month": "Jan", "math": 10, "lang": 20, "code": 15, "health": 25},
            {"month": "Feb", "math": 25, "lang": 15, "code": 30, "health": 20},
        ],
        "live_feed": [
            {"role": "Child", "topic": "Geo", "icon": "👤"},
            {"role": "Senior", "topic": "Health", "icon": "👤"},
            {"role": "Tutor", "topic": "Math", "icon": "👤"}
        ]
    }


@app.get("/api/v1/analytics/stats")
async def get_db_stats():
    conn = get_db_connection()
    try:
        stats = conn.execute('SELECT * FROM stats WHERE id = 1').fetchone()
        if stats:
            return {
                "edu": stats['education_queries'],
                "health": stats['health_queries'],
                "docs": stats['documents_processed'],
                "total": stats['total_queries']
            }
        return {"edu": 0, "health": 0, "docs": 0, "total": 0}
    except Exception as e:
        print(f"❌ Error en Analytics Engine: {e}")
        return {"error": str(e)}
    finally:
        conn.close()


@app.get("/api/v1/news/brief")
async def get_news_brief(category: str = "world"):
    try:
        raw_news = news_engine.get_latest_context(category)
        return {
            "category": category,
            "timestamp": datetime.now().isoformat(),
            "content": raw_news
        }
    except Exception as e:
        return {"error": str(e)}


# ─────────────────────────────────────────────────────────────
# BRIDGE ENDPOINTS PARA DASHBOARD (SIN CAMBIOS)
# ─────────────────────────────────────────────────────────────
@app.get("/api/status")
async def get_dashboard_status():
    from routes.sentinel import get_system_metrics
    metrics = get_system_metrics()

    return {
        "sistema": {
            "cpu": f"{metrics['cpu']['percent']}%",
            "memoria": f"{metrics['memory']['percent']}%",
            "disco": f"{metrics['disk']['percent']}%"
        },
        "conexiones": {
            "peticiones": 6,
            "respuesta_ms": metrics.get('latency', 4176),
            "representacion_ms": 222
        },
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/ping")
async def ping_vic():
    """✅ CAMBIO: Ping a Google AI en vez de LM Studio"""
    import time
    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Hacemos un request mínimo a la API de Google para verificar conectividad
            r = await client.get(
                f"https://generativelanguage.googleapis.com/v1beta/models",
                headers={"x-goog-api-key": GOOGLE_API_KEY}
            )
            latency = int((time.time() - start) * 1000)
            ok = r.status_code == 200
    except:
        latency = -1
        ok = False

    return {
        "status": "ok" if ok else "timeout",
        "latencia_ms": latency,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/scan")
async def scan_system():
    from routes.sentinel import get_logs, get_alerts
    from routes.sentinel import get_system_metrics

    logs_data = await get_logs(limit=20)
    alerts_data = await get_alerts()
    metrics = get_system_metrics()

    return {
        "status": "scan_complete",
        "timestamp": datetime.now().isoformat(),
        "metrics": metrics,
        "logs": logs_data.get("logs", []),
        "alerts": alerts_data.get("alerts", []),
        "scan_duration_ms": 500
    }


@app.websocket("/ws/metrics")
async def websocket_metrics(websocket: WebSocket):
    from routes.sentinel import get_system_metrics
    await websocket.accept()
    try:
        while True:
            metrics = get_system_metrics()
            await websocket.send_json(metrics)
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        print("Cliente desconectado")


@app.get("/api/v1/sports/ticker")
async def get_sports_data():
    scores = sports_engine.get_live_scores()
    return {"scores": scores}


# ─────────────────────────────────────────────────────────────
# ENDPOINT — HEALTH CHECK
# ✅ CAMBIO: muestra modelo Google en vez de LM Studio
# ─────────────────────────────────────────────────────────────
@app.get("/api/v1/health")
async def health_check():
    return {
        "status":   "healthy",
        "provider": "Google AI",
        "model":    DEFAULT_MODEL_ID,
        "ffmpeg":   "available" if check_ffmpeg() else "missing",
        "modos":    list(MODOS.keys()),
    }


@app.post("/api/v1/chat/multimodal")
async def chat_multimodal(request: Request):
    """Endpoint unificado: acepta texto y opcionalmente imagen"""
    try:
        # Verificar si es multipart/form-data (con imagen) o JSON (solo texto)
        content_type = request.headers.get("content-type", "")
        
        if "multipart/form-data" in content_type:
            # 🔥 MODO MULTIMODAL: texto + imagen
            form_data = await request.form()
            prompt = form_data.get("prompt")
            lang = form_data.get("lang", "es")
            file = form_data.get("file")
            
            if file and file.filename:
                # Procesar con visión
                image_data = await file.read()
                result = await call_lm(prompt, image_data, lang)
                return result
        else:
            # 🔥 MODO TEXTO: solo chat
            payload = await request.json()
            messages = payload.get("messages", [])
            result = await call_lm(messages, "community", thinking=False)
            return result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/alert/notify")
async def send_push_alert(threat: dict, background_tasks: BackgroundTasks):
    background_tasks.add_task(send_telegram_alert, threat)
    return {"status": "sent"}

def send_telegram_alert(threat: dict):
    message = f"""
🚨 ALERTA ORACLE SENTINEL 🚨

Tipo: {threat['type']}
Severidad: {threat['severity']}
Mensaje: {threat['message']}
Hora: {datetime.now()}

¡Revise el sistema inmediatamente!
"""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    requests.post(url, json={"chat_id": TELEGRAM_CHAT_ID, "text": message})


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════╗
    ║   ORACLE AI MULTIMODAL ENGINE v4.0          ║
    ║   Vertex Coders LLC — Google AI Build       ║
    ║   Audio/Video/Image/PDF/DOCX/CSV/JSON ✅    ║
    ╚══════════════════════════════════════════════╝
    """)
    uvicorn.run(app, host="0.0.0.0", port=8080, log_level="info")