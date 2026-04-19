import {
    Component, signal, inject, computed, Input,
    OnInit, effect, ViewChild, ElementRef, NO_ERRORS_SCHEMA
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OracleService } from '../../core/services/oracle.service';
import { ProfileService } from '../../core/services/profile.service';
import { ActivatedRoute } from '@angular/router';
import { AppComponent } from '../../app';
import { UpperCasePipe } from '@angular/common';
import { AnalyticsPanelComponent } from '../analytics-panel/analytics-panel.component';


type AvailableMode = 'education' | 'health' | 'coding' | 'mental_health' | 'nutrition' |
    'philosophy' | 'theology' | 'archaeology' | 'coach' | 'mentor' |
    'tutor' | 'counselor' | 'rabbi' | 'history' | 'culture' |
    'sports' | 'news' | 'asl' | 'narrator' | 'blind_guide';



@Component({
    selector: 'app-oracle-terminal',
    standalone: true,
    imports: [FormsModule, UpperCasePipe, AnalyticsPanelComponent],  // ✅ Asegúrate de importar el módulo de Markdown
    schemas: [NO_ERRORS_SCHEMA],
    providers: [], // Proveedor para Markdown
    templateUrl: './playground.component.html',
    styleUrls: ['./playground.component.css']
})
export class PlaygroundComponent implements OnInit {
    private oracle = inject(OracleService);
    private profileService = inject(ProfileService);
    private route = inject(ActivatedRoute);

    private currentFacingMode: 'user' | 'environment' = 'environment';


    // ── UI ─────────────────────────────────────────────────────
    userPrompt = signal('');
    isDragging = signal(false);
    showError = signal(false);
    errorMessage = signal('');
    showSuccess = signal(false);
    successMessage = signal('');

    //availableModes = signal<Array<{ id: string, name: string, icon: string }>>([]);




    // ── PREVISUALIZACIÓN ────────────────────────────────────────
    filePreview = signal<string | null>(null);

    public app = inject(AppComponent); // 🚀 INYECCIÓN CLAVE

    // ── SELECTORES DEL SERVICIO ─────────────────────────────────
    isLoading = this.oracle.isAnalyzing;
    rawResponse = this.oracle.lastResponse;
    backendError = this.oracle.error;
    isBackendOnline = this.oracle.isBackendOnline;

    // ── ARCHIVOS ────────────────────────────────────────────────
    fileName = signal<string | null>(null);
    fileSize = signal<string | null>(null);
    fileIcon = signal<string | null>(null);
    selectedFile: File | null = null;
    chartData = signal<string | null>(null);

    // ── MULTIMODAL ──────────────────────────────────────────────
    selectedImage = signal<File | null>(null);
    selectedAudio = signal<File | null>(null);
    imagePreview = signal<string | null>(null);
    audioPreview = signal<string | null>(null);

    // ── COMPUTED — RESPUESTA ────────────────────────────────────
    // Actualiza tu computed aiResponse para que sea un "imán" de texto
    aiResponse = computed(() => {
        const res = this.rawResponse();
        console.log('🔍 [DEBUG] rawResponse completo:', res);

        // 1. Buscar en el contenido estándar
        let content = res?.choices?.[0]?.message?.content || '';
        console.log('🔍 [DEBUG] content del choice:', content);

        // 2. Si está vacío, buscar en el razonamiento (Gemma-4 CoT)
        if (!content && res?.choices?.[0]?.message?.reasoning_content) {
            content = res.choices[0].message.reasoning_content;
            console.log('🔍 [DEBUG] usando reasoning_content:', content);
        }

        // 3. Si sigue vacío, buscar en la transcripción de audio
        if (!content && res?.audio_transcription) {
            content = `🎙️ **Transcripción de Audio:**\n\n${res.audio_transcription}`;
            console.log('🔍 [DEBUG] usando audio_transcription:', content);
        }

        const formatted = this.oracle.formatResponse(content);
        console.log('🔍 [DEBUG] después de formatResponse:', formatted);

        return formatted;
    });

    hasAudioTranscription = computed(() => this.oracle.hasAudioTranscription());
    audioTranscription = computed(() => this.oracle.getAudioTranscription());
    processedFileType = computed(() => this.oracle.getProcessedFileType());


    // ── ACCESS CONTROL SIGNALS (EL SISTEMA DE PERMISOS) ──────────
    canUseCoding = computed(() => this.profileService.hasPermission('mode_coding'));
    canUseNutrition = computed(() => this.profileService.hasPermission('mode_nutrition'));
    canUseMentalHealth = computed(() => this.profileService.hasPermission('mode_mental_health'));
    canUseHistory = computed(() => this.profileService.hasPermission('mode_history'));
    canUseCulture = computed(() => this.profileService.hasPermission('mode_culture'));

    canUploadPdf = computed(() => this.profileService.hasPermission('upload_pdf'));
    canUploadVideo = computed(() => this.profileService.hasPermission('upload_video'));
    canUploadCsv = computed(() => this.profileService.hasPermission('upload_csv'));
    canUploadJson = computed(() => this.profileService.hasPermission('upload_json'));

    canUseLiveVision = computed(() => this.profileService.hasPermission('live_vision'));
    canUseVideoUrl = computed(() => this.profileService.hasPermission('video_url'));
    canViewHistory = computed(() => this.profileService.hasPermission('view_history'));
    canChangeLanguage = computed(() => this.profileService.hasPermission('change_language'));
    canClearAll = computed(() => this.profileService.hasPermission('clear_all'));

    // ── MODOS DINÁMICOS (PARA EL @FOR DEL HTML) ─────────────────
    availableModes = computed(() => {
        const base = [
            { id: 'education', icon: '🎓', label: 'Education' },
            { id: 'health', icon: '🏥', label: 'Health' },
        ];
        const extended = [
            { id: 'coding', icon: '💻', label: 'Coding', guard: this.canUseCoding() },
            { id: 'nutrition', icon: '🍎', label: 'Nutrition', guard: this.canUseNutrition() },
            { id: 'mental_health', icon: '🧠', label: 'Mental Health', guard: this.canUseMentalHealth() },
            { id: 'history', icon: '📜', label: 'History', guard: this.canUseHistory() },
            { id: 'culture', icon: '🌍', label: 'Culture', guard: this.canUseCulture() },

        ];
        return [...base, ...extended.filter(m => m.guard)];
    });

    selectedMode = signal<string>('education');

    // ── ATRIBUTO ACCEPT DINÁMICO (EL BLOQUE B) ──────────────────
    allowedFileTypes = computed(() => {
        const types = ['image/*', 'audio/*', '.txt'];
        if (this.canUploadPdf()) types.push('.pdf');
        if (this.canUploadVideo()) types.push('video/*');
        if (this.canUploadCsv()) types.push('.csv');
        if (this.canUploadJson()) types.push('.json', '.docx', '.doc');
        return types.join(',');
    });

    // ── COMPUTED — MODO ─────────────────────────────────────────
    modeIcon = computed(() => {
        const icons: Record<string, string> = {
            coding: '💻', mental_health: '🧠',
            nutrition: '🍎', health: '🏥', education: '🎓'
        };
        return icons[this.selectedMode()] ?? '🎓';
    });

    modeTitle = computed(() => {
        const mode = this.selectedMode();
        const lang = this.app.selectedLanguage(); // Detectamos el idioma actual

        // 1. Obtenemos el nombre del modo desde el diccionario global
        // Si no hay traducción, el fallback ahora es 'EDUCATION'
        const name = this.app.dashboardTranslations().names[mode] || 'EDUCATION';

        // 2. Definimos el prefijo según el idioma (Default: MODE)
        const prefix = (lang === 'es') ? 'MODO ' : 'MODE ';

        // 3. Retornamos todo en Mayúsculas
        return `${prefix}${name}`.toUpperCase();
    });

    // ── COMPUTED — LOGS ─────────────────────────────────────────
    reasoningLog = computed(() => {
        // 📡 LEEMOS EL MODO DIRECTAMENTE AL INICIO
        const currentMode = this.selectedMode();
        const currentTitle = this.modeTitle();

        // Almacenamos los estados actuales para forzar la dependencia
        const loading = this.isLoading();
        const response = this.aiResponse();
        const error = this.backendError();

        const logs: string[] = ['🛰️ ORACLE AI v4.1 INICIALIZADO'];

        logs.push(`📡 BACKEND: ${this.isBackendOnline() ? 'CONECTADO :8080' : 'OFFLINE'}`);

        // 🎯 AQUÍ SE REFLEJARÁ EL CAMBIO
        logs.push(`🎯 MODO: ${currentTitle}`);

        //logs.push('MODO SELECCIONADO: ' + currentMode.toUpperCase());

        if (this.fileName()) logs.push(`📂 DATA_INPUT: ${this.fileName()} (${this.fileSize()})`);

        if (loading) {
            logs.push('🧠 ANALIZANDO DATA MULTIMODAL EN VIC...');
        }

        if (this.hasAudioTranscription()) logs.push('🎵 TRANSCRIPCIÓN DE AUDIO COMPLETA');

        if (response) {
            logs.push('✅ ANÁLISIS FINALIZADO');
        }

        if (error) {
            logs.push(`❌ SYSTEM_ERROR: ${error.message}`);
        }

        return logs;
    });

    // ── AUDIO (GRABACIÓN) ───────────────────────────────────────
    isRecording = signal(false);
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];

    // ── TTS ─────────────────────────────────────────────────────
    isSpeaking = signal(false);
    private synth = window.speechSynthesis;

    // ── CÁMARA ──────────────────────────────────────────────────
    isCameraActive = signal(false);
    private videoStream: MediaStream | null = null;


    // ── VISIÓN CONTINUA (LIVE VISION) ────────────────────────────
    private visionInterval: any = null;
    liveVisionActive = signal(false);
    liveVisionResponse = signal<string | null>(null);
    lastSceneDescription = signal<string>("");
    sceneChangeThreshold = 0.3;
    previousFrameHash = signal<string>("");




    // ViewChild simple — Angular lo actualiza en cada ciclo de CD,
    // incluido cuando el @if crea el <video #cameraVideo> dinámicamente.
    @ViewChild('cameraVideo') set cameraVideo(content: ElementRef<HTMLVideoElement>) {
        if (content && this.videoStream) {
            const videoEl = content.nativeElement;
            videoEl.srcObject = this.videoStream;
            // Forzamos el play con una pequeña demora para asegurar que el buffer esté listo
            videoEl.onloadedmetadata = () => {
                videoEl.play().catch(err => console.error("Error Autoplay:", err));
            };
        }
    }

    // Flag para que ngAfterViewChecked asigne srcObject solo UNA vez
    // y no en cada ciclo de change detection posterior.
    private cameraAttached = false;
    private isProcessingFrame = false;

    // ── VIDEO URL ────────────────────────────────────────────────
    videoUrl = signal('');

    public selectedLanguage = signal<string>(localStorage.getItem('oracle_lang') || 'es');
    // 1. Añade este mapeo de idiomas al principio de tu componente o servicio
    private readonly languageMap: { [key: string]: string } = {
        'es': 'es-ES',
        'en': 'en-US',
        'fr': 'fr-FR',
        'pt': 'pt-PT',
        'de': 'de-DE'
    };

    // ────────────────────────────────────────────────────────────
    constructor() {
        effect(() => {
            const error = this.backendError();
            if (error) this.showTemporaryError(error.message);
        });
    }

    ngOnInit() {
        this.checkBackendStatus();

        // 🎯 CAPTURA INSTANTÁNEA (Snapshot)
        // Esto es mucho más rápido que el subscribe para inicializar la UI
        const modeFromUrl = this.route.snapshot.queryParams['mode'];
        if (modeFromUrl) {
            this.selectedMode.set(modeFromUrl);
            this.modeTitle;
            console.log(`🚀 [VIC_INIT] Modo capturado por Snapshot: ${modeFromUrl}`);
        }

        // Mantenemos el subscribe por si el usuario cambia de modo estando dentro
        this.route.queryParams.subscribe(params => {
            if (params['mode'] && params['mode'] !== this.selectedMode()) {
                this.selectedMode.set(params['mode']);

                // Si es visión, activamos motores
                if (['asl', 'narrator'].includes(params['mode'])) {
                    this.startCamera().then(() => this.startLiveVision());
                }
            }
            if (params['prompt']) this.userPrompt.set(params['prompt']);
        });
    }







    // Se ejecuta después de CADA ciclo de CD — aquí sí el @if ya resolvió
    // y cameraVideoEl apunta al <video> recién creado en el DOM.

    async checkBackendStatus() {
        const isOnline = await this.oracle.checkBackendHealth();
        isOnline
            ? this.showTemporarySuccess('VIC CORE ONLINE', 2000)
            : this.showTemporaryError('BACKEND OFFLINE');
    }

    // ── DRAG & DROP ─────────────────────────────────────────────
    onDragOver(event: DragEvent) { event.preventDefault(); this.isDragging.set(true); }
    onDragLeave() { this.isDragging.set(false); }

    onDrop(event: DragEvent) {
        event.preventDefault();
        this.isDragging.set(false);
        const file = event.dataTransfer?.files[0];
        if (file) this.processSelectedFile(file);
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files?.[0]) this.processSelectedFile(input.files[0]);
    }

    private processSelectedFile(file: File) {
        console.log(`📡 [VIC_INPUT] Procesando: ${file.name} | Tipo: ${file.type}`);

        // Limpiar previsualizaciones anteriores para no saturar la RAM de la Pi
        if (this.filePreview()) URL.revokeObjectURL(this.filePreview()!);

        const previewUrl = URL.createObjectURL(file);
        this.filePreview.set(previewUrl); // <--- ESTO ES LO QUE FALTABA
        this.selectedFile = file;
        this.fileName.set(file.name);
        this.fileSize.set(this.formatFileSize(file.size));

        if (file.type.startsWith('image/')) {
            this.selectedImage.set(file);
            this.imagePreview.set(previewUrl);
            this.fileIcon.set('🖼️');
        } else if (file.type.startsWith('audio/')) {
            this.selectedAudio.set(file);
            this.audioPreview.set(previewUrl);
            this.fileIcon.set('🎙️');
        } else {
            this.fileIcon.set(this.oracle.getFileIcon(file));
        }

        this.showTemporarySuccess(`ARCHIVO CARGADO: ${file.name.toUpperCase()}`, 1500);
    }

    async sendToVIC() {
        const promptValue = this.userPrompt();
        const mode = this.selectedMode();
        const file = this.selectedFile;

        if (!promptValue.trim() && !file) return;

        try {
            const response = await this.oracle.analyzeMedia(promptValue, mode, file);

            if (response?.choices?.[0]?.message?.content) {
                const aiContent = response.choices[0].message.content;

                await this.profileService.addToHistory({
                    type: mode,
                    prompt: promptValue,
                    response: aiContent,
                    filetype: response.file_type || undefined,
                    filename: file?.name || undefined
                });

                // ← BORRA ESTA LÍNEA, analyzeMedia ya la setea internamente
                // this.oracle.lastResponse.set(response); 

                console.log('✅ Respuesta de VIC:', response);
                this.showTemporarySuccess('ANÁLISIS VERTEX COMPLETADO');
            }
        } catch (err) {
            this.showTemporaryError('FALLO DE SINCRONIZACIÓN EN VIC');
        }
    }

    clearFile() {
        if (this.filePreview()) URL.revokeObjectURL(this.filePreview()!);
        this.selectedFile = null;
        this.fileName.set(null);
        this.fileSize.set(null);
        this.fileIcon.set(null);
        this.filePreview.set(null);
    }

    clearAll() {
        this.clearFile();
        this.userPrompt.set('');
        this.chartData.set(null);
        this.oracle.clearState();
    }

    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    private showTemporaryError(message: string) {
        this.errorMessage.set(message);
        this.showError.set(true);
        setTimeout(() => this.showError.set(false), 4000);
    }

    private showTemporarySuccess(message: string, duration = 3000) {
        this.successMessage.set(message);
        this.showSuccess.set(true);
        setTimeout(() => this.showSuccess.set(false), duration);
    }

    // ── GRABACIÓN DE AUDIO ───────────────────────────────────────
    async toggleRecording() {
        this.isRecording() ? this.stopRecording() : await this.startRecording();
    }

    private async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data);

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                const audioFile = new File([audioBlob], 'voice_query.wav', { type: 'audio/wav' });
                this.processSelectedFile(audioFile);

                try {
                    this.showTemporarySuccess('TRANSCRIBIENDO VOZ...', 1500);
                    const transcription = await this.oracle.transcribeAudio(audioFile);
                    if (transcription) {
                        const current = this.userPrompt();
                        this.userPrompt.set(current ? `${current} ${transcription}` : transcription);
                        this.showTemporarySuccess('VOZ PROCESADA CON ÉXITO', 1000);
                        // 🔥 NUEVO: Envío automático después de transcribir
                        setTimeout(() => {
                            this.sendToVIC();
                        }, 500);
                    }
                } catch (err) {
                    console.error('Error en transcripción:', err);
                    this.showTemporaryError('FALLO AL TRANSCRIBIR AUDIO');
                }
            };

            this.mediaRecorder.start();
            this.isRecording.set(true);
        } catch {
            this.showTemporaryError('ERROR AL ACCEDER AL MICRÓFONO');
        }
    }

    private stopRecording() {
        this.mediaRecorder?.stop();
        this.isRecording.set(false);
        this.mediaRecorder?.stream.getTracks().forEach(t => t.stop());
    }

    // ── TTS ─────────────────────────────────────────────────────
    speakResponse(text?: string) {

        const speechText = text || this.aiResponse();
        if (!speechText || this.isSpeaking()) return;

        this.synth.cancel();

        // 1. LIMPIEZA VERTEX (4000 chars)
        const cleanText = speechText
            .replace(/[*#$_\-`]/g, '')
            .replace(/!\[.*?\]\(.*?\)/g, '')
            .substring(0, 4000);

        const utterance = new SpeechSynthesisUtterance(cleanText);

        // 2. RECUPERACIÓN DIRECTA DE LOCALSTORAGE 🌍
        // Leemos el idioma que guardamos en el Navbar
        const storedLang = localStorage.getItem('oracle_lang') || 'es';

        const langMap: any = {
            'es': 'es-ES',
            'en': 'en-US',
            'fr': 'fr-FR',
            'pt': 'pt-PT'
        };

        utterance.lang = langMap[storedLang] || 'es-ES';

        // Log de seguridad para confirmar el motor de voz
        console.log(`🎙️ TTS_ENGINE: Hablando en [${utterance.lang}]`);

        // 3. CONFIGURACIÓN DE VOZ
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        // 4. GESTIÓN DE ESTADOS
        utterance.onstart = () => this.isSpeaking.set(true);
        utterance.onend = () => this.isSpeaking.set(false);
        utterance.onerror = (err) => {
            this.isSpeaking.set(false);
            console.error("TTS_ENGINE_ERROR:", err);
        };

        this.synth.speak(utterance);
    }

    stopSpeaking() {
        this.synth.cancel();
        this.isSpeaking.set(false);
    }

    // ── CÁMARA ───────────────────────────────────────────────────
    async toggleCamera() {
        this.isCameraActive() ? this.stopCamera() : await this.startCamera();
    }

    private async startCamera() {
        try {
            // 🔥 CÁMARA TRASERA (environment) para ver el entorno
            this.videoStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: { exact: "environment" }  // ← CLAVE: cámara trasera
                },
                audio: false
            });

            this.isCameraActive.set(true);
            this.showTemporarySuccess('📷 CÁMARA TRASERA ACTIVADA (VISIÓN DE ENTORNO)', 1500);
        } catch (err) {
            console.error("Camera Error:", err);

            // 🔥 FALLBACK: Si no hay cámara trasera, usa la que haya
            try {
                this.videoStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: "environment"  // sin exact, más flexible
                    },
                    audio: false
                });
                this.isCameraActive.set(true);
                this.showTemporarySuccess('📷 CÁMARA DE ENTORNO ACTIVADA', 1500);
            } catch (fallbackErr) {
                // Último recurso: cámara por defecto
                try {
                    this.videoStream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false
                    });
                    this.isCameraActive.set(true);
                    this.showTemporarySuccess('📷 CÁMARA PREDETERMINADA ACTIVADA', 1500);
                } catch (finalErr) {
                    this.showTemporaryError('ERROR AL ACCEDER A LA CÁMARA');
                }
            }
        }
    }

    stopCamera() {
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(t => t.stop());
            this.videoStream = null;
        }
        this.isCameraActive.set(false);
    }

    capturePhoto() {
        // querySelector es seguro aquí porque la cámara está activa
        const video = document.querySelector('video') as HTMLVideoElement;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `snap_${Date.now()}.jpg`, { type: 'image/jpeg' });
                this.processSelectedFile(file);
                this.stopCamera();
            }
        }, 'image/jpeg', 0.9);
    }

    // ── VISIÓN CONTINUA ─────────────────────────────────────────
    captureFrameAsBase64(): string | null {
        const videoElement = document.querySelector('video') as HTMLVideoElement;
        if (!videoElement || videoElement.readyState < 2) return null;

        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let sum = 0;
        for (let i = 0; i < imageData.data.length; i += 100) {
            sum += imageData.data[i];
        }
        this.previousFrameHash.set(sum.toString());

        return canvas.toDataURL('image/jpeg', 0.6);
    }

    private base64ToFile(base64: string, filename: string): File {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }

    private calculateSimilarity(a: string, b: string): number {
        const wordsA = new Set(a.toLowerCase().split(' '));
        const wordsB = new Set(b.toLowerCase().split(' '));
        const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
        const union = new Set([...wordsA, ...wordsB]);
        return intersection.size / union.size;
    }

    private async restartCamera() {
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
        }
        await this.startCamera();
    }


    async startLiveVision() {
        if (this.visionInterval) return;

        this.liveVisionActive.set(true);
        this.isProcessingFrame = false;
        this.showTemporarySuccess('👁️ VISIÓN CONTINUA ACTIVADA', 2000);

        this.visionInterval = setInterval(async () => {
            if (!this.isCameraActive()) {
                this.stopLiveVision();
                return;
            }

            if (this.isProcessingFrame) return;

            const frameBase64 = this.captureFrameAsBase64();
            if (!frameBase64) return;

            this.isProcessingFrame = true;

            try {
                const frameFile = this.base64ToFile(frameBase64, `frame_${Date.now()}.jpg`);
                const currentMode = this.selectedMode(); // 🎯 'asl' o 'narrator'

                // 📝 DINAMISMO VERTEX: El prompt cambia según el agente
                let dynamicPrompt = `Describe brevemente lo que ves (máx 15 palabras).`;



                const response = await this.oracle.analyzeMedia(dynamicPrompt, currentMode, frameFile);

                if (response?.choices?.[0]?.message?.content) {
                    const description = response.choices[0].message.content;
                    this.liveVisionResponse.set(description);

                    const lastDesc = this.lastSceneDescription();

                    // Umbral de similitud para no saturar el audio
                    if (!lastDesc || this.calculateSimilarity(lastDesc, description) < this.sceneChangeThreshold) {
                        this.speakResponse(description);
                        this.lastSceneDescription.set(description);
                    }
                }
            } catch (error) {
                console.error('⚠️ Error en Live Vision:', error);
                this.liveVisionResponse.set("Error de sincronización con VIC...");
            } finally {
                this.isProcessingFrame = false;
            }
        }, 8000);
    }

    stopLiveVision() {
        if (this.visionInterval) {
            clearInterval(this.visionInterval);
            this.visionInterval = null;
        }
        this.liveVisionActive.set(false);
        this.liveVisionResponse.set(null);
        this.showTemporarySuccess('👁️ VISIÓN CONTINUA DESACTIVADA', 1500);
    }


    async analyzeVideoUrl() {
        const url = this.videoUrl();
        if (!url) return;

        const promptValue = this.userPrompt() || "Describe lo que ves en este video, escena por escena.";
        const mode = this.selectedMode();

        this.isLoading.set(true);

        try {
            const response = await this.oracle.analyzeVideoUrl(promptValue, url, mode);
            if (response?.choices?.[0]?.message?.content) {
                this.oracle.lastResponse.set(response);
                this.showTemporarySuccess('🎬 VIDEO ANALIZADO CON ÉXITO');

                // Guardar en historial
                await this.profileService.addToHistory({
                    type: mode,
                    prompt: `[VIDEO URL] ${promptValue}`,
                    response: response.choices[0].message.content,
                    filetype: 'video_url',
                    filename: 'video_online'
                });
            }
        } catch (error) {
            console.error('Error analizando video:', error);
            this.showTemporaryError('ERROR AL ANALIZAR EL VIDEO');
        } finally {
            this.isLoading.set(false);
        }
    }


    changeLanguage(lang: 'es' | 'en' | 'fr' | 'pt') {
        this.selectedLanguage.set(lang);
        localStorage.setItem('oracle_lang', lang);

        // Opcional: Notificar al usuario con tu método de éxito
        this.showTemporarySuccess(`IDIOMA: ${lang.toUpperCase()}`, 1500);

        // Si el Oracle estaba hablando, cancelamos para que no termine en el idioma viejo
        if (this.isSpeaking()) {
            this.synth.cancel();
            this.isSpeaking.set(false);
        }
    }

    async switchCamera() {
        this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';

        if (this.isCameraActive()) {
            await this.restartCamera();
        }
    }


}