import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AppComponent } from '../../app';

export interface GemmaModel {
    id: string;
    name: string;
    size: string;
    contextWindow: string;
    multimodal: boolean;
    functionCalling: boolean;
    recommended: boolean;
    tag: 'fast' | 'balanced' | 'powerful';
    description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODELOS REALES disponibles en Google AI API (generativelanguage.googleapis.com)
// Fuente: Gemini API changelog — confirmados live en hosted API desde 2-Apr-2026
// Los IDs de HuggingFace (google/gemma-4-2b-it) NO funcionan aquí.
// ─────────────────────────────────────────────────────────────────────────────
const GOOGLE_AI_MODELS: GemmaModel[] = [
    {
        id: 'gemma-4-26b-a4b-it',
        name: 'Gemma 4 26B A4B',
        size: '26B total / 4B activos',
        contextWindow: '256K tokens',
        multimodal: true,
        functionCalling: true,
        recommended: true,
        tag: 'balanced',
        description: 'MoE: activa solo 4B parámetros por inferencia. Velocidad de un 4B con calidad de 26B. El que usas ahora en OracleAI.'
    },
    {
        id: 'gemma-4-31b-it',
        name: 'Gemma 4 31B',
        size: '31B denso',
        contextWindow: '256K tokens',
        multimodal: true,
        functionCalling: true,
        recommended: false,
        tag: 'powerful',
        description: 'Modelo denso flagship. Máxima calidad de razonamiento. #3 en Arena AI entre modelos open source. Más lento que el 26B A4B.'
    },
    // Gemini como alternativa hosted si el usuario quiere más potencia
    {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        size: 'Hosted',
        contextWindow: '1M tokens',
        multimodal: true,
        functionCalling: true,
        recommended: false,
        tag: 'fast',
        description: 'Modelo Gemini de Google. Ultra-rápido, contexto de 1M tokens. Opción si Gemma no está disponible en tu región.'
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        size: 'Hosted',
        contextWindow: '1M tokens',
        multimodal: true,
        functionCalling: true,
        recommended: false,
        tag: 'powerful',
        description: 'Gemini 2.5 Flash con thinking integrado. Máxima calidad de Google en velocidad optimizada.'
    }
];

const GOOGLE_AI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
    private http = inject(HttpClient);
    public app = inject(AppComponent);

    t = computed(() => this.app.settingsTranslations());

    // ── ESTADO DEL MODELO ──────────────────────────────────────────────────────
    currentModel = signal<GemmaModel>(
        JSON.parse(localStorage.getItem('vic_active_model') || 'null') ?? GOOGLE_AI_MODELS[0]
    );
    availableModels = signal<GemmaModel[]>(GOOGLE_AI_MODELS);
    isSwitching = signal(false);

    // ── ESTADO DE CONEXIÓN ─────────────────────────────────────────────────────
    connectionStatus = signal<'checking' | 'connected' | 'error'>('checking');
    lastLatency = signal<number | null>(null);
    testResult = signal<{ success: boolean; message: string } | null>(null);

    // ── API KEY ────────────────────────────────────────────────────────────────
    googleApiKey = signal(localStorage.getItem('GOOGLE_AI_API_KEY') || '');
    showApiKey = signal(false);   // toggle para mostrar/ocultar el valor

    ngOnInit() {
        // Si hay API key guardada, verificamos conexión al arrancar
        if (this.googleApiKey()) {
            this.testCurrentConnection();
        } else {
            this.connectionStatus.set('error');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST DE CONEXIÓN — llama a Google AI API, no a LM Studio
    // GET /v1beta/models?key=... devuelve lista de modelos disponibles
    // ─────────────────────────────────────────────────────────────────────────
    async testCurrentConnection() {
        await this.testGoogleConnection();
    }

    async testGoogleConnection(): Promise<boolean> {
        const key = this.googleApiKey();
        if (!key) {
            this.connectionStatus.set('error');
            this.showToast('❌ API Key no configurada', false);
            return false;
        }

        this.connectionStatus.set('checking');
        const start = Date.now();

        try {
            await firstValueFrom(
                this.http.get(`${GOOGLE_AI_BASE}/models?key=${key}`)
            );
            const latency = Date.now() - start;
            this.lastLatency.set(latency);
            this.connectionStatus.set('connected');
            this.showToast(`✅ Google AI conectado — ${latency}ms`, true);
            return true;
        } catch (e: any) {
            this.connectionStatus.set('error');
            this.lastLatency.set(null);
            const msg = e?.error?.error?.message || 'Error de conexión';
            this.showToast(`❌ ${msg}`, false);
            return false;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GUARDAR API KEY
    // ─────────────────────────────────────────────────────────────────────────
    saveApiKey() {
        const key = this.googleApiKey();
        if (!key.trim()) {
            this.showToast('❌ API Key vacía', false);
            return;
        }
        localStorage.setItem('GOOGLE_AI_API_KEY', key);
        this.showToast('✅ API Key guardada', true);
        // Verificamos inmediatamente que funciona
        this.testGoogleConnection();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CAMBIO DE MODELO
    // Guarda en localStorage — el backend lo leerá en el próximo request
    // (o puedes conectar esto al signal MODEL_ID del backend si tienes SSE)
    // ─────────────────────────────────────────────────────────────────────────
    async switchToModel(model: GemmaModel) {
        this.isSwitching.set(true);
        try {
            localStorage.setItem('vic_active_model', JSON.stringify(model));
            this.currentModel.set(model);
            this.showToast(`✅ Modelo: ${model.name}`, true);
        } finally {
            this.isSwitching.set(false);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS UI
    // ─────────────────────────────────────────────────────────────────────────
    getStatusColor() {
        const s = this.connectionStatus();
        return s === 'connected' ? '#22c55e' : s === 'error' ? '#ef4444' : '#f59e0b';
    }

    getStatusText() {
        const s = this.connectionStatus();
        if (s === 'connected') return this.t().onlineMode  || 'Google AI Online';
        if (s === 'error')     return this.t().offlineMode || 'Sin conexión';
        return this.t().checking || 'Verificando...';
    }

    getTagLabel(tag: GemmaModel['tag']): string {
        const labels: Record<GemmaModel['tag'], string> = {
            fast:     '⚡ Rápido',
            balanced: '⚖️ Balanceado',
            powerful: '🔥 Potente',
        };
        return labels[tag];
    }

    getTagColor(tag: GemmaModel['tag']): string {
        return { fast: '#0ea5e9', balanced: '#22c55e', powerful: '#f59e0b' }[tag];
    }

    private showToast(message: string, success: boolean) {
        this.testResult.set({ success, message });
        setTimeout(() => this.testResult.set(null), 3500);
    }
}