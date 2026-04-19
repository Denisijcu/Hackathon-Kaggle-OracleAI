// 📂 vision-sostenida.component.ts - VERSIÓN FINAL BLINDADA (VERTEX CORE)
import { Component, signal, OnDestroy, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OracleService } from '../../core/services/oracle.service';
import { AppComponent } from '../../app';

@Component({
    selector: 'app-vision-sostenida',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './vision-sostenida.component.html',
    styleUrls: ['./vision-sostenida.component.css']
})
export class VisionSostenidaComponent implements OnDestroy {
    // ✅ INYECCIÓN DE SERVICIOS ELITE
    private oracle = inject(OracleService);
    public app = inject(AppComponent);

    // ─── GESTIÓN DINÁMICA DE VÍDEO ───────────────────────────
    @ViewChild('cameraVideo') set cameraVideo(content: ElementRef<HTMLVideoElement>) {
        if (content && this.videoStream) {
            const videoEl = content.nativeElement;
            videoEl.srcObject = this.videoStream;
            videoEl.onloadedmetadata = () => {
                videoEl.play().catch(err => console.error("🛑 Error Autoplay:", err));
            };
        }
    }

    // ─── ESTADOS REACTIVOS (SIGNALS) ─────────────────────────
    isCameraActive = signal(false);
    isProcessing = signal(false);
    isSpeaking = signal(false);
    liveVisionActive = signal(false);
    lastDescription = signal<string | null>(null);
    visionHistory = signal<Array<{ timestamp: string, description: string, fallDetected?: boolean }>>([]);
    backendVisionStatus = signal<any>(null);
    activeAlerts = signal<Array<any>>([]);

    // ─── CONFIGURACIÓN DE OPERACIÓN ──────────────────────────
    intervalSeconds = signal(8);
    sensitivity = signal(0.3);

    // ─── CONTROLADORES PRIVADOS ──────────────────────────────
    private videoStream: MediaStream | null = null;
    private visionTimeout: any = null;
    private visionWebSocket: WebSocket | null = null;
    private synth = window.speechSynthesis;

    constructor() {
        this.loadSettings();
        this.checkBackendVisionStatus();
    }

    private loadSettings() {
        const savedInterval = localStorage.getItem('vision_interval');
        if (savedInterval) this.intervalSeconds.set(parseInt(savedInterval));

        const savedSensitivity = localStorage.getItem('vision_sensitivity');
        if (savedSensitivity) this.sensitivity.set(parseFloat(savedSensitivity));
    }

    async checkBackendVisionStatus() {
        try {
            const status = await this.oracle.getVisionStatus();
            this.backendVisionStatus.set(status);
            console.log('📡 VIC Backend Status:', status);
        } catch (error) {
            console.warn('⚠️ VIC Vision Backend unreachable');
        }
    }

    ngOnDestroy() {
        this.stopCamera();
        this.stopLiveVision();
        this.disconnectWebSocket();
    }

    // ─── INTERFAZ DE CÁMARA ──────────────────────────────────
    async toggleCamera() {
        this.isCameraActive() ? this.stopCamera() : await this.startCamera();
    }

    private async startCamera() {
        try {
            this.videoStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                audio: false
            });
            this.isCameraActive.set(true);
            this.showToast('CÁMARA ACTIVADA', 'success');
        } catch (err) {
            this.showToast('ERROR DE ACCESO A CÁMARA', 'error');
        }
    }

    stopCamera() {
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(t => t.stop());
            this.videoStream = null;
        }
        this.isCameraActive.set(false);
    }

    // ─── MOTOR DE CAPTURA OPTIMIZADO ─────────────────────────
    captureFrameAsBase64(): string | null {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (!video || video.readyState < 2 || video.videoWidth === 0) return null;

        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.4);
    }

    // ─── VISIÓN SOSTENIDA (RECURSIVIDAD VERTEX) ─────────────
    async startLiveVision() {
        if (this.liveVisionActive()) return;

        if (!this.isCameraActive()) {
            await this.startCamera();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        this.liveVisionActive.set(true);
        this.connectWebSocket();
        this.runVisionCycle();
    }

    private async runVisionCycle() {
        if (!this.liveVisionActive() || !this.isCameraActive()) {
            this.stopLiveVision();
            return;
        }

        const frameBase64 = this.captureFrameAsBase64();

        if (frameBase64 && !this.isProcessing()) {
            this.isProcessing.set(true);

            try {
                // 1. Canal WebSocket (Detecciones de Alta Velocidad)
                if (this.visionWebSocket?.readyState === WebSocket.OPEN) {
                    this.visionWebSocket.send(JSON.stringify({
                        type: 'frame',
                        data: frameBase64.split(',')[1]
                    }));
                }

                // 2. Canal HTTP (Inferencia de Lenguaje Gemma-4)
                const frameFile = this.base64ToFile(frameBase64, `vic_vision_${Date.now()}.jpg`);
                const visionPrompt = `Describe brevemente lo que ves. Máximo 15 palabras.`;



    
                const modo = 'vision_sustained';
     


                // Dentro del try del ciclo HTTP:
                const response = await this.oracle.analyzeVisionSustained(visionPrompt, frameFile);

                if (response?.sentinel_analysis?.audio_trigger) {
                    this.playAlarm(); // 🔥 Si la IA detecta amenaza en la foto, suena el MP3
                }
               

                if (response?.choices?.[0]?.message?.content) {
                    const description = response.choices[0].message.content;

                    if (this.shouldSpeak(description)) {
                        this.lastDescription.set(description);
                        this.visionHistory.update(h => [
                            { timestamp: new Date().toLocaleTimeString(), description },
                            ...h
                        ].slice(0, 20));
                        this.speakDescription(description);
                    }
                }
            } catch (error) {
                console.error('❌ Error en el flujo de VIC:', error);
            } finally {
                this.isProcessing.set(false);
            }
        }

        // Programar siguiente ciclo tras completar el anterior + intervalo
        this.visionTimeout = setTimeout(() => {
            this.runVisionCycle();
        }, this.intervalSeconds() * 1000);
    }

    stopLiveVision() {
        this.liveVisionActive.set(false);
        if (this.visionTimeout) {
            clearTimeout(this.visionTimeout);
            this.visionTimeout = null;
        }
        this.disconnectWebSocket();
        this.showToast('VISIÓN CONTINUA DETENIDA', 'info');
    }

    // ─── SISTEMA DE ALERTAS Y COMUNICACIÓN ───────────────────
    private connectWebSocket() {
        this.visionWebSocket = this.oracle.connectVisionWebSocket();
        this.visionWebSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // 🚨 SI EL BACKEND MANDA TRIGGER, SONAMOS LA ALARMA
            if (data.audio_trigger) {
                this.playAlarm();
                const alertMsg = data.event === 'FALL_DETECTED' ? '🚨 CAÍDA DETECTADA' : '🚨 AMENAZA DETECTADA';
                this.handleSentinelAlert(alertMsg, 'critical', 0.9);
            }
        };
    }

    private handleSentinelAlert(msg: string, type: string, confidence: number) {
        this.visionHistory.update(h => [
            { timestamp: new Date().toLocaleTimeString(), description: msg, fallDetected: true },
            ...h
        ].slice(0, 20));
        this.activeAlerts.update(a => [
            { type, confidence, timestamp: new Date().toLocaleTimeString() },
            ...a
        ].slice(0, 10));
        this.speakDescription(msg);
    }

    private disconnectWebSocket() {
        if (this.visionWebSocket) {
            this.visionWebSocket.close();
            this.visionWebSocket = null;
        }
    }

    // ─── SÍNTESIS DE VOZ (TTS) ───────────────────────────────
    speakDescription(text?: string) {
        const speechText = text || this.lastDescription();
        if (!speechText || this.isSpeaking()) return;

        this.synth.cancel();
        const utterance = new SpeechSynthesisUtterance(speechText.replace(/[*#$_\-`]/g, ''));
        utterance.lang = localStorage.getItem('oracle_lang') === 'es' ? 'es-ES' : 'en-US';

        utterance.onstart = () => this.isSpeaking.set(true);
        utterance.onend = () => this.isSpeaking.set(false);
        utterance.onerror = () => this.isSpeaking.set(false);

        this.synth.speak(utterance);
    }

    stopSpeaking() {
        this.synth.cancel();
        this.isSpeaking.set(false);
    }

    // ─── CAPTURA MANUAL (ANALYSIS TEST) ──────────────────────
    async captureAndAnalyze() {
        if (this.liveVisionActive()) {
            this.showToast('DEBES DETENER LA VISIÓN CONTINUA', 'error');
            return;
        }

        const frameBase64 = this.captureFrameAsBase64();
        if (!frameBase64) return;

        this.isProcessing.set(true);
        const frameFile = this.base64ToFile(frameBase64, `manual_snap_${Date.now()}.jpg`);
        const prompt = 'Describe detalladamente lo que ves en esta imagen.';

        const modo = 'vision_sustained_manual';

        try {
            const response = await this.oracle.analyzeVisionSustained(prompt, frameFile);
            const content = response?.choices?.[0]?.message?.content;
            if (content) {
                this.lastDescription.set(content);
                this.visionHistory.update(h => [
                    { timestamp: new Date().toLocaleTimeString(), description: content },
                    ...h
                ]);
                this.speakDescription(content);
            }
        } catch (err) {
            console.error('Manual Analysis Error:', err);
        } finally {
            this.isProcessing.set(false);
        }
    }

    // ─── HERRAMIENTAS DE APOYO (UTILS) ───────────────────────
    private shouldSpeak(newDesc: string): boolean {
        const last = this.lastDescription();
        if (!last) return true;

        const wordsA = new Set(last.toLowerCase().split(' '));
        const wordsB = new Set(newDesc.toLowerCase().split(' '));
        const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
        const similarity = intersection.size / (new Set([...wordsA, ...wordsB]).size || 1);

        return similarity < this.sensitivity();
    }

    private base64ToFile(base64: string, filename: string): File {
        const arr = base64.split(','),
            mime = arr[0].match(/:(.*?);/)![1],
            bstr = atob(arr[1]);
        let n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        return new File([u8arr], filename, { type: mime });
    }

    private showToast(message: string, type: string) {
        console.log(`🚀 [VIC_${type.toUpperCase()}] ${message}`);
    }

    updateInterval() {
        localStorage.setItem('vision_interval', this.intervalSeconds().toString());
        if (this.liveVisionActive()) {
            this.stopLiveVision();
            this.startLiveVision();
        }
    }

    updateSensitivity() {
        localStorage.setItem('vision_sensitivity', this.sensitivity().toString());
    }

    clearHistory() {
        this.visionHistory.set([]);
        this.activeAlerts.set([]);
        this.showToast('HISTORIAL FORMATEADO', 'info');
    }

    private playAlarm() {
        const audio = new Audio('assets/alarm.mp3');
        audio.volume = 0.8;
        audio.play().catch(err => console.warn("🔇 Bloqueo de audio:", err));
    }
}