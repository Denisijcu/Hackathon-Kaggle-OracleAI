import {
  Component, signal, inject, ElementRef,
  ViewChild, computed, OnDestroy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OracleService } from '../../core/services/oracle.service';
import { AppComponent } from '../../app';


import { AnalyticsPanelComponent } from './analytics-panel/analytics-panel.component';
// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type ThreatType = 'fall' | 'intruder' | 'wolf' | 'dangerous_animal' | 'fire' | 'weapon' | 'medical' | 'unknown';
export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low';
export type VisionMode = 'vigilancia' | 'conversacion';
export type SentinelStatus = 'idle' | 'scanning' | 'alert' | 'offline';

export interface Threat {
  id: string;
  type: ThreatType;
  severity: ThreatSeverity;
  message: string;
  description: string;
  timestamp: number;
  frameSnapshot?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isAlert?: boolean;
}

export interface SentinelStats {
  totalScans: number;
  threatsDetected: number;
  uptime: number;
  lastScanMs: number;
}

export interface Agent {
  id: string;
  name: string;
  icon: string;
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const THREAT_PATTERNS: Array<{
  type: ThreatType; severity: ThreatSeverity;
  keywords: string[]; message: string; description: string;
}> = [
    {
      type: 'fall', severity: 'high',
      keywords: ['caida', 'caido', 'cayo', 'fallen', 'fell', 'fall', 'lying', 'on the floor', 'on the ground',
        'person fallen', 'has fallen', 'lying down', 'collapsed', 'ground', 'elderly', 'person on floor', 'tumbado', 'suelo', 'tirado'],
      message: '¡CAÍDA DETECTADA!', description: 'Persona en el suelo detectada. Posible emergencia médica.'
    },
    {
      type: 'fire', severity: 'critical',
      keywords: ['fuego', 'fire', 'humo', 'smoke', 'incendio', 'llamas', 'flames', 'burning', 'ardiendo', 'combustion'],
      message: '¡ALERTA DE FUEGO!', description: 'Fuego o humo detectado. Evacuar inmediatamente.'
    },
    {
      type: 'intruder', severity: 'high',
      keywords: ['intruso', 'ladron', 'thief', 'intruder', 'robber',
        'unauthorized', 'suspicious person', 'burglar', 'masked',
        'persona sospechosa', 'sospechoso', 'extraño', 'stranger',
        'entrando', 'breaking in', 'forzando', 'force entry',
        'trepando', 'climbing', 'saltando', 'jumping',
        'persona no autorizada', 'acceso no autorizado',
        'merodeando', 'merodeador', 'sneaking', 'escondido',
        'mask', 'pasamontañas', 'capucha', 'hood'],
      message: '¡INTRUSO DETECTADO!', description: 'Persona no autorizada detectada en el área.'
    },
    {
      type: 'weapon', severity: 'critical',
      keywords: ['arma', 'weapon', 'gun', 'knife', 'cuchillo', 'pistola', 'armed', 'armado', 'rifle', 'firearm'],
      message: '¡ARMA DETECTADA!', description: 'Posible arma visible en el área. Máxima precaución.'
    },
    {
      type: 'medical', severity: 'critical',
      keywords: ['unconscious', 'inconsciente', 'convulsion', 'seizure', 'not moving', 'sin movimiento', 'unresponsive', 'cardiac'],
      message: '¡EMERGENCIA MÉDICA!', description: 'Posible emergencia médica detectada.'
    },
    {
      type: 'wolf', severity: 'critical',
      keywords: ['lobo', 'wolf', 'wolves', 'manada'],
      message: '¡LOBO DETECTADO!', description: 'Animal salvaje peligroso en el área.'
    },
    {
      type: 'dangerous_animal', severity: 'critical',
      keywords: ['puma', 'leon', 'tiger', 'bear', 'oso', 'serpent', 'snake', 'serpiente', 'cougar', 'jaguar', 'panther'],
      message: '¡ANIMAL PELIGROSO!', description: 'Animal salvaje peligroso detectado en el área.'
    }
  ];

const SURVEILLANCE_PROMPT = `You are a professional AI security system. Analyze this image for threats.

RESPOND ONLY in this exact format:
STATUS: [CLEAR or THREAT]
TYPE: [fall/fire/intruder/weapon/medical/animal or NONE]
DETAIL: [one sentence description, max 15 words]

Examples:
STATUS: THREAT
TYPE: fall
DETAIL: Elderly person lying motionless on the floor.

STATUS: CLEAR
TYPE: NONE
DETAIL: Empty room, no threats detected.

Be concise. No extra text.`;

const CONVERSATION_BG_PROMPT = `Security scan only. Look for: fallen person, fire, intruder, weapon, unconscious person.
If any threat: respond "THREAT: [type] - [5 word description]"
If safe: respond "CLEAR"
Nothing else.`;

// Sistema de prompts por agente e idioma
const AGENT_PROMPTS: Record<string, Record<string, string>> = {
  es: {
    general: "Eres VIC, la IA de Vertex Coders. Responde de forma directa, breve y natural en español. Solo entrega el mensaje final.",
    translator: "Traduce el texto al idioma indicado. Responde ÚNICAMENTE con la traducción, sin explicaciones ni etiquetas.",
    coding: "Eres un experto en software. Entrega solo el código limpio y funcional. Usa Markdown para los bloques de código.",
    math: "Eres un experto en cálculo. Entrega solo el resultado final de la operación.",
    vision: "Analiza la imagen y responde a la pregunta del usuario de forma descriptiva y profesional. Si ves productos, detalla nombres y precios."
  },
  en: {
    general: "You are VIC, Vertex Coders' AI core. Respond directly and naturally in English. Only provide the final message.",
    translator: "Translate to the requested language. Respond ONLY with the translation.",
    vision: "Analyze the image and answer the user's question directly. List products and prices if visible."
  },
  fr: {
    general: "Vous êtes VIC, l'IA de Vertex Coders. Répondez directement et naturellement en français. Uniquement le message final.",
    vision: "Analysez l'image et répondez à la question de l'utilisateur en français. Listez les produits et les prix si visibles.\n\nRéponse finale:",
    translator: "Traduisez le texte. Répondez UNIQUEMENT avec la traduction."
  },
  pt: {
    general: "Você é VIC, a IA da Vertex Coders. Responda de forma direta e natural em português. Apenas a mensagem final.",
    vision: "Analise a imagem e responda à pergunta do usuário em português. Liste produtos e preços se visíveis.\n\nResposta final:",
    translator: "Traduza o texto. Responda APENAS com a tradução."
  },
  de: {
    general: "Sie sind VIC, die KI von Vertex Coders. Antworten Sie direkt und auf Deutsch. Nur die finale Nachricht.",
    vision: "Analysieren Sie das Bild und beantworten Sie die Frage auf Deutsch. Listen Sie Produkte und Preise auf, falls sichtbar.\n\nEndgültige Antwort:",
    translator: "Übersetzen Sie den Text. Antworten Sie NUR mit der Übersetzung."
  },
  it: {
    general: "Sei VIC, l'IA di Vertex Coders. Rispondi in modo diretto e naturale in italiano. Solo il messaggio finale.",
    vision: "Analizza l'immagine e rispondi alla domanda in italiano. Elenca prodotti e prezzi se visibili.\n\nRisposta finale:",
    translator: "Traduci il testo. Rispondi SOLO con la traduzione."
  },
  zh: {
    general: "你是一个直接且专业的助手。请仅提供最终回复。",
    vision: "分析图像并回答用户的问题。如果看到产品，请列出名称和价格。\n\n最终回答：",
    translator: "请翻译这段文字。只提供翻译结果。"
  },
  ko: {
    general: "당신은 직접적이고 전문적인 비서입니다. 최종 답변만 제공하십시오.",
    vision: "이미지를 분석하고 사용자의 질문에 답변하십시오. 제품이 보이면 이름과 가격을 나열하십시오.\n\n최종 답변:",
    translator: "이 텍스트를 번역하십시오. 번역 결과만 제공하십시오."
  },
  ru: {
    general: "Вы — прямой и профессиональный помощник. Предоставляйте только окончательный ответ.",
    vision: "Проанализируйте изображение и ответьте на вопрос пользователя. Перечислите названия товаров и цены.\n\nОкончательный ответ:",
    translator: "Переведите этот текст. Предоставьте только перевод."
  },
  hi: {
    general: "आप एक सीधे और पेशेवर सहायक हैं। केवल अंतिम उत्तर दें।",
    vision: "छवि का विश्लेषण करें और उपयोगकर्ता के प्रश्न का उत्तर दें। उत्पादों और कीमतों की सूची बनाएं।\n\nअंतिम उत्तर:",
    translator: "इस पाठ का अनुवाद करें। केवल अनुवाद प्रदान करें।"
  }
};

const AVAILABLE_AGENTS: Agent[] = [
  { id: 'general', name: 'General', icon: '🎯' },
  { id: 'translator', name: 'Traductor', icon: '🌐' },
  { id: 'math', name: 'Matemáticas', icon: '📐' },
  { id: 'coding', name: 'Código', icon: '💻' },
  { id: 'history', name: 'Historia', icon: '📜' },
  { id: 'philosophy', name: 'Filosofía', icon: '🧠' },
  { id: 'theology', name: 'Teología', icon: '✝️' },
  { id: 'archaeology', name: 'Arqueología', icon: '🏺' },
  { id: 'physics', name: 'Física', icon: '⚛️' },
  { id: 'chemistry', name: 'Química', icon: '🧪' },
  { id: 'biology', name: 'Biología', icon: '🧬' },
  { id: 'finance', name: 'Finanzas', icon: '📈' },
  { id: 'coach', name: 'Entrenador', icon: '💪' },
  { id: 'mentor', name: 'Mentor', icon: '🧭' },
  { id: 'counselor', name: 'Consejero', icon: '🫂' },
  { id: 'chef', name: 'Chef', icon: '👨‍🍳' },
  { id: 'doctor', name: 'Médico', icon: '⚕️' },
  { id: 'lawyer', name: 'Abogado', icon: '⚖️' },
  { id: 'psychologist', name: 'Psicólogo', icon: '🧘' },
  { id: 'teacher', name: 'Profesor', icon: '📚' },
  { id: 'writer', name: 'Escritor', icon: '✍️' },
  { id: 'scientist', name: 'Científico', icon: '🔬' },
  { id: 'engineer', name: 'Ingeniero', icon: '⚙️' },
  { id: 'artist', name: 'Artista', icon: '🎨' },
  { id: 'nutritionist', name: 'Nutricionista', icon: '🥗' },
  { id: 'astronomer', name: 'Astrónomo', icon: '🔭' },
  { id: 'geologist', name: 'Geólogo', icon: '🪨' },
  { id: 'economist', name: 'Economista', icon: '💹' },
];

// Mapa de idiomas para TTS
const TTS_LANG_MAP: Record<string, string> = {
  es: 'es-ES', en: 'en-US', fr: 'fr-FR', pt: 'pt-PT',
  de: 'de-DE', it: 'it-IT', ru: 'ru-RU', zh: 'zh-CN',
  ko: 'ko-KR', ja: 'ja-JP', ar: 'ar-SA', hu: 'hu-HU',
};

// Mapa de idiomas para traducción
const TRANSLATE_LANG_NAMES: Record<string, string[]> = {
  en: ['inglés', 'english', 'anglais', 'inglese', 'englisch'],
  es: ['español', 'spanish', 'espagnol', 'spagnolo', 'spanisch'],
  fr: ['francés', 'frances', 'french', 'français', 'francese', 'französisch'],
  pt: ['portugués', 'portugues', 'portuguese', 'português', 'portoghese', 'portugiesisch'],
  de: ['alemán', 'aleman', 'german', 'deutsch', 'allemand', 'tedesco'],
  it: ['italiano', 'italian', 'italien'],
  ru: ['ruso', 'russian', 'russe', 'russo', 'russisch'],
  zh: ['chino', 'chinese', 'chinois', 'cinese', 'chinesisch', 'mandarin'],
  ko: ['coreano', 'korean', 'coréen', 'coreano', 'koreanisch'],
  ja: ['japonés', 'japones', 'japanese', 'japonais', 'giapponese', 'japanisch'],
  ar: ['árabe', 'arabe', 'arabic', 'arabe', 'arabisch'],
};

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-vs-reserva',
  standalone: true,
  imports: [CommonModule, FormsModule, AnalyticsPanelComponent],
  templateUrl: './vs-reserva.component.html',
  styleUrl: './vs-reserva.component.css'
})
export class VsReservaComponent implements OnDestroy {

  public app = inject(AppComponent);
  private oracleService = inject(OracleService);
  private cdr = inject(ChangeDetectorRef);

  // ── Signals generales ──
  public isCameraActive = signal(false);
  public isAiActive = signal(false);
  public isProcessing = signal(false);
  public visionMode = signal<VisionMode>('vigilancia');
  public sentinelStatus = signal<SentinelStatus>('idle');
  public lastAnalysis = signal('Sistema listo.');
  public sentinelStats = signal<SentinelStats>({ totalScans: 0, threatsDetected: 0, uptime: 0, lastScanMs: 0 });
  public scanProgress = signal(0);
  public showThreatHistory = signal(false);
  public activeThreat = signal<Threat | null>(null);
  public threatHistory = signal<Threat[]>([]);
  public isThreatDetected = signal(false);

  // ── Conversación ──
  public chatMessages = signal<ChatMessage[]>([]);
  public userInput = signal('');
  public isListening = signal(false);
  public isSpeaking = signal(false);

  // ── Always Listening ──
  public isAlwaysListening = signal(false);
  public alwaysListeningTranscript = signal('');

  // ── Agentes ──
  public currentAgent = signal<string>('general');
  public availableAgents = signal<Agent[]>(AVAILABLE_AGENTS);
  public showAllAgents = signal(false);

  // ── Computed ──
  t = computed(() => this.app.visionTranslations());

  @ViewChild('videoStream') videoStream!: ElementRef<HTMLVideoElement>;
  @ViewChild('chatContainer') chatContainer!: ElementRef<HTMLDivElement>;

  // ── Privados de infraestructura ──
  private alertAudio: HTMLAudioElement | null = null;
  private beepAudio: AudioContext | null = null;
  private threatCooldown = false;
  private readonly THREAT_COOLDOWN_MS = 25000;
  private readonly SENTINEL_INTERVAL_MS = 8000;
  private readonly CONVERSATION_BG_MS = 20000;
  private sentinelTimer: ReturnType<typeof setTimeout> | null = null;
  private conversationBgTimer: ReturnType<typeof setTimeout> | null = null;
  private uptimeTimer: ReturnType<typeof setInterval> | null = null;
  private scanProgressTimer: ReturnType<typeof setInterval> | null = null;
  private sentinelStartTime = 0;
  private recognition: any = null;
  private currentFacingMode: 'environment' | 'user' = 'user';
  private messageIdCounter = 0;
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // ── Privados de Always Listening ──
  private alwaysListeningActive = false;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly SILENCE_MS = 1800;


  showAnalytics = signal(false);

  constructor() {
    this.initSpeechRecognition();
    this.initAudioContext();
    this.loadFromLocalStorage();
  }

  ngOnDestroy() {
    this.stopAlwaysListening();
    this.stopCamera();
    this.stopAllLoops();
  }


  refreshAnalytics() {
    // Solo refresca los datos (ya están en signals)
    this.cdr.detectChanges();
  }



  // ════════════════════════════════════════════════════════════════════════════
  // INIT
  // ════════════════════════════════════════════════════════════════════════════

  private initSpeechRecognition() {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { console.warn('Speech recognition no soportado'); return; }
    this.recognition = new SR();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.setManualRecognitionHandlers();
  }

  private setManualRecognitionHandlers() {
    if (!this.recognition) return;
    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.userInput.set(transcript);
      this.isListening.set(false);
      this.sendMessage();
    };
    this.recognition.onerror = () => this.isListening.set(false);
    this.recognition.onend = () => this.isListening.set(false);
  }

  private initAudioContext() {
    try { this.beepAudio = new AudioContext(); } catch { }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // AGENTES
  // ════════════════════════════════════════════════════════════════════════════

  getVisibleAgents(): Agent[] {
    const all = this.availableAgents();
    return this.showAllAgents() ? all : all.slice(0, 7);
  }

  selectAgent(agentId: string) {
    this.currentAgent.set(agentId);
    const agent = this.availableAgents().find(a => a.id === agentId);
    if (agent) this.addChatMessage(`${agent.icon} Agente activado: ${agent.name}`, false);
    if (window.innerWidth < 768) this.showAllAgents.set(false);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 🎤 ALWAYS LISTENING
  // ════════════════════════════════════════════════════════════════════════════

  toggleAlwaysListening() {
    this.isAlwaysListening() ? this.stopAlwaysListening() : this.startAlwaysListening();
  }

  private startAlwaysListening() {
    if (!this.recognition) { alert('Tu navegador no soporta reconocimiento de voz'); return; }
    if (this.isProcessing() || this.isSpeaking()) return;

    this.alwaysListeningActive = true;
    this.isAlwaysListening.set(true);
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.getTTSLang();

    this.recognition.onresult = (event: any) => {
      if (this.silenceTimer) clearTimeout(this.silenceTimer);
      const results = Array.from(event.results);
      const last = results[results.length - 1] as any;
      const transcript = last[0].transcript.trim();
      this.alwaysListeningTranscript.set(transcript);
      this.userInput.set(transcript);
      if (last.isFinal && transcript.length > 1) {
        this.silenceTimer = setTimeout(() => this.processAlwaysListeningInput(transcript), this.SILENCE_MS);
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') { this.stopAlwaysListening(); return; }
      if (this.alwaysListeningActive && !this.isSpeaking() && !this.isProcessing()) {
        setTimeout(() => this.restartAlwaysListening(), 500);
      }
    };

    this.recognition.onend = () => {
      if (this.alwaysListeningActive && !this.isSpeaking() && !this.isProcessing()) {
        setTimeout(() => this.restartAlwaysListening(), 300);
      }
    };

    try {
      this.recognition.start();
      this.isListening.set(true);
      this.playBeep('safe');
    } catch (e) {
      this.alwaysListeningActive = false;
      this.isAlwaysListening.set(false);
    }
  }

  private restartAlwaysListening() {
    if (!this.alwaysListeningActive || this.isSpeaking() || this.isProcessing()) return;
    try { this.recognition.lang = this.getTTSLang(); this.recognition.start(); this.isListening.set(true); } catch { }
  }

  stopAlwaysListening() {
    this.alwaysListeningActive = false;
    this.isAlwaysListening.set(false);
    this.isListening.set(false);
    this.alwaysListeningTranscript.set('');
    this.userInput.set('');
    if (this.silenceTimer) { clearTimeout(this.silenceTimer); this.silenceTimer = null; }
    try { this.recognition?.stop(); } catch { }
    if (this.recognition) {
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.setManualRecognitionHandlers();
    }
  }

  private async processAlwaysListeningInput(transcript: string) {
    if (!transcript || transcript.trim().length < 2) return;
    try { this.recognition.stop(); } catch { }
    this.isListening.set(false);
    this.alwaysListeningTranscript.set('');
    this.userInput.set('');
    this.addChatMessage(transcript, true);
    await this.getAIResponse(transcript);
    await this.waitForSpeechEnd();
    if (this.alwaysListeningActive) setTimeout(() => this.restartAlwaysListening(), 600);
  }

  private waitForSpeechEnd(): Promise<void> {
    return new Promise(resolve => {
      if (!this.isSpeaking()) { resolve(); return; }
      const check = setInterval(() => { if (!this.isSpeaking()) { clearInterval(check); resolve(); } }, 200);
      setTimeout(() => { clearInterval(check); resolve(); }, 30000);
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CÁMARA
  // ════════════════════════════════════════════════════════════════════════════

  async toggleCamera() {
    this.isCameraActive() ? this.stopCamera() : await this.startCamera();
  }

  private async startCamera() {
    this.stopCamera();
    const constraints: MediaStreamConstraints = {
      video: { facingMode: this.currentFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.attachStream(stream);
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.attachStream(stream);
      } catch { this.lastAnalysis.set('Error crítico: Cámara no disponible.'); }
    }
  }

  private attachStream(stream: MediaStream) {
    this.cdr.detectChanges();
    const video = this.videoStream?.nativeElement;
    if (!video) {
      setTimeout(() => {
        if (this.videoStream?.nativeElement) {
          this.videoStream.nativeElement.srcObject = stream;
          this.videoStream.nativeElement.play();
          this.isCameraActive.set(true);
        }
      }, 200);
      return;
    }
    video.srcObject = stream;
    video.onloadedmetadata = () => video.play();
    this.isCameraActive.set(true);
    this.alertAudio = new Audio('assets/alarm.mp3');
    this.alertAudio.load();
  }

  private stopCamera() {
    const video = this.videoStream?.nativeElement;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
    this.isCameraActive.set(false);
    this.stopAllLoops();
    this.clearThreat();
    this.sentinelStatus.set('offline');
  }

  async switchCamera() {
    this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
    if (this.isCameraActive()) {
      const wasActive = this.isAiActive();
      this.stopCamera();
      await this.startCamera();
      if (wasActive && this.visionMode() === 'vigilancia') this.isAiActive.set(true);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SENTINEL LOOP
  // ════════════════════════════════════════════════════════════════════════════

  async toggleSentinel() {
    if (this.isAiActive()) { this.stopSentinel(); return; }
    if (!this.isCameraActive()) await this.startCamera();
    this.startSentinelLoop();
  }

  private startSentinelLoop() {
    if (this.visionMode() !== 'vigilancia') return;
    this.isAiActive.set(true);
    this.sentinelStatus.set('scanning');
    this.sentinelStartTime = Date.now();
    this.startUptimeTimer();
    this.runSentinelCycle();
  }

  private async runSentinelCycle() {
    if (!this.isAiActive() || this.visionMode() !== 'vigilancia' || !this.isCameraActive()) return;

    const cycleStart = Date.now();
    this.isProcessing.set(true);
    this.startScanProgress();

    try {
      const frameBlob = await this.captureFrame(640, 480, 0.8);
      const frameFile = new File([frameBlob], `s_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const res: any = await this.oracleService.analyzeMedia(SURVEILLANCE_PROMPT, 'community', frameFile);
      const content: string = res?.choices?.[0]?.message?.content || (typeof res === 'string' ? res : '');
      const parsed = this.parseSentinelResponse(content);
      const scanMs = Date.now() - cycleStart;

      this.sentinelStats.update(s => ({ ...s, totalScans: s.totalScans + 1, lastScanMs: scanMs }));
      this.lastAnalysis.set(parsed.detail || 'Área segura.');

      if (parsed.status === 'THREAT' && parsed.type) {
        const threat = this.buildThreat(parsed.type, parsed.detail);
        if (threat) { this.triggerThreatAlert(threat); return; }
      }
      this.sentinelStatus.set('scanning');
      this.playBeep('safe');

    } catch (err) {
      console.error('❌ Sentinel error:', err);
      this.lastAnalysis.set('Error de análisis. Reintentando...');
    } finally {
      this.isProcessing.set(false);
      this.stopScanProgress();
    }

    if (this.isAiActive()) {
      this.sentinelTimer = setTimeout(() => this.runSentinelCycle(), this.SENTINEL_INTERVAL_MS);
      this.animateScanProgress(this.SENTINEL_INTERVAL_MS);
    }
  }

  stopSentinel() {
    this.isAiActive.set(false);
    this.isProcessing.set(false);
    this.sentinelStatus.set('idle');
    this.stopAllLoops();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    this.isSpeaking.set(false);
    this.scanProgress.set(0);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // BACKGROUND THREAT LOOP (conversación)
  // ════════════════════════════════════════════════════════════════════════════

  private startConversationBgLoop() {
    if (this.visionMode() !== 'conversacion' || !this.isCameraActive()) return;
    this.runConversationBgCycle();
  }

  private async runConversationBgCycle() {
    if (this.visionMode() !== 'conversacion' || !this.isCameraActive()) return;
    try {
      const frameBlob = await this.captureFrame(480, 360, 0.7);
      const frameFile = new File([frameBlob], `bg_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const res: any = await this.oracleService.analyzeMedia(CONVERSATION_BG_PROMPT, 'community', frameFile);
      const content: string = res?.choices?.[0]?.message?.content || '';
      const norm = this.normalizeText(content);
      if (!norm.startsWith('clear')) {
        const match = norm.match(/threat:\s*(\w+)/i);
        const threat = this.buildThreat(match?.[1] || '', content);
        if (threat) {
          this.addChatMessage(`⚠️ ${this.getVoiceMessage(threat)}`, false, true);
          this.triggerThreatAlert(threat);
        }
      }
    } catch (e) { console.error('BG threat error:', e); }
    this.conversationBgTimer = setTimeout(() => this.runConversationBgCycle(), this.CONVERSATION_BG_MS);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CHAT
  // ════════════════════════════════════════════════════════════════════════════

  toggleMicrophone() {
    if (this.isAlwaysListening()) { this.stopAlwaysListening(); return; }
    if (!this.recognition) { alert('Tu navegador no soporta reconocimiento de voz'); return; }
    if (this.isListening()) {
      this.recognition.stop(); this.isListening.set(false);
    } else {
      this.recognition.lang = this.getTTSLang();
      this.recognition.start(); this.isListening.set(true);
    }
  }

  async sendMessage() {
    const message = this.userInput().trim();
    if (!message || this.isProcessing()) return;
    this.addChatMessage(message, true);
    this.userInput.set('');
    await this.getAIResponse(message);
  }


  // 3. FUNCIÓN PRINCIPAL: Orquesta Visión y Chat
  async getAIResponse(userMessage: string) {
    if (!userMessage?.trim()) return;
    this.isProcessing.set(true);

    // 🛡️ Intercepción local
    const local = this.evaluateLocalTask(userMessage);
    if (local) {
      this.finalizeResponse(userMessage, local);
      return;
    }

    try {
      // 📸 MEJORADO: Detección más inteligente de solicitud de imagen
      const wantsImageAnalysis = this.isAskingAboutImage(userMessage);
      let file: File | null = null;

      // Si pide analizar imagen Y hay cámara activa, capturar frame
      if (wantsImageAnalysis && this.isCameraActive()) {
        const blob = await this.captureFrame(1280, 720, 0.9);
        file = new File([blob], `vision_${Date.now()}.jpg`, { type: 'image/jpeg' });
        this.addChatMessage("📸 Analizando imagen...", false);
      }
      // Si no hay cámara pero pide análisis de imagen
      else if (wantsImageAnalysis && !this.isCameraActive()) {
        this.addChatMessage("📷 Activa la cámara primero para que pueda ver la imagen.", false);
        this.isProcessing.set(false);
        return;
      }

      const lang = this.app.selectedLanguage() || 'es';
      const targetLang = lang === 'es' ? 'español' : 'english';

      let finalPrompt: string;

      if (file) {
        // Modo VISIÓN - análisis de imagen
        finalPrompt = `Analiza esta imagen y responde a: "${userMessage}"
Responde DIRECTAMENTE en ${targetLang}. Describe lo que ves. Si hay productos, nombra precios.
Respuesta final:`;
      } else {
        // Modo CHAT normal
        finalPrompt = `Eres VIC, asistente útil. Responde en ${targetLang} DIRECTAMENTE sin introducciones.
Usuario: ${userMessage}
Respuesta:`;
      }

      const response = await this.oracleService.analyzeMedia(
        finalPrompt,
        file ? 'vision_sustained' : 'community',
        file
      );

      let raw = response?.choices?.[0]?.message?.content || '';

      // Limpieza de Chain of Thought
      if (raw.includes('####')) {
        raw = raw.split('####').pop()!.trim();
      }

      const cleanText = this.cleanResponse(raw, 'general');
      this.finalizeResponse(userMessage, cleanText);

    } catch (err) {
      console.error('Error:', err);
      this.addChatMessage("Error al procesar tu solicitud.", false);
      this.isProcessing.set(false);
    }
  }
  // ── Enviar chat con historial ──────────────────────────────────────────────
  // ── Chat con Historial (Standard Vertex) ──
  private async sendChatWithHistory(userMessage: string, forceAgent?: string): Promise<any> {
    // 🌍 DETECCIÓN DINÁMICA DE IDIOMA (Para que deje de valer verga el selector)
    const lang = this.app.selectedLanguage() || 'es';
    const langMap: any = { es: 'español', en: 'English', fr: 'français', pt: 'português' };
    const targetLang = langMap[lang] || 'español';

    // PROMPT ULTRA-MINIMALISTA: Menos instrucciones = Menos razonamiento filtrado
    const finalPrompt = `[IDIOMA: ${targetLang.toUpperCase()}]
  [USUARIO]: ${userMessage}
  
  VIC, responde directamente en ${targetLang}. Sin introducciones ni pensamientos internos.`;

    return await this.oracleService.analyzeMedia(finalPrompt, 'community', null);
  }

  // ── Visión con Historial (Standard Vertex) ──
  private async sendVisionWithHistory(userMessage: string, frameFile: File): Promise<any> {
    const lang = this.app.selectedLanguage() || 'es';
    const agentPrompt = (AGENT_PROMPTS[lang] || AGENT_PROMPTS['en'])['vision'];

    const visionPrompt = `Analiza la imagen y responde a la pregunta: "${userMessage}"
Responde directamente en español. Si hay productos, lista sus nombres y precios. 

Respuesta final:`;

    // Forzamos modo 'vision_sustained' para el endpoint de visión
    return await this.oracleService.analyzeMedia(visionPrompt, 'vision_sustained', frameFile);
  }




  //clearChat() { this.chatMessages.set([]); this.conversationHistory = []; }
  clearChat() { 
  this.chatMessages.set([]); 
  this.conversationHistory = [];
  this.saveToLocalStorage(); // ← GUARDAR
}

  // ════════════════════════════════════════════════════════════════════════════
  // CAMBIO DE MODO
  // ════════════════════════════════════════════════════════════════════════════

  setMode(mode: VisionMode) {
    if (this.visionMode() === mode) return;
    if (this.isAlwaysListening()) this.stopAlwaysListening();
    const currentStream = this.videoStream?.nativeElement?.srcObject as MediaStream;
    this.stopAllLoops();
    this.visionMode.set(mode);
    this.cdr.detectChanges();
    if (this.isCameraActive() && currentStream) {
      setTimeout(() => { this.attachStream(currentStream); }, 100);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // AMENAZAS
  // ════════════════════════════════════════════════════════════════════════════

  private buildThreat(typeStr: string, detail: string): Threat | null {
    const norm = this.normalizeText(typeStr);
    const pattern = THREAT_PATTERNS.find(p => p.keywords.some(k => this.normalizeText(k) === norm || norm.includes(this.normalizeText(k))));
    if (!pattern) return null;
    return { id: `threat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, type: pattern.type, severity: pattern.severity, message: pattern.message, description: detail || pattern.description, timestamp: Date.now() };
  }

  private detectThreats(text: string): Threat | null {
    const norm = this.normalizeText(text);
    for (const pattern of THREAT_PATTERNS) {
      if (pattern.keywords.some(k => norm.includes(this.normalizeText(k)))) {
        return { id: `threat_${Date.now()}`, type: pattern.type, severity: pattern.severity, message: pattern.message, description: text, timestamp: Date.now() };
      }
    }
    return null;
  }

  private triggerThreatAlert(threat: Threat) {
    if (this.threatCooldown) return;
    if (this.alwaysListeningActive) { try { this.recognition.stop(); } catch { } this.isListening.set(false); }

    this.threatCooldown = true;
    this.activeThreat.set(threat);
    this.isThreatDetected.set(true);
    this.sentinelStatus.set('alert');
    this.threatHistory.update(h => [threat, ...h].slice(0, 50));
    this.sentinelStats.update(s => ({ ...s, threatsDetected: s.threatsDetected + 1 }));



    this.threatHistory.update(h => [threat, ...h].slice(0, 50));
    this.saveToLocalStorage(); // ← GUARDAR


    if (window.speechSynthesis) window.speechSynthesis.cancel();
    this.playThreatSound(threat.severity);
    this.playBeep('alert');
    setTimeout(() => { this.isSpeaking.set(false); this.speak(this.getVoiceMessage(threat)); }, 300);

    setTimeout(async () => {
      this.threatCooldown = false;
      if (this.isAiActive() && this.visionMode() === 'vigilancia') this.sentinelStatus.set('scanning');
      if (this.alwaysListeningActive) { await this.waitForSpeechEnd(); this.restartAlwaysListening(); }
    }, this.THREAT_COOLDOWN_MS);
  }

 

  clearThreat() {
    this.activeThreat.set(null);
    this.isThreatDetected.set(false);
    if (this.isAiActive() && this.visionMode() === 'vigilancia') this.sentinelStatus.set('scanning');
    else this.sentinelStatus.set(this.isCameraActive() ? 'scanning' : 'idle');
  }

  toggleThreatHistory() { this.showThreatHistory.update(v => !v); }
  //clearThreatHistory() { this.threatHistory.set([]); }
   clearThreatHistory() {
  this.threatHistory.set([]);
  this.activeThreat.set(null);
  this.isThreatDetected.set(false);
  this.saveToLocalStorage(); // ← GUARDAR
}



  private parseSentinelResponse(raw: string): { status: string; type: string; detail: string } {
    const lines = raw.split('\n').map(l => l.trim());
    let status = 'CLEAR', type = 'NONE', detail = 'Área segura.';
    for (const line of lines) {
      if (line.startsWith('STATUS:')) status = line.replace('STATUS:', '').trim().toUpperCase();
      if (line.startsWith('TYPE:')) type = line.replace('TYPE:', '').trim().toLowerCase();
      if (line.startsWith('DETAIL:')) detail = line.replace('DETAIL:', '').trim();
    }
    if (status === 'CLEAR' && raw.length > 10) {
      const threat = this.detectThreats(raw);
      if (threat) { status = 'THREAT'; type = threat.type; detail = raw.split('.')[0] || detail; }
    }
    return { status, type, detail };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // AUDIO / VOZ
  // ════════════════════════════════════════════════════════════════════════════

  private speak(text: string) {
    if (!('speechSynthesis' in window)) return;
    this.isSpeaking.set(true);
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = this.getTTSLang();
    utt.rate = 0.95; utt.pitch = 1.0; utt.volume = 1.0;
    utt.onend = () => this.isSpeaking.set(false);
    utt.onerror = () => this.isSpeaking.set(false);
    window.speechSynthesis.speak(utt);
  }

  stopSpeaking() { if (window.speechSynthesis) window.speechSynthesis.cancel(); this.isSpeaking.set(false); }

  private getTTSLang(): string {
    const lang = this.app.selectedLanguage() || 'es';
    return TTS_LANG_MAP[lang] || 'es-ES';
  }

  private playThreatSound(severity: ThreatSeverity) {
    if (!this.alertAudio) return;
    this.alertAudio.currentTime = 0;
    this.alertAudio.volume = severity === 'critical' ? 1.0 : 0.85;
    this.alertAudio.play().catch(() => { });
  }

  private playBeep(type: 'safe' | 'alert') {
    if (!this.beepAudio) return;
    try {
      const osc = this.beepAudio.createOscillator();
      const gain = this.beepAudio.createGain();
      osc.connect(gain); gain.connect(this.beepAudio.destination);
      if (type === 'safe') { osc.frequency.value = 880; gain.gain.value = 0.03; osc.start(); osc.stop(this.beepAudio.currentTime + 0.08); }
      else { osc.frequency.value = 440; gain.gain.value = 0.15; osc.start(); osc.stop(this.beepAudio.currentTime + 0.4); }
    } catch { }
  }

  private getVoiceMessage(threat: Threat): string {
    const es = (this.app.selectedLanguage() || 'es') === 'es';
    const map: Record<ThreatType, [string, string]> = {
      fall: ['¡Atención! Caída detectada. Asistencia inmediata requerida.', 'Attention! Fall detected. Immediate assistance required.'],
      fire: ['¡Alerta crítica! Fuego detectado. Evacúe el área.', 'Critical alert! Fire detected. Evacuate immediately.'],
      intruder: ['¡Alerta de seguridad! Intruso detectado.', 'Security alert! Intruder detected.'],
      weapon: ['¡Peligro extremo! Arma detectada. Busque cobertura.', 'Extreme danger! Weapon detected. Take cover.'],
      medical: ['¡Emergencia médica! Atención inmediata requerida.', 'Medical emergency! Immediate attention required.'],
      wolf: ['¡Peligro! Lobo detectado en el área.', 'Danger! Wolf detected in the area.'],
      dangerous_animal: ['¡Peligro! Animal salvaje detectado.', 'Danger! Wild animal detected.'],
      unknown: ['¡Alerta! Amenaza detectada.', 'Alert! Threat detected.']
    };
    const [es_msg, en_msg] = map[threat.type] || map.unknown;
    return es ? es_msg : en_msg;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CAPTURA DE FRAMES
  // ════════════════════════════════════════════════════════════════════════════

  private async captureFrame(w: number, h: number, quality: number): Promise<Blob> {
    const video = this.videoStream.nativeElement;
    if (video.videoWidth === 0 || video.readyState < 2) {
      await new Promise(resolve => { video.onloadedmetadata = () => resolve(true); setTimeout(() => resolve(false), 1000); });
    }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(video, 0, 0, w, h);
    return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', quality));
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MATH LOCAL
  // ════════════════════════════════════════════════════════════════════════════

  private evaluateMathQuery(msg: string): string | null {
    const lower = msg.toLowerCase();
    const now = new Date();
    const lang = this.app.selectedLanguage() || 'es';
    const locale = lang === 'es' ? 'es-ES' : (TTS_LANG_MAP[lang]?.replace('-', '-') || 'en-US');

    // Fecha/hora
    if (/qué fecha|que fecha|fecha de hoy|fecha actual|today.s date/i.test(lower))
      return now.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (/qué hora|que hora|hora actual|what time/i.test(lower))
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (/día de la semana|que día es|qué día es|what day/i.test(lower))
      return now.toLocaleDateString(locale, { weekday: 'long' });

    // Raíz cuadrada
    const sqrtMatch = lower.match(/(?:raíz|raiz)\s*(?:cuadrada)?\s*de\s*(\d+)|sqrt\s*\(\s*(\d+)\s*\)/i);
    if (sqrtMatch) {
      const n = parseInt(sqrtMatch[1] || sqrtMatch[2], 10);
      const r = Math.sqrt(n);
      return Number.isInteger(r) ? r.toString() : r.toFixed(4);
    }

    // Potencias
    const sq = lower.match(/(\d+)\s*(?:al cuadrado|squared|\^2|²)/i);
    if (sq) { const n = parseInt(sq[1], 10); return (n * n).toString(); }
    const cu = lower.match(/(\d+)\s*(?:al cubo|cubed|\^3|³)/i);
    if (cu) { const n = parseInt(cu[1], 10); return (n * n * n).toString(); }

    // Operación aritmética básica (jerarquía correcta via Function)
    const exprMatch = lower.match(/[\d\s+\-*/().]+/);
    if (exprMatch) {
      const expr = exprMatch[0].trim().replace(/\s/g, '');
      if (/^[\d+\-*/().]+$/.test(expr) && expr.length > 2) {
        try {
          const result = Function('"use strict"; return (' + expr + ')')();
          if (typeof result === 'number' && isFinite(result)) {
            return Number.isInteger(result) ? result.toString() : result.toFixed(2);
          }
        } catch { }
      }
    }

    return null;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TRADUCTOR LOCAL
  // ════════════════════════════════════════════════════════════════════════════

  private detectTranslationRequest(msg: string): { prompt: string; targetLang: string } | null {
    const lower = msg.toLowerCase();

    // Patrones: "traduce X al inglés", "translate X to english", "cómo se dice X en francés"
    const patterns = [
      /(?:traduce|translate)\s+["']?(.+?)["']?\s+(?:al?|to|en|into)\s+(\w+)/i,
      /(?:cómo|como)\s+se\s+dice\s+["']?(.+?)["']?\s+en\s+(\w+)/i,
      /(?:how\s+do\s+you\s+say|how\s+to\s+say)\s+["']?(.+?)["']?\s+in\s+(\w+)/i,
      /(?:dime|di)\s+["']?(.+?)["']?\s+en\s+(\w+)/i,
    ];

    for (const pattern of patterns) {
      const match = lower.match(pattern);
      if (!match) continue;

      const textToTranslate = match[1].trim();
      const targetLangRaw = match[2].trim().toLowerCase();

      // Buscar código de idioma
      let targetLangCode = '';
      for (const [code, names] of Object.entries(TRANSLATE_LANG_NAMES)) {
        if (names.some(n => targetLangRaw.includes(n))) { targetLangCode = code; break; }
      }

      if (!textToTranslate || !targetLangCode) continue;

      const prompt = `Translate the following text to ${targetLangCode.toUpperCase()} (${targetLangRaw}). Respond with ONLY the translation, nothing else:\n\n"${textToTranslate}"`;
      return { prompt, targetLang: targetLangCode };
    }

    return null;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // HELPERS DE VISIÓN
  // ════════════════════════════════════════════════════════════════════════════

  private isAskingAboutImage(question: string): boolean {
    const lower = question.toLowerCase();
    const visionKws = ['ves', 'imagen', 'foto', 'cámara', 'camara', 'observas', 'qué hay', 'que hay', 'aparece',
      'describe', 'mira', 'qué ves', 'que ves', 'pantalla', 'monitor', 'muestra', 'ahora',
      'see', 'look', 'screen', 'visible', 'letrero', 'texto', 'dice', 'lee', 'leer', 'cartel'];
    if (visionKws.some(k => lower.includes(k))) return true;

    const productKws = ['precio', 'cuesta', 'vale', 'costo', 'dolar', 'euro', 'color', 'colores', 'talla',
      'modelo', 'marca', 'review', 'rating', 'rated', 'calificacion', 'estrellas', 'piezas',
      'cantidad', 'stock', 'disponible', 'oferta', 'descuento'];
    if (productKws.some(k => lower.includes(k))) return true;

    return false;
  }

  private hasVisualKeywords(text: string): boolean {
    const lower = text.toLowerCase();
    return ['imagen', 'veo', 'muestra', 'captura', 'pantalla', 'precio', 'dólar', 'dollar', 'producto',
      'reloj', 'camiseta', 'silla', 'producto', 'tienda', 'store'].some(k => lower.includes(k));
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CLEAN RESPONSE
  // ════════════════════════════════════════════════════════════════════════════

  private cleanResponse(raw: string, mode: 'general' | 'translator' | 'coding' = 'general'): string {
    if (!raw) return '¿En qué puedo ayudarte?';

    let cleaned = raw.trim();

    if (mode === 'translator') {
      let clean = raw.trim();

      // Eliminar todo lo que no sea la traducción pura
      clean = clean.replace(/\*.*?\*/g, '');                    // quita todo entre *
      clean = clean.replace(/Result:[\s\S]*?/gi, '');
      clean = clean.replace(/The user requested[\s\S]*?/gi, '');
      clean = clean.replace(/se dice|traducido|traducción/gi, '');

      // Si después de limpiar queda algo razonable, devolverlo
      clean = clean.trim();

      if (clean.length > 1 && clean.length < 100) {
        return clean.replace(/^["']|["']$/g, ''); // quita comillas si las hay
      }

      // Fallback: tomar la primera línea limpia
      return clean.split('\n')[0]?.trim() || raw.trim();
    }

    // LIMPIEZA AGRESIVA - elimina todo lo que estamos viendo
    const badPatterns = [
      /Context provided:[\s\S]*?today\?/gi,
      /System instructions:[\s\S]*?/gi,
      /I need to respond[\s\S]*?/gi,
      /"¡Hola! Todo muy bien por aquí[\s\S]*?hoy\?"/gi,
      /\* Context:[\s\S]*?\*/gi,
      /The user is just greeting[\s\S]*?/gi,
      /^Parent\./gim,
      /^\*Role:.*$/gim,
      /^\*Constraint \d+:.*$/gim,
      /^\*Wait\*.*$/gim,
      /^Self-Correction.*$/gim,
      /^Draft:.*$/gim,
      /^Decision:.*$/gim,
      /^Context:.*$/gim,
      /^Current question:.*$/gim,
      /^Let's look at.*$/gim,
      /^Actually,.*$/gim,
      /^I should.*$/gim,
      /^```/g

    ];

    for (const pattern of badPatterns) {
      cleaned = cleaned.replace(pattern, '');
    }



    // Quitar cualquier línea que empiece con * o contenga "Context", "instructions", "need to respond"
    cleaned = cleaned.split('\n')
      .filter(line => {
        const l = line.trim().toLowerCase();
        return line.trim().length > 5 &&
          !line.trim().startsWith('*') &&
          !l.includes('User Question') &&
          !l.includes('Correction Language') &&
          !l.includes('User Question') &&
          !l.includes('The user is asking') &&
          !l.includes('Language') &&
          !l.includes('context') &&
          !l.includes('system instructions') &&
          !l.includes('i need to respond');
      })
      .join('\n')
      .trim();

    // Si después de limpiar queda vacío o muy corto, tomar la parte final útil
    if (cleaned.length < 20) {
      // Tomar la última frase que parezca una respuesta normal
      const sentences = raw.match(/[^.!?]+[.!?]/g) || [];
      cleaned = sentences[sentences.length - 1] || raw.substring(0, 300);
    }

    return cleaned.replace(/\s+/g, ' ').trim();
  }


  // ════════════════════════════════════════════════════════════════════════════
  // TIMERS
  // ════════════════════════════════════════════════════════════════════════════

  private startUptimeTimer() {
    this.uptimeTimer = setInterval(() => {
      this.sentinelStats.update(s => ({ ...s, uptime: Math.floor((Date.now() - this.sentinelStartTime) / 1000) }));
    }, 1000);
  }

  private animateScanProgress(durationMs: number) {
    this.scanProgress.set(0);
    const steps = durationMs / 100; let step = 0;
    this.scanProgressTimer = setInterval(() => {
      step++; this.scanProgress.set(Math.min((step / steps) * 100, 99));
      if (step >= steps) clearInterval(this.scanProgressTimer!);
    }, 100);
  }

  private startScanProgress() { this.scanProgress.set(0); }

  private stopScanProgress() {
    if (this.scanProgressTimer) { clearInterval(this.scanProgressTimer); this.scanProgressTimer = null; }
    this.scanProgress.set(100);
    setTimeout(() => this.scanProgress.set(0), 300);
  }

  private stopAllLoops() {
    if (this.sentinelTimer) { clearTimeout(this.sentinelTimer); this.sentinelTimer = null; }
    if (this.conversationBgTimer) { clearTimeout(this.conversationBgTimer); this.conversationBgTimer = null; }
    if (this.uptimeTimer) { clearInterval(this.uptimeTimer); this.uptimeTimer = null; }
    if (this.scanProgressTimer) { clearInterval(this.scanProgressTimer); this.scanProgressTimer = null; }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // HELPERS DE UI
  // ════════════════════════════════════════════════════════════════════════════



  private addChatMessage(text: string, isUser: boolean, isAlert = false) {
   this.chatMessages.update(msgs => [...msgs, {
    id: `msg_${++this.messageIdCounter}`, 
    text, 
    isUser, 
    timestamp: new Date(), 
    isAlert
  }]);
  this.saveToLocalStorage(); // ← GUARDAR
    setTimeout(() => {
      if (this.chatContainer?.nativeElement)
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    }, 80);
  }

  private normalizeText(s: string): string {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  formatTimestamp(ts: number): string {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  getSeverityLabel(s: ThreatSeverity): string {
    return ({ critical: 'CRÍTICO', high: 'ALTO', medium: 'MEDIO', low: 'BAJO' } as any)[s] || s;
  }

  getThreatIcon(type: ThreatType): string {
    return ({ fall: '🫸', fire: '🔥', intruder: '🚨', weapon: '⚠️', medical: '🏥', wolf: '🐺', dangerous_animal: '🦁', unknown: '❓' } as any)[type] || '❓';
  }

  callEmergency() {
    const num = (this.app.selectedLanguage() || 'es') === 'es' ? '112' : '911';
    if (confirm(`¿Llamar a emergencias (${num})?`)) window.location.href = `tel:${num}`;
  }

  private cleanVisionResponse(raw: string): string {
    if (!raw?.trim()) return 'No pude describir la imagen.';

    let text = raw.trim();

    // Eliminar cualquier resto de reglas o prompt que se escape
    text = text.replace(/REGLAS ESTRICTAS[\s\S]*?DESCRIPCIÓN:/gi, '');
    text = text.replace(/Solo describe lo que ves[\s\S]*?Respuesta:/gi, '');
    text = text.replace(/No uses asteriscos[\s\S]*?/gi, '');
    text = text.replace(/hyphens[\s\S]*?lists/gi, '');
    text = text.replace(/\*[\s\S]*?\*/g, '');
    text = text.replace(/- .*?\?/gi, '');

    // Limpiar líneas innecesarias
    text = text.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 10 &&
        !l.includes('REGLAS') &&
        !l.includes('Check') &&
        !l.includes('Yes') &&
        !l.includes('No') &&
        !l.startsWith('-'))
      .join('\n')
      .trim();

    return text || raw.substring(0, 250);
  }



  // 1. INTERCEPTOR LOCAL: Hora, Fecha y Matemáticas rápidas
  private evaluateLocalTask(msg: string): string | null {
    const lower = msg.toLowerCase();
    const now = new Date();
    const lang = this.app.selectedLanguage() || 'es';
    const locale = lang === 'es' ? 'es-ES' : 'en-US';

    // 🕒 HORA Y FECHA
    if (lower.includes('hora')) return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (lower.includes('fecha') || lower.includes('día') || lower.includes('dia')) {
      return now.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    // 📐 MATH (27.99 / 4, etc.)
    const mathMatch = lower.match(/[\d\s+\-*/().]+/);
    if (mathMatch && (lower.includes('/') || lower.includes('*') || lower.includes('-') || lower.includes('+'))) {
      try {
        const result = Function('"use strict"; return (' + mathMatch[0].trim() + ')')();
        return (typeof result === 'number' && isFinite(result)) ? (Number.isInteger(result) ? result.toString() : result.toFixed(2)) : null;
      } catch { return null; }
    }
    return null;
  }

  // 2. HELPER DE FINALIZACIÓN: UI + Voz + Historial
  private finalizeResponseOld(prompt: string, response: string) {
    this.addChatMessage(response, false);
    this.speak(response);
    this.conversationHistory.push({ role: 'user', content: prompt }, { role: 'assistant', content: response });
    this.isProcessing.set(false);
  }


  // 1. Mejorar el formateo de precios en la respuesta
  private formatPrice(price: string | number): string {
    const num = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.-]/g, '')) : price;
    if (isNaN(num)) return `${price}`;
    return `$${num.toFixed(2)}`;
  }

  // 2. Agregar un sonido suave cuando se complete el análisis
  private playAnalysisComplete() {
    if (!this.beepAudio) return;
    try {
      const osc = this.beepAudio.createOscillator();
      const gain = this.beepAudio.createGain();
      osc.connect(gain);
      gain.connect(this.beepAudio.destination);
      osc.frequency.value = 1046.5; // Do agudo
      gain.gain.value = 0.05;
      osc.start();
      osc.stop(this.beepAudio.currentTime + 0.1);
    } catch { }
  }

  // 3. Llamarlo al final del análisis
  private finalizeResponse(prompt: string, response: string) {
    this.addChatMessage(response, false);
    this.speak(response);
    this.playAnalysisComplete(); // ← agregar esto
    this.conversationHistory.push({ role: 'user', content: prompt }, { role: 'assistant', content: response });
    this.isProcessing.set(false);
  }


  // ============================================
  // PERSISTENCIA LOCAL STORAGE
  // ============================================

  private readonly STORAGE_KEYS = {
    THREAT_HISTORY: 'sentinel_threat_history',
    SENTINEL_STATS: 'sentinel_stats',
    CHAT_HISTORY: 'sentinel_chat_history'
  };

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.THREAT_HISTORY, JSON.stringify(this.threatHistory()));
      localStorage.setItem(this.STORAGE_KEYS.SENTINEL_STATS, JSON.stringify(this.sentinelStats()));
      localStorage.setItem(this.STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(this.chatMessages()));
      console.log('💾 Datos guardados en localStorage');
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const savedThreats = localStorage.getItem(this.STORAGE_KEYS.THREAT_HISTORY);
      if (savedThreats) {
        const threats = JSON.parse(savedThreats);
        this.threatHistory.set(threats);
        console.log(`📥 Cargadas ${threats.length} amenazas del historial`);
      }

      const savedStats = localStorage.getItem(this.STORAGE_KEYS.SENTINEL_STATS);
      if (savedStats) {
        this.sentinelStats.set(JSON.parse(savedStats));
        console.log('📥 Estadísticas cargadas');
      }

      const savedChats = localStorage.getItem(this.STORAGE_KEYS.CHAT_HISTORY);
      if (savedChats) {
        const chats = JSON.parse(savedChats);
        // Convertir strings de fecha a objetos Date
        const parsedChats = chats.map((c: any) => ({
          ...c,
          timestamp: new Date(c.timestamp)
        }));
        this.chatMessages.set(parsedChats);
        console.log(`📥 Cargados ${parsedChats.length} mensajes del chat`);
      }
    } catch (error) {
      console.error('Error cargando de localStorage:', error);
    }
  }

  clearLocalStorage(): void {
    localStorage.removeItem(this.STORAGE_KEYS.THREAT_HISTORY);
    localStorage.removeItem(this.STORAGE_KEYS.SENTINEL_STATS);
    localStorage.removeItem(this.STORAGE_KEYS.CHAT_HISTORY);
    console.log('🗑️ localStorage limpiado');
  }


}