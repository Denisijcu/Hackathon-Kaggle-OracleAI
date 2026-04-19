from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import httpx
import base64
import uvicorn
import cv2
import tempfile
import os
from pathlib import Path
import subprocess
import time
import speech_recognition as sr  # <-- IMPORTANTE: Importar con alias 'sr'
from pydub import AudioSegment
from typing import Optional

from pydantic import BaseModel

from config import MODOS
from database import get_db_connection

import pandas as pd
import io
import matplotlib.pyplot as plt


app = FastAPI(title="OracleAI Multimodal Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

LM_STUDIO_HOST = "http://localhost:1234"
MODEL_ID = "google/gemma-4-26b-a4b"



class HistoryEntry(BaseModel):
    profile_id: str
    type: str
    prompt: str
    response: str
    file_type: Optional[str] = None
    file_name: Optional[str] = None



def execute_pandas_logic(df: pd.DataFrame, instruction: str):
    """
    Usa el LLM para generar la lógica de pandas y la ejecuta.
    Para la demo, podemos predefinir operaciones o usar exec() con cuidado.
    """
    try:
        # Ejemplo: Si el usuario pide promedio de una columna
        if "promedio" in instruction.lower():
            result = df.mean(numeric_only=True)
            return f"El promedio calculado por Pandas es:\n{result}"
        
        # Aquí es donde VIC genera el código dinámico
        return "Análisis de datos completado con éxito."
    except Exception as e:
        return f"Error en el motor de datos: {str(e)}"
    

def analyze_csv_with_pandas(file_bytes: bytes, user_query: str) -> dict:
    """Analiza datos y genera gráficos en memoria (Base64)"""
    try:
        # 1. Carga de datos
        df = pd.read_csv(io.BytesIO(file_bytes))
        
        # 2. Lógica de Cálculos (Mantenemos lo que ya funciona)
        calculation_results = ""
        if any(word in user_query.lower() for word in ["promedio", "media", "analizar"]):
            numeric_cols = df.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 0:
                stats = df[numeric_cols].agg(['mean', 'max', 'min']).to_dict()
                calculation_results = f"📊 Estadísticas calculadas: {stats}"

        # 3. GENERACIÓN DE GRÁFICO (Vertex Visualization)
        chart_base64 = None
        try:
            plt.switch_backend('Agg') # Crucial para correr en servidores/Pi sin monitor
            plt.figure(figsize=(8, 4))
            
            # Buscamos columnas para los ejes
            # Asumimos que la primera columna es X (Materia/Fecha) y la numérica es Y
            x_col = df.columns[0]
            y_cols = df.select_dtypes(include=['number']).columns
            
            if len(y_cols) > 0:
                df.plot(kind='bar', x=x_col, y=y_cols[0], color='#FF9F1C', legend=False)
                plt.title(f"Análisis de {y_cols[0]} por {x_col}")
                plt.xticks(rotation=45)
                plt.tight_layout()

                # Guardar en un buffer de memoria
                buf = io.BytesIO()
                plt.savefig(buf, format='png')
                buf.seek(0)
                chart_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
                plt.close()
        except Exception as plot_err:
            print(f"⚠️ No se pudo generar el gráfico: {plot_err}")

        # 4. Retorno de datos estructurados
        return {
            "summary": {
                "columnas": list(df.columns),
                "filas": len(df),
                "calculos": calculation_results,
                "muestra": df.head(3).to_dict()
            },
            "chart": chart_base64 # Aquí va la imagen para el frontend
        }

    except Exception as e:
        return {"error": f"⚠️ Error en motor Pandas: {str(e)}"}


def check_ffmpeg():
    """Verifica si ffmpeg está instalado"""
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        return False

def extract_audio_text(audio_bytes, file_extension):
    """Extrae texto de archivos de audio - VERSIÓN CORREGIDA"""
    tmp_path = None
    wav_path = None
    
    if not check_ffmpeg():
        print("❌ ffmpeg no está instalado")
        return "Error: ffmpeg no instalado"
    
    try:
        # Guardar archivo temporal
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        
        print(f"🎵 Archivo temporal creado: {tmp_path}")
        
        # Crear archivo WAV temporal
        wav_fd, wav_path = tempfile.mkstemp(suffix='.wav')
        os.close(wav_fd)
        
        # Convertir a WAV usando ffmpeg
        cmd = ['ffmpeg', '-i', tmp_path, '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', wav_path, '-y']
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"❌ Error en ffmpeg: {result.stderr}")
            return f"Error convirtiendo audio: {result.stderr[:200]}"
        
        print(f"✅ Audio convertido a WAV: {wav_path}")
        
        # ==== AQUÍ ESTÁ LA PARTE CORREGIDA ====
        # Ahora 'sr' está definido correctamente
        recognizer = sr.Recognizer()
        
        # Configurar para mejor reconocimiento
        recognizer.energy_threshold = 300
        recognizer.dynamic_energy_threshold = True
        
        with sr.AudioFile(wav_path) as source:
            print("🎤 Escuchando audio...")
            # Reducir ruido ambiental
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            audio_data = recognizer.record(source)
            
            try:
                # Intentar con español
                text = recognizer.recognize_google(audio_data, language='es-ES')
                print(f"✅ Transcripción exitosa (es-ES): {text[:100]}...")
                return text
            except sr.UnknownValueError:
                try:
                    # Intentar con inglés
                    text = recognizer.recognize_google(audio_data, language='en-US')
                    print(f"✅ Transcripción exitosa (en-US): {text[:100]}...")
                    return f"[Transcripción en inglés]: {text}"
                except sr.UnknownValueError:
                    return "No se pudo entender el audio. ¿Podría tener ruido o estar en otro idioma?"
            except sr.RequestError as e:
                return f"Error en el servicio de reconocimiento: {e}"
        
    except Exception as e:
        print(f"🔥 Error en reconocimiento de audio: {e}")
        return f"Error procesando audio: {str(e)}"
    
    finally:
        # Limpieza segura
        for path in [tmp_path, wav_path]:
            if path and os.path.exists(path):
                for attempt in range(3):
                    try:
                        time.sleep(0.2)
                        os.unlink(path)
                        break
                    except Exception as e:
                        print(f"⚠️ Error limpiando {path}: {e}")

def extract_video_frame(video_bytes, filename):
    """Extrae un frame del video"""
    tmp_path = None
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name
        
        print(f"📹 Archivo temporal creado: {tmp_path}")
        
        cap = cv2.VideoCapture(tmp_path)
        
        if not cap.isOpened():
            print("❌ No se pudo abrir el video")
            return None
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"📊 Total frames: {total_frames}")
        
        if total_frames == 0:
            cap.release()
            return None
        
        # Frame del medio
        frame_pos = total_frames // 2
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_pos)
        success, frame = cap.read()
        
        if not success:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            success, frame = cap.read()
        
        cap.release()
        time.sleep(0.2)
        
        if not success:
            return None
        
        # Redimensionar
        height, width = frame.shape[:2]
        max_dimension = 1024
        if max(height, width) > max_dimension:
            scale = max_dimension / max(height, width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            frame = cv2.resize(frame, (new_width, new_height))
        
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        encoded_frame = base64.b64encode(buffer).decode("utf-8")
        
        return encoded_frame
        
    except Exception as e:
        print(f"🔥 Error en extract_video_frame: {e}")
        return None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            for attempt in range(3):
                try:
                    time.sleep(0.2)
                    os.unlink(tmp_path)
                    break
                except:
                    pass


# ============================================
# ENDPOINT DE TRANSCRIPCIÓN (EL OÍDO DE VIC)
# ============================================

@app.post("/api/v1/transcribe")
async def transcribe_audio_endpoint(file: UploadFile = File(...)):
    """Convierte audio a texto usando Whisper localmente"""
    try:
        # 1. Leer los bytes del archivo grabado
        contents = await file.read()
        filename = file.filename
        file_extension = os.path.splitext(filename)[1].lower() or ".wav"
        
        print(f"🎤 Recibiendo audio para transcripción: {filename}")
        
        # 2. Usamos tu función existente de extracción de audio
        # Esta es la que usa ffmpeg y SpeechRecognition que ya tienes arriba
        text = extract_audio_text(contents, file_extension)
        
        if text.startswith("Error"):
             raise HTTPException(status_code=500, detail=text)
             
        print(f"✅ Voz convertida: {text[:50]}...")
        return {"transcription": text}

    except Exception as e:
        print(f"🔥 Error en el endpoint de voz: {e}")
        raise HTTPException(status_code=500, detail=str(e))
# ============================================================
# FUNCIONES DE EXTRACCIÓN DE DOCUMENTOS (NUEVO)
# ============================================================

def extract_pdf_text(file_bytes: bytes, max_chars: int = 5000) -> str:
    """Extrae texto de un PDF usando pypdf"""
    try:
        from pypdf import PdfReader
        import io
        reader = PdfReader(io.BytesIO(file_bytes))
        total_pages = len(reader.pages)
        print(f"📄 PDF con {total_pages} páginas")
        text_parts = []
        chars_collected = 0
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            text_parts.append(f"[Página {i+1}]\n{page_text}")
            chars_collected += len(page_text)
            if chars_collected >= max_chars:
                text_parts.append(f"\n[... {total_pages - i - 1} páginas restantes truncadas]")
                break
        result = "\n\n".join(text_parts).strip()
        if not result:
            return "El PDF no contiene texto extraíble (puede ser un PDF escaneado/imagen)."
        return result
    except ImportError:
        return "Error: pypdf no está instalado. Ejecuta: pip install pypdf"
    except Exception as e:
        print(f"🔥 Error extrayendo PDF: {e}")
        return f"Error procesando PDF: {str(e)}"


def extract_docx_text(file_bytes: bytes, max_chars: int = 5000) -> str:
    """Extrae texto de un DOCX usando python-docx"""
    try:
        from docx import Document
        import io
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        full_text = "\n".join(paragraphs)
        if len(full_text) > max_chars:
            full_text = full_text[:max_chars] + "\n[... contenido truncado]"
        if not full_text.strip():
            return "El documento DOCX no contiene texto extraíble."
        print(f"✅ DOCX extraído: {len(full_text)} caracteres")
        return full_text
    except ImportError:
        return "Error: python-docx no está instalado. Ejecuta: pip install python-docx"
    except Exception as e:
        print(f"🔥 Error extrayendo DOCX: {e}")
        return f"Error procesando DOCX: {str(e)}"


def extract_csv_text(file_bytes: bytes, max_rows: int = 50) -> str:
    """Extrae contenido de un CSV"""
    try:
        import pandas as pd
        import io
        df = pd.read_csv(io.BytesIO(file_bytes), nrows=max_rows)
        shape_info = f"[CSV: {df.shape[0]} filas x {df.shape[1]} columnas]\n"
        return shape_info + df.to_string(index=False)
    except ImportError:
        return "Error: pandas no está instalado. Ejecuta: pip install pandas"
    except Exception as e:
        print(f"🔥 Error extrayendo CSV: {e}")
        return f"Error procesando CSV: {str(e)}"




def extract_json_text(file_bytes: bytes, max_chars: int = 5000) -> str:
    """Extrae y formatea el contenido de un JSON"""
    try:
        import json
        text = file_bytes.decode('utf-8', errors='replace')
        data = json.loads(text)
        formatted = json.dumps(data, indent=2, ensure_ascii=False)
        if len(formatted) > max_chars:
            formatted = formatted[:max_chars] + "\n[... JSON truncado]"
        return formatted
    except Exception as e:
        return f"Error procesando JSON: {str(e)}"


def flatten_json_response(content: str) -> str:
    import json
    try:
        # Intentamos parsear lo que mandó Gemma
        parsed = json.loads(content)
        
        if isinstance(parsed, dict):
            # PRIORIDAD MÁXIMA: Si el modelo mandó un campo "message" o "input"
            if "message" in parsed: return str(parsed["message"])
            if "input" in parsed: return str(parsed["input"])
            if "response" in parsed: return str(parsed["response"])
            
            # Si no hay esas llaves, aplanamos lo que haya
            return "\n".join([f"{k.capitalize()}: {v}" for k, v in parsed.items() if k not in ['status', 'analysis_type']])
        
        return content
    except:
        return content
    

def limpiar_respuesta_oracle(content: str, modo: str) -> str:
    # 🛡️ Lista negra de frases de sistema
    basura = ["ready_to_execute", "expert_code_mentor", "status:", "{", "}", "error"]
    
    content_clean = content.strip()
    
    # Si detectamos basura técnica en una respuesta corta
    if any(word in content_clean.lower() for word in basura) and len(content_clean) < 120:
        if modo == "coding":
            return "⚠️ Error de generación. Por favor, solicita el código directamente."
        if modo == "mental_health":
            return "Entiendo perfectamente... Tómate un momento para respirar, estoy aquí para apoyarte."
        return "OracleAI está procesando tu solicitud, por favor intenta de nuevo."
        
    return content_clean


@app.post("/api/v1/oracle/analyze")
async def analyze_media(
    prompt: str = Query(...),
    file: Optional[UploadFile] = File(None)
):
    try:
        message_content = [{"type": "text", "text": prompt}]
        extracted_text = None
        file_type_detected = None
        
        if file is not None and file.filename != "":
            contents = await file.read()
            mime_type = file.content_type
            filename = file.filename
            file_extension = os.path.splitext(filename)[1].lower()
            
            print(f"📁 Procesando: {filename} (Tipo: {mime_type})")
            
            # Detectar tipo real
            if mime_type == "application/octet-stream":
                if file_extension in ['.mp3', '.wav', '.ogg', '.m4a', '.flac']:
                    mime_type = f"audio/{file_extension[1:]}"
                elif file_extension in ['.mp4', '.avi', '.mov', '.mkv']:
                    mime_type = f"video/{file_extension[1:]}"
            
            # --- AUDIO --- (SIN CAMBIOS)
            if "audio" in mime_type or file_extension in ['.mp3', '.wav', '.ogg', '.m4a', '.flac']:
                file_type_detected = "audio"
                print(f"🎵 Procesando audio: {filename}")
                extracted_text = extract_audio_text(contents, file_extension)
                
                if extracted_text and not extracted_text.startswith("Error"):
                    message_content.append({
                        "type": "text",
                        "text": f"[Transcripción del audio]: {extracted_text}"
                    })
                    print(f"📝 Audio transcrito correctamente")
                else:
                    error_msg = extracted_text if extracted_text else "No se pudo transcribir el audio"
                    message_content.append({
                        "type": "text",
                        "text": f"[Error en transcripción]: {error_msg}"
                    })
            
            # --- VIDEO --- (SIN CAMBIOS)
            elif "video" in mime_type or file_extension in ['.mp4', '.avi', '.mov', '.mkv', '.webm']:
                file_type_detected = "video"
                print(f"🎬 Procesando video: {filename}")
                encoded_frame = extract_video_frame(contents, filename)
                
                if encoded_frame:
                    message_content.append({
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{encoded_frame}"}
                    })
                    message_content[0]["text"] += "\n\n[Frame extraído del video para análisis]"
            
            # --- IMAGEN --- (SIN CAMBIOS)
            elif "image" in mime_type or file_extension in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']:
                file_type_detected = "image"
                print(f"🖼️ Procesando imagen: {filename}")
                encoded_file = base64.b64encode(contents).decode("utf-8")
                message_content.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime_type};base64,{encoded_file}"}
                })

            # --- PDF --- (NUEVO)
            elif file_extension == '.pdf' or mime_type == 'application/pdf':
                file_type_detected = "pdf"
                print(f"📄 Procesando PDF: {filename}")
                doc_text = extract_pdf_text(contents)
                message_content.append({
                    "type": "text",
                    "text": f"[CONTENIDO DEL DOCUMENTO PDF]:\n{doc_text}"
                })

            # --- DOCX --- (NUEVO)
            elif file_extension in ['.docx', '.doc'] or mime_type in [
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword'
            ]:
                file_type_detected = "docx"
                print(f"📝 Procesando DOCX: {filename}")
                doc_text = extract_docx_text(contents)
                message_content.append({
                    "type": "text",
                    "text": f"[CONTENIDO DEL DOCUMENTO WORD]:\n{doc_text}"
                })

            # --- CSV --- (NUEVO)
            # --- CSV (VERSIÓN BLINDADA v3.0) ---
            elif file_extension == '.csv' or mime_type == 'text/csv':
                file_type_detected = "csv"
                
                # 1. Ejecutamos el motor de Pandas UNA SOLA VEZ
                analysis_data = analyze_csv_with_pandas(contents, prompt)
                
                # 2. Extraemos SOLO el texto estadístico para el LLM
                # Usamos .get() para evitar que el sistema explote si no hay cálculos
                stats_for_llm = analysis_data.get("summary", {}).get("calculos", "No se detectaron datos numéricos.")
                
                # 3. Guardamos el gráfico en una variable temporal para el final
                # Esta variable NO se envía a LM Studio
                current_chart_base64 = analysis_data.get("chart")
                
                # 4. CREAMOS EL PROMPT LIGERO (Vertex Standard)
                instruccion_maestra = f"""
                [RESULTADOS TÉCNICOS DE PANDAS]:
                {stats_for_llm}
                
                [CONTEXTO]:
                Muestra de datos: {analysis_data.get('summary', {}).get('muestra', '')}
                
                [INSTRUCCIÓN]: 
                Usa los resultados numéricos de arriba para responder a: "{prompt}".
                Sé proactivo y menciona el promedio o valores máximos si son relevantes.
                """
                
                message_content.append({
                    "type": "text",
                    "text": instruccion_maestra
                })

            # --- JSON --- (NUEVO)
            elif file_extension == '.json' or mime_type == 'application/json':
                file_type_detected = "json"
                print(f"🔧 Procesando JSON: {filename}")
                doc_text = extract_json_text(contents)
                message_content.append({
                    "type": "text",
                    "text": f"[CONTENIDO DEL JSON]:\n{doc_text}"
                })

            # --- TXT --- (SIN CAMBIOS)
            elif file_extension == '.txt':
                file_type_detected = "text"
                print(f"📄 Procesando texto: {filename}")
                try:
                    text_content = contents.decode('utf-8', errors='replace')
                    text_content = text_content.replace('—', '-').replace('"', '"').replace('"', '"')
                    if len(text_content) > 5000:
                        text_content = text_content[:5000] + "...\n[Texto truncado por seguridad]"
                    message_content.append({
                        "type": "text",
                        "text": f"[CONTENIDO DEL DOCUMENTO]:\n{text_content}"
                    })
                except Exception as e:
                    print(f"⚠️ Error de decodificación: {e}")
                    message_content.append({
                        "type": "text",
                        "text": "[Error crítico: El archivo tiene un formato de caracteres no soportado]"
                    })


        modo_activo = "education" # Forzamos education para la prueba del CSV
        config_modo = MODOS.get(modo_activo, MODOS["community"])        
        # Payload para LM Studio - SIN CAMBIOS
        payload = {
            "model": MODEL_ID,
            "messages": [
                {
                    "role": "system", 
                    # ✅ AQUÍ ESTÁ EL TRUCO: Usamos el prompt de la config, no el genérico
                    "content": config_modo["system_prompt"] 
                },
                {
                    "role": "user", 
                    "content": message_content
                }
            ],
            "temperature": config_modo["temperature"], # Usamos la temperatura del modo
            "max_tokens": config_modo["max_tokens"],
            "top_p": 0.9,
            
            "top_k": 40,
            "repeat_penalty": 1.15,
            "frequency_penalty": 0.4,
            "presence_penalty": 0.4,
            "do_sample": True,
            "seed": 42,
            "stop": ["\n\n\n", "```", "Human:", "User:"]
        }
        
        print(f"🚀 Enviando a LM Studio: {len(message_content)} elementos")
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{LM_STUDIO_HOST}/v1/chat/completions",
                json=payload
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Error en LM Studio")
            
            result = response.json()

            # 2. 🔥 INTEGRACIÓN DE LIMPIEZA VERTEX (SIN JODER EL RESTO)
            if result.get("choices") and len(result["choices"]) > 0:
                raw_content = result["choices"][0]["message"]["content"]
                
                # Usamos la función de limpieza centralizada
                # Esto sustituye tu antiguo bloque de 'if raw_content.startswith("{")'
                clean_content = limpiar_respuesta_oracle(raw_content, modo_activo)
                
                result["choices"][0]["message"]["content"] = clean_content

            # 3. Mantener metadata de archivos (Tus funciones originales)
            if extracted_text:
                result["audio_transcription"] = extracted_text
            if file_type_detected:
                result["file_type"] = file_type_detected
            if file_type_detected == "csv" and 'current_chart_base64' in locals():
                result["chart_data"] = current_chart_base64
                result["has_chart"] = True
            
            return result
    
    except Exception as e:
        print(f"🔥 Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/chat")
async def chat_oracle(request: Request):
    try:
        payload = await request.json()
        modo_actual = payload.get("modo", "community")

        # 🛡️ TIMEOUT AMPLIADO: Le damos 300s para que Gemma-4 no nos corte la nota
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{LM_STUDIO_HOST}/v1/chat/completions", 
                json=payload
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Error en LM Studio")

            result = response.json()

            if result.get("choices") and len(result["choices"]) > 0:
                raw_content = result["choices"][0]["message"]["content"]
                
                # 🔥 LA LIMPIEZA VERTEX: Garantizamos respuesta humana o código puro
                clean_content = limpiar_respuesta_oracle(raw_content, modo_actual)
                
                result["choices"][0]["message"]["content"] = clean_content

            return result

    except httpx.ReadTimeout:
        print("⚠️ Timeout: El modelo tardó demasiado en razonar.")
        raise HTTPException(status_code=504, detail="Tiempo de espera agotado: La IA sigue pensando.")
    except Exception as e:
        print(f"🔥 Error en /chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Añade estos endpoints a tu main.py existente
# ============================================
# NUEVOS ENDPOINTS PARA MODOS (Agregar esto)
# ============================================

# config.py - OracleAI Multimodal Engine
# Vertex Coders LLC — Auditoría Gemma-4 Edge/Offline v2.0
# Fixes aplicados:
#   - Stop tokens separados por modo (eliminado ``` de modos que usan Markdown/código)
#   - max_tokens reducidos en modos que no requieren respuestas largas
#   - "TEXTO PLANO" reemplazado por "SIN JSON" para no contradecir Markdown
#   - Advertencia médica fijada al FINAL (no "inicia o finaliza")
#   - Saludo hardcodeado eliminado de coding
#   - repeat_penalty eliminado (redundante con frequency/presence penalty en LM Studio)
#   - SAMPLER_CONFIG separado y limpio para todos los modos

# ─────────────────────────────────────────────────────────────
# SAMPLER GLOBAL — optimizado para Gemma-4 en hardware limitado
# ─────────────────────────────────────────────────────────────
# NO incluir repeat_penalty — es redundante con frequency_penalty
# en LM Studio y sobrecarga el sampler en dispositivos con poca RAM.
# top_k eliminado por la misma razón.
SAMPLER_CONFIG = {
    "top_p": 0.9,
    "frequency_penalty": 0.3,
    "presence_penalty": 0.3,
    "do_sample": True,
    "seed": 42,  # Reproducibilidad total en entornos offline
}

# ─────────────────────────────────────────────────────────────
# MODOS
# ─────────────────────────────────────────────────────────────
MODOS = {

    # ── EDUCACIÓN ──────────────────────────────────────────────
    "education": {
        "system_prompt": (
            "Eres OracleAI Edu, asistente educativo experto para niños y jóvenes de 6 a 14 años.\n"
            "\n"
            "REGLAS:\n"
            "- PROHIBIDO responder con JSON o llaves { }. Usa solo Markdown estructurado.\n"
            "- Tono motivador, paciente y amigable. Usa analogías sencillas.\n"
            "- Si hay archivos adjuntos, menciona hallazgos específicos del documento o imagen.\n"
            "\n"
            "FORMATO DE RESPUESTA (Estándar Vertex):\n"
            "- Usa ### para títulos de sección.\n"
            "- Si el tema es numérico o comparativo: genera una Tabla Markdown.\n"
            "- Si el tema es descriptivo: usa lista de viñetas con encabezado 'Hallazgos Clave'.\n"
            "- Usa **negritas** para términos importantes.\n"
            "- Usa LaTeX inline ($...$) para fórmulas matemáticas."
        ),
        "temperature": 0.2,
        "max_tokens": 1200,  # Suficiente para respuestas educativas. 4096 causa OOM en edge.
        "stop": ["\n\n\n", "Human:", "User:"],  # Sin ``` — necesita bloques Markdown
        "icon": "🎓",
        "color": "#FF9F1C",
    },

    # ── SALUD ───────────────────────────────────────────────────
    "health": {
        "system_prompt": (
            "Eres OracleAI Salud, asistente médico pedagógico.\n"
            "\n"
            "REGLAS:\n"
            "- PROHIBIDO responder con JSON o llaves { }. Usa solo Markdown estructurado.\n"
            "- Explica tendencias en signos vitales o imágenes médicas de forma sencilla.\n"
            "- Resalta en **negrita** cualquier valor fuera de rango normal.\n"
            "\n"
            "FORMATO DE RESPUESTA (Estándar Vertex):\n"
            "- Usa tablas Markdown para organizar valores medidos (Presión, Glucosa, etc.).\n"
            "- Usa viñetas para pasos de prevención o recomendaciones.\n"
            "\n"
            "ADVERTENCIA OBLIGATORIA: Finaliza SIEMPRE con esta línea exacta:\n"
            "> **AVISO:** Esta información es educativa. Consulta a un profesional de salud "
            "antes de tomar cualquier decisión médica."
        ),
        "temperature": 0.1,
        "max_tokens": 1200,
        "stop": ["\n\n\n", "Human:", "User:"],
        "icon": "🏥",
        "color": "#118AB2",
    },

    # ── PROGRAMACIÓN ────────────────────────────────────────────
    "coding": {
        "system_prompt": (
            "Eres un Senior Developer especializado en Python, Angular y seguridad ofensiva.\n"
            "\n"
            "REGLAS:\n"
            "- Entrega ÚNICAMENTE código limpio, funcional y bien comentado.\n"
            "- PROHIBIDO responder con JSON puro o estructuras { } fuera de código.\n"
            "- Prioriza seguridad, hardening y buenas prácticas en cada solución.\n"
            "- Si la solicitud es ambigua, pide clarificación en una sola línea antes de codificar."
        ),
        "temperature": 0.1,
        "max_tokens": 2048,  # Margen para scripts completos
        "stop": ["\n\n\n", "Human:", "User:"],  # Sin ``` — necesita bloques de código
        "icon": "💻",
    },

    # ── NUTRICIÓN ───────────────────────────────────────────────
    "nutrition": {
        "system_prompt": (
            "Eres OracleAI Nutrición, experto en dietética y biohacking.\n"
            "\n"
            "REGLAS:\n"
            "- PROHIBIDO responder con JSON o llaves { }. Usa solo Markdown estructurado.\n"
            "- Al analizar comidas, desglosa siempre: Proteínas, Grasas y Carbohidratos.\n"
            "\n"
            "FORMATO DE RESPUESTA (Estándar Vertex):\n"
            "- Usa ### para encabezados 'Análisis Nutricional' y 'Sugerencia Vertex'.\n"
            "- Presenta macros en tabla Markdown.\n"
            "- Usa LaTeX inline ($...$) para cálculos de IMC o calorías totales."
        ),
        "temperature": 0.15,  # Bajado de 0.25 — macros deben ser consistentes
        "max_tokens": 1500,
        "stop": ["\n\n\n", "Human:", "User:"],
        "icon": "🍎",
        "color": "#06D6A0",
    },

    # ── BIENESTAR MENTAL ────────────────────────────────────────
    "mental_health": {
        "system_prompt": (
            "Eres OracleAI Bienestar, un acompañante empático y cálido.\n"
            "\n"
            "REGLAS:\n"
            "- Habla de forma natural, cálida y humana. NUNCA uses listas, tablas ni JSON.\n"
            "- Prioriza la escucha activa y el apoyo emocional sobre dar consejos directivos.\n"
            "- Si detectas una crisis emocional grave, sugiere contactar a un profesional."
        ),
        "temperature": 0.7,
        "max_tokens": 1000,
        # ``` sí se queda aquí — no necesita generar código ni tablas
        "stop": ["\n\n\n", "Human:", "User:", "```"],
        "icon": "🧠",
        "color": "#9B5DE5",
    },

    # ── HISTORIA ────────────────────────────────────────────────
    "history": {
        "system_prompt": (
            "Eres OracleAI Historia, analista histórico con rigor cronológico.\n"
            "\n"
            "REGLAS:\n"
            "- PROHIBIDO responder con JSON o llaves { }. Usa solo Markdown estructurado.\n"
            "- Contextualiza cada evento con causas, consecuencias y período histórico.\n"
            "\n"
            "FORMATO DE RESPUESTA (Estándar Vertex):\n"
            "- Usa ### para separar épocas o períodos.\n"
            "- Usa tablas Markdown para comparar imperios, períodos o datos cronológicos.\n"
            "- Usa **negritas** para fechas y nombres clave."
        ),
        "temperature": 0.2,
        "max_tokens": 2000,  # Bajado de 3500 — suficiente para análisis histórico
        "stop": ["\n\n\n", "Human:", "User:"],
        "icon": "📜",
        "color": "#8B5E3C",
    },

    # ── CULTURA ─────────────────────────────────────────────────
    "culture": {
        "system_prompt": (
            "Eres OracleAI Cultura, experto en tradiciones, arte y antropología cultural.\n"
            "\n"
            "REGLAS:\n"
            "- PROHIBIDO responder con JSON o llaves { }. Usa solo Markdown estructurado.\n"
            "- Aborda los temas con respeto, neutralidad y contexto antropológico.\n"
            "\n"
            "FORMATO DE RESPUESTA (Estándar Vertex):\n"
            "- Usa tablas Markdown para comparar festividades, costumbres o datos culturales.\n"
            "- Usa **negritas** para hitos culturales importantes.\n"
            "- Usa ### para separar regiones o temáticas."
        ),
        "temperature": 0.3,
        "max_tokens": 2000,
        "stop": ["\n\n\n", "Human:", "User:"],
        "icon": "🌍",
        "color": "#F4A261",
    },

    # ── COMUNIDAD (fallback general) ────────────────────────────
    "community": {
        "system_prompt": (
            "Eres OracleAI, asistente general de Vertex Coders.\n"
            "\n"
            "REGLAS:\n"
            "- Responde de forma clara, directa y útil.\n"
            "- PROHIBIDO responder con JSON o llaves { } fuera de contexto técnico.\n"
            "- Adapta el formato según el tipo de pregunta: usa Markdown si ayuda a la claridad."
        ),
        "temperature": 0.4,
        "max_tokens": 1000,
        "stop": ["\n\n\n", "Human:", "User:"],
        "icon": "🏠",
        "color": "#457B9D",
    },
}
@app.post("/api/v1/oracle/{modo}")
async def analyze_with_mode(
    modo: str,
    prompt: str = Query(...),
    role: str = Query("child"),
    file: Optional[UploadFile] = File(None)
):
    if modo not in MODOS:
        raise HTTPException(status_code=400, detail="Modo inválido")
    
    config = MODOS[modo]
    system_prompt = config["system_prompt"]

    # 1. DEFINIMOS message_content (Esto es lo que faltaba)
    message_content = [{"type": "text", "text": prompt}]
    file_type_detected = None
    current_chart_base64 = None

    # 🎯 ADAPTACIÓN DE PERSONALIDAD VERTEX
    if role == "caregiver":
        system_prompt += "\n- [ADAPTACIÓN]: El usuario es un ADULTO/CUIDADOR. Usa un lenguaje técnico y directo."
    elif role == "elder":
        system_prompt += "\n- [ADAPTACIÓN]: El usuario es un ADULTO MAYOR. Usa mucha paciencia y lenguaje sencillo."

    # 2. PROCESAMIENTO DE ARCHIVOS (La lógica que ya funciona)
    if file is not None and file.filename != "":
        contents = await file.read()
        filename = file.filename
        file_extension = os.path.splitext(filename)[1].lower()
        mime_type = file.content_type

        # --- Lógica para CSV ---
        if file_extension == '.csv' or mime_type == 'text/csv':
            file_type_detected = "csv"
            analysis_data = analyze_csv_with_pandas(contents, prompt)
            stats_text = analysis_data.get("summary", {}).get("calculos", "")
            current_chart_base64 = analysis_data.get("chart")
            
            message_content.append({
                "type": "text",
                "text": f"[DATOS DE PANDAS]:\n{stats_text}"
            })
        
        # --- Lógica para IMÁGENES ---
        elif file_extension in ['.jpg', '.jpeg', '.png', '.webp']:
            file_type_detected = "image"
            encoded_file = base64.b64encode(contents).decode("utf-8")
            message_content.append({
                "type": "image_url",
                "image_url": {"url": f"data:{mime_type};base64,{encoded_file}"}
            })
            
        # (Agrega aquí los otros elif de PDF, DOCX, etc., si los necesitas en este modo)

    # 3. CONSTRUCCIÓN DE MENSAJES
    messages = [
       {
            "role": "system", 
            "content": system_prompt.strip() # .strip() elimina espacios fantasma que confunden al modelo
        },
        {
            "role": "user", 
            "content": message_content 
        }
    ]

    # 4. LLAMADA A LM STUDIO
    payload = {
        "model": MODEL_ID,
        "messages": messages,
        "temperature": config["temperature"],
        "max_tokens": config["max_tokens"]
    }

    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(f"{LM_STUDIO_HOST}/v1/chat/completions", json=payload)
        result = response.json()

        if result.get("choices"):
            content = result["choices"][0]["message"]["content"].strip()
            
            # Filtro de seguridad Vertex: Si detectamos que la IA se puso habladora o mandó JSON
            prohibidos = ["ready_to_execute", "expert_code_mentor","error", "{", "status:"]
            
            # Si el contenido es basura de estado, forzamos un mensaje limpio
            if any(word in content.lower() for word in prohibidos) and len(content) < 150:
                # Opcional: Podrías hacer un re-intento automático aquí con un prompt más seco
                result["choices"][0]["message"]["content"] = "⚠️ Entiendo perfectamente cómo te sientes. Tómate un momento para respirar profundo, estoy aquí para escucharte y apoyarte en lo que necesites."
            else:
                result["choices"][0]["message"]["content"] = content

        return result

@app.get("/api/v1/modos")
async def get_modos():
    """Devuelve los modos disponibles actualizados para OracleAI v4.0"""
    return {
        "modos": [
            {"id": "education", "nombre": "Educación", "icono": "🎓", "descripcion": "Ayuda a niños 6-14 años"},
            {"id": "health", "nombre": "Salud", "icono": "🏥", "descripcion": "Asistencia para ancianos y cuidadores"},
            {"id": "coding", "nombre": "Programación", "icono": "💻", "descripcion": "Experto en desarrollo y algoritmos"},
            {"id": "mental_health", "nombre": "Bienestar", "icono": "🧠", "descripcion": "Apoyo emocional y acompañamiento"},
            {"id": "community", "nombre": "Comunidad", "icono": "🏠", "descripcion": "Modo familiar y servicios locales"}
        ]
    }


@app.post("/api/v1/history/save")
async def save_to_history(data: HistoryEntry): 
    """Guarda una conversación en SQLite y actualiza estadísticas de Vertex Coders"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 2. Inserción en historial usando el objeto 'data'
        cursor.execute('''
            INSERT INTO history (profile_id, type, prompt, response, file_type, file_name)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data.profile_id, 
            data.type, 
            data.prompt, 
            data.response, 
            data.file_type, 
            data.file_name
        ))
        
        # 3. Actualizar estadísticas globales o del perfil
        # Usamos los mismos valores del objeto data para la lógica del CASE
        cursor.execute('''
            UPDATE stats SET 
                total_queries = total_queries + 1,
                education_queries = education_queries + CASE WHEN ? = 'education' THEN 1 ELSE 0 END,
                health_queries = health_queries + CASE WHEN ? = 'health' THEN 1 ELSE 0 END,
                documents_processed = documents_processed + CASE WHEN ? IS NOT NULL THEN 1 ELSE 0 END,
                updated_at = CURRENT_TIMESTAMP
        ''', (data.type, data.type, data.file_type))
        
        conn.commit()
        print(f"✅ Historial guardado: Perfil {data.profile_id} - Modo {data.type}")
        return {"status": "success", "message": "Historial guardado exitosamente"}

    except Exception as e:
        print(f"❌ Error guardando en DB: {e}")
        raise HTTPException(status_code=500, detail="Error interno al persistir en SQLite")
    
    finally:
        if conn:
            conn.close()

@app.get("/api/v1/history/{profile_id}")
async def get_history(profile_id: str, limit: int = 50):
    """Obtiene el historial de un perfil"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM history 
        WHERE profile_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
    ''', (profile_id, limit))
    
    rows = cursor.fetchall()
    conn.close()
    
    return {"history": [dict(row) for row in rows]}

@app.delete("/api/v1/history/{profile_id}")
async def clear_history(profile_id: str):
    """Limpia el historial de un perfil"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM history WHERE profile_id = ?', (profile_id,))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Historial limpiado"}

@app.get("/api/v1/stats/{profile_id}")
async def get_stats(profile_id: str):
    """Obtiene estadísticas de un perfil"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Estadísticas generales
    cursor.execute('SELECT * FROM stats LIMIT 1')
    stats = cursor.fetchone()
    
    # Conteo por perfil
    cursor.execute('''
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN type = 'education' THEN 1 ELSE 0 END) as education,
            SUM(CASE WHEN type = 'health' THEN 1 ELSE 0 END) as health,
            COUNT(file_type) as documents
        FROM history WHERE profile_id = ?
    ''', (profile_id,))
    
    profile_stats = cursor.fetchone()
    conn.close()
    
    return {
        "total_queries": profile_stats["total"] or 0,
        "education_queries": profile_stats["education"] or 0,
        "health_queries": profile_stats["health"] or 0,
        "documents_processed": profile_stats["documents"] or 0,
        "avg_response_time": stats["avg_response_time"] if stats else 0
    }




@app.get("/api/v1/health")
async def health_check():
    ffmpeg_available = check_ffmpeg()
    return {
        "status": "healthy",
        "model": MODEL_ID,
        "ffmpeg": "available" if ffmpeg_available else "missing"
    }

if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════╗
    ║   ORACLE AI MULTIMODAL ENGINE v2.5    ║
    ║   Docs: PDF/DOCX/CSV/JSON ✅          ║
    ║   Audio/Video/Image: intactos ✅      ║
    ╚════════════════════════════════════════╝
    """)
    uvicorn.run(app, host="0.0.0.0", port=8080, log_level="info")
