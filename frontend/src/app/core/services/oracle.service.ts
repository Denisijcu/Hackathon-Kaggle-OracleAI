import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { ProfileService } from './profile.service';

import { environment } from '../../../environments/environment';


export interface OracleResponse {
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      reasoning_content?: string;
      tool_calls?: any[];
    };
    logprobs?: any;
    finish_reason: string;
  }>;
  audio_transcription?: string;
  file_type?: string;
  chart_data?: string;
  metadata?: {
    filename?: string;
    filesize?: number;
    pages?: number;
    sheets?: number;
  };
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  id?: string;
  model?: string;
  created?: number;
}

export interface AnalysisError {
  message: string;
  status?: number;
  details?: any;
}




@Injectable({ providedIn: 'root' })
export class OracleService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl; // Usamos la URL del entorno

  // 🔥 AHORA TODAS LAS URLs USAN environment.apiUrl
  private apiUrl = `${environment.apiUrl}/oracle/analyze`;
  private healthUrl = `${environment.apiUrl}/health`;
  private apiUrl4chat = environment.apiUrl;

  // Signals para estado
  isAnalyzing = signal(false);
  lastResponse = signal<OracleResponse | null>(null);
  error = signal<AnalysisError | null>(null);
  isBackendOnline = signal<boolean | null>(null);

  // Configuración
  private readonly TIMEOUT_MS = 60000;
  private readonly MAX_FILE_SIZE_MB = 50;

  private readonly SUPPORTED_EXTENSIONS = [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp',
    'mp4', 'avi', 'mov', 'mkv', 'webm',
    'mp3', 'wav', 'ogg', 'm4a', 'flac',
    'txt', 'pdf', 'docx', 'csv', 'json'
  ];




  // Aqui esta el problema brother. 
  private profileService = inject(ProfileService);

  constructor() {
    this.checkBackendHealth();
  }

  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.get(this.healthUrl).pipe(timeout(180000))
      );
      this.isBackendOnline.set(true);
      console.log('✅ OracleAI Backend conectado (puerto 8080)');
      return true;
    } catch (error) {
      this.isBackendOnline.set(false);
      console.warn('⚠️ OracleAI Backend no disponible');
      return false;
    }
  }

  private validateFileSize(file: File): boolean {
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > this.MAX_FILE_SIZE_MB) {
      this.error.set({
        message: `El archivo excede el límite de ${this.MAX_FILE_SIZE_MB}MB (actual: ${fileSizeMB.toFixed(2)}MB)`
      });
      return false;
    }
    return true;
  }

  private validateFileType(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const isValidType = this.SUPPORTED_EXTENSIONS.includes(extension);

    if (!isValidType) {
      this.error.set({
        message: `Tipo de archivo no soportado. Permitidos: ${this.SUPPORTED_EXTENSIONS.join(', ')}`
      });
      return false;
    }
    return true;
  }

  getFileType(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const videoExts = ['mp4', 'avi', 'mov', 'mkv', 'webm'];
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'flac'];
    const documentExts = ['pdf', 'docx', 'txt'];
    const dataExts = ['csv', 'json'];

    if (imageExts.includes(extension)) return 'image';
    if (videoExts.includes(extension)) return 'video';
    if (audioExts.includes(extension)) return 'audio';
    if (documentExts.includes(extension)) return 'document';
    if (dataExts.includes(extension)) return 'data';
    return 'unknown';
  }

  getFileIcon(file: File): string {
    const type = this.getFileType(file);
    const icons: Record<string, string> = {
      image: '🖼️',
      video: '🎬',
      audio: '🎵',
      document: '📄',
      data: '📊',
      unknown: '📁'
    };
    return icons[type] || icons['unknown'];
  }

  formatResponse(content: string): string {

    if (!content) return '';



    try {

      const parsed = JSON.parse(content);

      if (parsed.text) return parsed.text;

      if (parsed.content) return parsed.content;

      if (parsed.response) return parsed.response;

      if (parsed.message) return parsed.message;

      if (parsed.thought) return parsed.thought;

      if (parsed.description) return parsed.description;

      if (parsed.transcription) return parsed.transcription;

      if (parsed.summary) return parsed.summary;



      if (typeof parsed === 'object' && !Array.isArray(parsed)) {

        const values = Object.values(parsed);

        if (values.length === 1) return String(values[0]);

        return values.join(' ');

      }



      return JSON.stringify(parsed, null, 2);

    } catch {

      return content;

    }

  }

  // Nueva función helper para no ensuciar el método principal
  private applyGemmaFilter(text: string): string {
    if (!text) return '';

    let clean = text;

    // ✂️ FASE 1: LA REGLA DE ORO (Amputar todo lo que esté entre asteriscos)
    // Esto borra: *Role:*, *Style:*, *Wait*, *Self-Correction*, etc.
    clean = clean.replace(/\*[\s\S]*?\*/gi, '');

    // ✂️ FASE 2: TRITURADORA DE HEADERS TÉCNICOS
    const noisePatterns = [
      /The prompt asks[\s\S]*?:/gi,
      /Revised Final Version:/gi,
      /Final Polish:/gi,
      /Option \d+:?/gi,
      /VIC, the AI of Vertex Coders/gi,
      /Direct, brief, natural, in Spanish/gi,
      /Only deliver the final message/gi
    ];

    noisePatterns.forEach(pattern => {
      clean = clean.replace(pattern, '');
    });

    // ✂️ FASE 3: ELIMINAR REPETICIONES (Corte por última ocurrencia)
    // Buscamos si el modelo repitió el saludo o el reporte
    const anchors = [
      "Aquí tienes lo más relevante",
      "De nada. Avísame",
      "Respuesta final:"
    ];

    for (const anchor of anchors) {
      if (clean.includes(anchor)) {
        const parts = clean.split(anchor);
        // Nos quedamos con lo último que dijo después del ancla
        clean = anchor + " " + parts[parts.length - 1];
      }
    }

    // 🛡️ FASE 4: LIMPIEZA DE "BASURA" RESTANTE
    clean = clean
      .replace(/\s+/g, ' ') // Quitar espacios locos
      .replace(/^[ \t]*[•-]/gm, '•') // Normalizar bullets
      .trim();

    // Si el modelo se quedó mudo por el filtro, devolvemos un fallback
    return clean.length > 2 ? clean : text.split('\n').pop()?.trim() || '';
  }

  clearState(): void {
    this.lastResponse.set(null);
    this.error.set(null);
  }

  getLastResponseText(): string {
    const response = this.lastResponse();
    if (!response?.choices?.[0]?.message?.content) return '';
    return this.formatResponse(response.choices[0].message.content);
  }

  hasAudioTranscription(): boolean {
    return !!this.lastResponse()?.audio_transcription;
  }

  getAudioTranscription(): string {
    return this.lastResponse()?.audio_transcription || '';
  }

  getProcessedFileType(): string {
    return this.lastResponse()?.file_type || '';
  }

  async analyzeMedia(prompt: string, mode: string, file?: File | null): Promise<OracleResponse | null> {
    if (!prompt || prompt.trim().length === 0) {
      this.error.set({ message: 'El prompt no puede estar vacío' });
      return null;
    }

    // ✅ Solo verificar el signal, sin hacer round-trip
    if (this.isBackendOnline() === false) {
      console.warn('Backend offline según último health check');
      // No bloquear — intentar igual
    }

    this.isAnalyzing.set(true);
    this.clearState();

    try {
      const currentProfile = this.profileService.getCurrentProfile();
      const currentRole = currentProfile?.role || 'child';
      const lang = localStorage.getItem('oracle_lang') || 'es';

      const activeModel = JSON.parse(localStorage.getItem('vic_active_model') || 'null');
      const modelId = activeModel?.id || 'gemma-4-26b-a4b-it';

      let response: any;

      // 🔥 SOLUCIÓN: Si es modo ASL, usamos un prompt vacío o muy simple

      // 🔥 SOLUCIÓN: Si es modo ASL, usamos prompt según el idioma
      let finalPrompt = prompt;
      if (mode === 'asl') {
        const lang = localStorage.getItem('oracle_lang') || 'es';

        const aslPrompts: Record<string, string> = {
          es: "Traduce el lenguaje de señas que veas en esta imagen. Responde solo la traducción en español.",
          en: "Translate the sign language you see in this image. Respond only with the translation in English.",
          fr: "Traduisez le langage des signes que vous voyez dans cette image. Répondez uniquement avec la traduction en français.",
          pt: "Traduza a linguagem de sinais que você vê nesta imagem. Responda apenas com a tradução em português.",
          it: "Traduci il linguaggio dei segni che vedi in questa immagine. Rispondi solo con la traduzione in italiano.",
          ru: "Переведите язык жестов, который вы видите на этом изображении. Отвечайте только переводом на русский.",
          zh: "翻译你在这张图片中看到的手语。只回答中文翻译。",
          ko: "이 이미지에서 보이는 수어를 번역하세요. 한국어 번역만 응답하세요.",
          hi: "इस छवि में दिख रही सांकेतिक भाषा का अनुवाद करें। केवल हिंदी में अनुवाद के साथ उत्तर दें।"
        };

        finalPrompt = aslPrompts[lang] || aslPrompts['es'];
        console.log(`🤟 [ASL_MODE] Usando prompt en ${lang.toUpperCase()}: ${finalPrompt}`);
      }

      if (file instanceof File) {
        // --- 📸 MODO MULTIMODAL (/analyze) ---
        const isVisionModule = ['blind_guide', 'sentinel', 'vision_sustained'].includes(mode);
        const endpoint = isVisionModule ? '/api/vision/analyze' : '/api/v1/oracle/analyze';
        const finalUrl = `https://Denisijcu-oracle-hub-backend.hf.space${endpoint}`;

        const formData = new FormData();
        formData.append('file', file, file.name);

        // 🎯 SEGÚN TU VISION.PY: prompt, modo, role y lang son Query Params (van en la URL)
        const params = new HttpParams()
          .set('prompt', finalPrompt)
          .set('modo', String(mode).trim())
          .set('role', String(currentRole).trim())
          .set('lang', String(lang).trim())
          .set('model_id', modelId);  // ✅ NUEVO;

        console.log(`📤 [VIC_VISION] Dispatching: ${endpoint} | Mode: ${mode} | Model: ${modelId}`);

        response = await firstValueFrom(
          this.http.post(finalUrl, formData, { params }).pipe(timeout(this.TIMEOUT_MS))
        );
      } else {
        // --- 💬 MODO CHAT PURO (/chat) ---
        const finalUrl = `https://Denisijcu-oracle-hub-backend.hf.space/api/v1/chat`;
        const body = {
          prompt: finalPrompt,
          modo: mode,
          role: currentRole,
          lang: lang,
          model_id: modelId,
          thinking: false,
          messages: [{ role: 'user', content: finalPrompt }]
        };

        console.log(`⚡ [VIC_CHAT] Dispatching: /api/v1/chat | Mode: ${mode} | Model: ${modelId}`);

        response = await firstValueFrom(
          this.http.post(finalUrl, body).pipe(timeout(this.TIMEOUT_MS))
        );
      }

      const oracleResponse = response as OracleResponse;
      this.lastResponse.set(oracleResponse);

      // --- 🚀 PERSISTENCIA ---
      const content = oracleResponse.choices?.[0]?.message?.content;
      if (content && currentProfile) {
        const historyPayload = {
          profile_id: currentProfile.id,
          type: mode,
          prompt: prompt,
          thinking: false,
          response: content,
          file_type: oracleResponse.file_type || (file ? this.getFileType(file) : 'text'),
          file_name: file?.name || 'chat_session'
        };

        await this.profileService.addToHistory(historyPayload);
        await this.saveToHistory(historyPayload);
      }

      return oracleResponse;

    } catch (error: any) {
      console.error('❌ Error crítico en VIC:', error);
      this.error.set({ message: error.message || 'Error de comunicación' });
      return null;
    } finally {
      this.isAnalyzing.set(false);
    }
  }


  // Nuevo método
  private async saveToHistory(data: any) {
    try {
      await firstValueFrom(
        this.http.post('https://Denisijcu-oracle-hub-backend.hf.space/api/v1/history/save', data)
      );
    } catch (error) {
      console.error('Error guardando en historial:', error);
    }
  }


  // Al final del OracleService, junto a los otros getters
  getChartData(): string | null {
    return this.lastResponse()?.chart_data || null;
  }


  async transcribeAudio(audioFile: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioFile);

    // Llamada al backend de Python en el puerto 8080
    const response = await fetch(`${this.apiUrl}/transcribe`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    return data.transcription || ''; // Retorna el texto procesado
  }

  async analyzeVideoUrl(prompt: string, videoUrl: string, mode: string): Promise<OracleResponse | null> {
    const endpoint = `https://Denisijcu-oracle-hub-backend.hf.space/api/v1/oracle/analyze-video-url`;

    // 🛡️ HARDENING: Sincronización exacta con los Query Params de tu FastAPI
    // Tu backend espera: prompt, url, modo, model_id
    const activeModel = JSON.parse(localStorage.getItem('vic_active_model') || 'null');

    const params = new HttpParams()
      .set('prompt', prompt)
      .set('url', videoUrl) // 👈 Cambiado de 'video_url' a 'url' como pide tu main.py
      .set('modo', mode)
      .set('model_id', activeModel?.id || 'gemma-4-26b-a4b-it');

    console.log(`🎬 [ORACLE_VIDEO] Solicitando análisis GET para: ${videoUrl}`);

    try {
      this.isAnalyzing.set(true);

      // 🎯 CAMBIO CRÍTICO: Usamos .get() sin body para coincidir con el backend
      const response = await firstValueFrom(
        this.http.get<OracleResponse>(endpoint, { params }).pipe(timeout(180000))
      );

      this.lastResponse.set(response);
      return response;
    } catch (error) {
      console.error('🚨 [VIC_LINK_ERROR] Error analizando video URL:', error);
      return null;
    } finally {
      this.isAnalyzing.set(false);
    }
  }



  /**
   * Conecta al WebSocket de visión continua
   */
  connectVisionWebSocket(): WebSocket {
    const wsUrl = `wss://denisijcu-oracle-hub-backend.hf.space/api/vision/ws/vision`;
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => console.log('🔌 [SENTINEL_WS] Enlace activo');
    ws.onerror = (err) => console.error('❌ [WS_ERROR]:', err);
    return ws;
  }




  /**
   * Inicia monitoreo continuo en el backend
   */
  async startBackendMonitoring(cameraId: number = 0, mode: string = 'fall_detection'): Promise<any> {
    return firstValueFrom(
      this.http.post(`https://Denisijcu-oracle-hub-backend.hf.space/api/vision/start-monitoring?camera_id=${cameraId}&mode=${mode}`, {})
    );
  }

  /**
   * Detiene monitoreo continuo en el backend
   */
  async stopBackendMonitoring(): Promise<any> {
    return firstValueFrom(
      this.http.post('https://Denisijcu-oracle-hub-backend.hf.space/api/vision/stop-monitoring', {})
    );
  }

  /**
   * Obtiene estado del sistema de visión
   */
  async getVisionStatus(): Promise<any> {
    return firstValueFrom(
      this.http.get('https://Denisijcu-oracle-hub-backend.hf.space/api/vision/status')
    );
  }

  /**
   * Health check del sistema de visión
   */
  async visionHealth(): Promise<any> {
    return firstValueFrom(
      this.http.get('https://Denisijcu-oracle-hub-backend.hf.space/api/vision/health')
    );
  }

  /**
   * Analiza un frame con el backend de visión (detección de caídas)
   */
  async analyzeVisionFrame(frameBase64: string): Promise<any> {
    const formData = new FormData();
    const frameFile = this.base64ToFile(frameBase64, `frame_${Date.now()}.jpg`);
    formData.append('file', frameFile);

    return firstValueFrom(
      this.http.post('https://Denisijcu-oracle-hub-backend.hf.space/api/vision/analyze-frame', formData).pipe(timeout(550000)));
  }

  /**
   * Convierte base64 a File (helper)
   */
  private base64ToFile(base64: string, filename: string): File {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }


  async analyzeVisionSustained(prompt: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    // 🛰️ Apuntamos exactamente al endpoint de vision.py
    const url = `https://Denisijcu-oracle-hub-backend.hf.space/api/vision/analyze?prompt=${encodeURIComponent(prompt)}`;

    return firstValueFrom(
      this.http.post(url, formData).pipe(timeout(120000)) // 30s de margen para Gemma
    );
  }

  // Visión sostenida - endpoint rápido
  async analyzeVision(prompt: string, imageFile: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', imageFile);

    // Usar localhost directo en lugar de this.backendUrl
    const url = `https://Denisijcu-oracle-hub-backend.hf.space/api/vision/analyze?prompt=${encodeURIComponent(prompt)}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
      return await response.json();
    } catch (error) {
      console.error('Vision error:', error);
      throw error;
    }
  }

}