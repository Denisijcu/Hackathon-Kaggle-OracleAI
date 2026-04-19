from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
import httpx
import os
from dotenv import load_dotenv
import base64

load_dotenv()

app = FastAPI()

API_KEY = os.getenv("GOOGLE_AI_API_KEY")
DEFAULT_MODEL_ID = "gemma-4-26b-a4b-it"

class ChatRequest(BaseModel):
    prompt: str
    image_b64: Optional[str] = None
    model_id: Optional[str] = None

@app.post("/chat")
async def chat(req: ChatRequest):
    model_id = req.model_id or DEFAULT_MODEL_ID
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent"
    
    parts = [{"text": req.prompt}]
    
    # Si hay imagen, la agregamos
    if req.image_b64:
        parts.append({
            "inline_data": {
                "mime_type": "image/jpeg",
                "data": req.image_b64
            }
        })
    
    payload = {
        "contents": [{
            "parts": parts
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 2048
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY
    }
    
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(url, json=payload, headers=headers)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.text)
        return r.json()

# Endpoint para subir imagen y convertir a base64
@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    b64 = base64.b64encode(contents).decode('utf-8')
    return {"image_b64": b64}


@app.get("/health")
async def health():
    return {"status": "ok", "backend": "google_gemma"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)