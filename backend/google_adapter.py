# google_adapter.py - OracleAI Google AI Adapter
# Vertex Coders LLC — Migración LM Studio → Google AI API
#
# Responsabilidad única: traducir entre el formato OpenAI (LM Studio)
# y el formato Google Generative Language API.
# El resto del backend NO sabe que cambió el proveedor.

import httpx
from typing import Optional

GOOGLE_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

# ─────────────────────────────────────────────────────────────
# PARÁMETROS QUE GOOGLE NO SOPORTA (se descartan silenciosamente)
# LM Studio acepta: frequency_penalty, presence_penalty, do_sample, seed, top_k
# Google acepta:    temperature, maxOutputTokens, topP, stopSequences
# ─────────────────────────────────────────────────────────────
_GOOGLE_UNSUPPORTED = {"frequency_penalty", "presence_penalty", "do_sample", "seed", "top_k", "model"}


def _convert_messages_to_google(messages: list) -> tuple[str, list]:
    """
    Convierte el array de mensajes formato OpenAI al formato Google.

    OpenAI:
        [
            {"role": "system", "content": "..."},
            {"role": "user",   "content": [{"type": "text", "text": "..."}, {"type": "image_url", ...}]},
        ]

    Google:
        system_instruction: "..."   (string separado)
        contents: [
            {"role": "user", "parts": [{"text": "..."}, {"inline_data": {...}}]}
        ]

    Returns:
        system_instruction (str): contenido del mensaje system
        contents (list): mensajes en formato Google
    """
    system_instruction = ""
    contents = []

    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")

        # ── SYSTEM → system_instruction ──────────────────────
        if role == "system":
            if isinstance(content, str):
                system_instruction = content
            elif isinstance(content, list):
                texts = [p.get("text", "") for p in content if p.get("type") == "text"]
                system_instruction = "\n".join(texts)
            continue  # No va a contents

        # ── USER / ASSISTANT → contents ──────────────────────
        google_role = "model" if role == "assistant" else "user"
        parts = []

        if isinstance(content, str):
            parts.append({"text": content})

        elif isinstance(content, list):
            for part in content:
                part_type = part.get("type", "")

                # Texto plano
                if part_type == "text":
                    text = part.get("text", "").strip()
                    if text:
                        parts.append({"text": text})

                # Imagen en formato image_url (LM Studio / OpenAI Vision)
                # Soporta: data:image/jpeg;base64,<b64> o URL directa
                elif part_type == "image_url":
                    image_url_obj = part.get("image_url", {})
                    url = image_url_obj.get("url", "")

                    if url.startswith("data:"):
                        # Formato: data:<mime>;base64,<data>
                        try:
                            header, b64_data = url.split(",", 1)
                            mime_type = header.split(":")[1].split(";")[0]
                            parts.append({
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": b64_data
                                }
                            })
                        except Exception as e:
                            print(f"⚠️ [GoogleAdapter] Error parseando image_url: {e}")
                    else:
                        # URL externa — la pasamos como texto descriptivo por seguridad
                        parts.append({"text": f"[Imagen desde URL: {url}]"})

        if parts:
            contents.append({"role": google_role, "parts": parts})

    return system_instruction, contents


def build_google_payload(
    model_id: str,
    messages: list,
    temperature: float = 0.4,
    max_tokens: int = 1024,
    stop: Optional[list] = None,
    top_p: float = 0.9,
    thinking: bool = False,  # Parámetro extra para compatibilidad con LM Studio (no hace nada en Google)
    **kwargs  # Absorbe parámetros no soportados (frequency_penalty, seed, etc.)
) -> tuple[str, dict]:
    """
    Construye la URL y el payload para Google Generative AI.

    Returns:
        url (str): endpoint completo
        payload (dict): body listo para enviar
    """
    system_instruction, contents = _convert_messages_to_google(messages)

    generation_config = {
        "temperature": temperature,
        "maxOutputTokens": max_tokens,
        "topP": top_p,
    }

    if stop:
        # Google acepta máximo 5 stop sequences
        generation_config["stopSequences"] = stop[:5]

    payload = {
        "contents": contents,
        "generationConfig": generation_config,
    }

    if system_instruction:
        payload["system_instruction"] = {
            "parts": [{"text": system_instruction}]
        }

    url = f"{GOOGLE_API_BASE}/{model_id}:generateContent"
    return url, payload


def parse_google_response(google_response: dict) -> dict:
    """
    Convierte la respuesta de Google al formato OpenAI/LM Studio.

    Google devuelve:
        {
            "candidates": [{
                "content": {"parts": [{"text": "..."}], "role": "model"},
                "finishReason": "STOP"
            }],
            "usageMetadata": {...}
        }

    Devuelve formato OpenAI compatible con el resto del backend:
        {
            "choices": [{
                "message": {"role": "assistant", "content": "..."},
                "finish_reason": "stop"
            }],
            "usage": {...}
        }
    """
    choices = []

    candidates = google_response.get("candidates", [])
    for i, candidate in enumerate(candidates):
        content_obj = candidate.get("content", {})
        parts = content_obj.get("parts", [])

        # Concatenamos todas las partes de texto
        text = "".join(p.get("text", "") for p in parts if "text" in p)

        finish_reason = candidate.get("finishReason", "STOP").lower()
        if finish_reason == "stop":
            finish_reason = "stop"

        choices.append({
            "message": {
                "role": "assistant",
                "content": text,
            },
            "finish_reason": finish_reason,
            "index": i,
        })

    # Si no hay candidatos (error silencioso de Google), devolvemos mensaje vacío
    if not choices:
        choices.append({
            "message": {"role": "assistant", "content": "⚠️ El modelo no generó respuesta."},
            "finish_reason": "error",
            "index": 0,
        })

    usage_meta = google_response.get("usageMetadata", {})
    usage = {
        "prompt_tokens":     usage_meta.get("promptTokenCount", 0),
        "completion_tokens": usage_meta.get("candidatesTokenCount", 0),
        "total_tokens":      usage_meta.get("totalTokenCount", 0),
    }

    return {
        "choices": choices,
        "usage":   usage,
        "model":   google_response.get("modelVersion", ""),
    }


async def call_google_ai(
    api_key: str,
    model_id: str,
    messages: list,
    temperature: float = 0.4,
    max_tokens: int = 1024,
    stop: Optional[list] = None,
    top_p: float = 0.9,
    timeout: float = 300.0,
    thinking: bool = False,  # Parámetro extra para compatibilidad con LM Studio (no hace nada en Google)

    **kwargs  # Absorbe parámetros extra sin romper nada
) -> dict:
    """
    Función principal: llama a Google AI y devuelve respuesta en formato OpenAI.
    Drop-in replacement de la llamada httpx a LM Studio.

    Returns:
        dict con estructura {"choices": [...], "usage": {...}}
        Compatible con: result["choices"][0]["message"]["content"]
    """
    url, payload = build_google_payload(
        model_id=model_id,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stop=stop,
        top_p=top_p,
        thinking=thinking,
        **kwargs
    )

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
    }

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(url, json=payload, headers=headers)

        if response.status_code != 200:
            error_detail = response.text
            print(f"❌ [GoogleAdapter] Error {response.status_code}: {error_detail[:300]}")
            raise Exception(f"Google AI API error {response.status_code}: {error_detail[:300]}")

        raw = response.json()
        return parse_google_response(raw)