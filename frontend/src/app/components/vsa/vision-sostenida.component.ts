import { Component, signal, OnDestroy, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OracleService } from '../../core/services/oracle.service';

@Component({
  selector: 'app-vision-sostenida',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vision-sostenida.component.html',
  styleUrls: ['./vision-sostenida.component.css']
})
export class VisionSostenidaComponent implements OnDestroy {
  private oracle = inject(OracleService);

  @ViewChild('cameraVideo') cameraVideo!: ElementRef<HTMLVideoElement>;

  // Estados
  isCameraActive = signal(false);
  isProcessing = signal(false);
  isSpeaking = signal(false);
  liveVisionActive = signal(false);
  lastDescription = signal<string | null>(null);
  lastMovement = signal<Date | null>(null);
  alertActive = signal(false);
  alertMessage = signal<string | null>(null);
  
  // Historial
  visionHistory = signal<Array<{timestamp: string, description: string, alert: boolean}>>([]);
  
  // Configuración
  intervalSeconds = signal(8);
  sensitivity = signal(0.3);
  absenceMinutes = signal(5);  // Tiempo sin movimiento para alerta
  whatsappNumber = signal('');
  enableWhatsApp = signal(false);
  enableSoundAlerts = signal(true);
  
  // Privados
  private videoStream: MediaStream | null = null;
  private visionInterval: any = null;
  private lastSceneHash = signal('');
  private synth = window.speechSynthesis;
  private absenceInterval: any = null;
  private fallDetectionActive = signal(false);

  constructor() {
    this.loadConfig();
  }

  ngOnDestroy() {
    this.stopCamera();
    this.stopLiveVision();
    this.stopAbsenceMonitoring();
  }

  // ─────────────────────────────────────────────────────────────
  // CONFIGURACIÓN
  // ─────────────────────────────────────────────────────────────
  private loadConfig() {
    const savedInterval = localStorage.getItem('vision_interval');
    if (savedInterval) this.intervalSeconds.set(parseInt(savedInterval));
    
    const savedSensitivity = localStorage.getItem('vision_sensitivity');
    if (savedSensitivity) this.sensitivity.set(parseFloat(savedSensitivity));
    
    const savedAbsence = localStorage.getItem('vision_absence_minutes');
    if (savedAbsence) this.absenceMinutes.set(parseInt(savedAbsence));
    
    const savedWhatsapp = localStorage.getItem('vision_whatsapp_number');
    if (savedWhatsapp) this.whatsappNumber.set(savedWhatsapp);
    
    const savedEnableWhatsApp = localStorage.getItem('vision_enable_whatsapp');
    if (savedEnableWhatsApp) this.enableWhatsApp.set(savedEnableWhatsApp === 'true');
    
    const savedEnableSound = localStorage.getItem('vision_enable_sound');
    if (savedEnableSound) this.enableSoundAlerts.set(savedEnableSound === 'true');
  }

  saveConfig() {
    localStorage.setItem('vision_interval', this.intervalSeconds().toString());
    localStorage.setItem('vision_sensitivity', this.sensitivity().toString());
    localStorage.setItem('vision_absence_minutes', this.absenceMinutes().toString());
    localStorage.setItem('vision_whatsapp_number', this.whatsappNumber());
    localStorage.setItem('vision_enable_whatsapp', this.enableWhatsApp().toString());
    localStorage.setItem('vision_enable_sound', this.enableSoundAlerts().toString());
    
    if (this.liveVisionActive()) {
      this.stopLiveVision();
      this.startLiveVision();
    }
    this.showToast('Configuración guardada', 'success');
  }

  // ─────────────────────────────────────────────────────────────
  // CÁMARA
  // ─────────────────────────────────────────────────────────────
  async toggleCamera() {
    this.isCameraActive() ? this.stopCamera() : await this.startCamera();
  }

  private async startCamera() {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      
      if (this.cameraVideo) {
        this.cameraVideo.nativeElement.srcObject = this.videoStream;
        await this.cameraVideo.nativeElement.play();
      }
      
      this.isCameraActive.set(true);
      this.lastMovement.set(new Date());
      this.showToast('CÁMARA ACTIVADA', 'success');
    } catch (err) {
      this.showToast('ERROR AL ACCEDER A LA CÁMARA', 'error');
    }
  }

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(t => t.stop());
      this.videoStream = null;
    }
    this.isCameraActive.set(false);
    if (this.cameraVideo) {
      this.cameraVideo.nativeElement.srcObject = null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CAPTURA DE FRAME
  // ─────────────────────────────────────────────────────────────
  captureFrameAsBase64(): string | null {
    const video = this.cameraVideo?.nativeElement;
    if (!video || video.readyState < 2) return null;

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let hash = 0;
    for (let i = 0; i < imageData.data.length; i += 1000) {
      hash += imageData.data[i];
    }
    this.lastSceneHash.set(hash.toString());
    
    return canvas.toDataURL('image/jpeg', 0.6);
  }

  private base64ToFile(base64: string, filename: string): File {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }

  // ─────────────────────────────────────────────────────────────
  // DETECCIÓN DE CAÍDAS (simplificada con IA)
  // ─────────────────────────────────────────────────────────────
  private async detectFall(frameFile: File): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('file', frameFile);
      
      const response = await fetch('http://localhost:8080/api/vision/analyze-frame', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      return result.fall_detected === true;
    } catch (error) {
      console.error('Fall detection error:', error);
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // ALERTAS
  // ─────────────────────────────────────────────────────────────
  private async triggerAlert(type: 'fall' | 'absence', details: string) {
    if (this.alertActive()) return;
    
    this.alertActive.set(true);
    
    let message = '';
    if (type === 'fall') {
      message = '🚨 ¡ALERTA DE CAÍDA DETECTADA! 🚨 Verifique inmediatamente.';
    } else if (type === 'absence') {
      message = `⚠️ SIN MOVIMIENTO DETECTADO por ${this.absenceMinutes()} minutos. ⚠️`;
    }
    
    this.alertMessage.set(message);
    this.showToast(message, 'error');
    
    // Sonido de alerta
    if (this.enableSoundAlerts()) {
      this.speakAlert(message);
    }
    
    // WhatsApp
    if (this.enableWhatsApp() && this.whatsappNumber()) {
      await this.sendWhatsAppAlert(message + ' ' + details);
    }
    
    // Guardar en historial como alerta
    this.visionHistory.update(history => {
      return [{ timestamp: new Date().toLocaleTimeString(), description: message, alert: true }, ...history];
    });
    
    // Auto-desactivar después de 30 segundos
    setTimeout(() => {
      this.alertActive.set(false);
      this.alertMessage.set(null);
    }, 30000);
  }

  private speakAlert(message: string) {
    if (this.isSpeaking()) {
      this.synth.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    utterance.volume = 1;
    
    utterance.onstart = () => this.isSpeaking.set(true);
    utterance.onend = () => this.isSpeaking.set(false);
    
    this.synth.speak(utterance);
  }

  private async sendWhatsAppAlert(message: string) {
    // Usar API de WhatsApp (necesitas configurar)
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${this.whatsappNumber()}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  // ─────────────────────────────────────────────────────────────
  // MONITOREO DE AUSENCIA
  // ─────────────────────────────────────────────────────────────
  private startAbsenceMonitoring() {
    this.stopAbsenceMonitoring();
    this.absenceInterval = setInterval(() => {
      if (!this.liveVisionActive()) return;
      
      const lastMove = this.lastMovement();
      if (lastMove) {
        const minutesSinceLastMove = (new Date().getTime() - lastMove.getTime()) / 1000 / 60;
        if (minutesSinceLastMove >= this.absenceMinutes()) {
          this.triggerAlert('absence', `Último movimiento: ${minutesSinceLastMove.toFixed(1)} minutos`);
        }
      }
    }, 60000); // Revisar cada minuto
  }

  private stopAbsenceMonitoring() {
    if (this.absenceInterval) {
      clearInterval(this.absenceInterval);
      this.absenceInterval = null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // VISIÓN CONTINUA
  // ─────────────────────────────────────────────────────────────
  async startLiveVision() {
    if (!this.isCameraActive()) {
      await this.startCamera();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (this.visionInterval) return;
    
    this.liveVisionActive.set(true);
    this.startAbsenceMonitoring();
    this.showToast('👁️ VISIÓN CONTINUA ACTIVADA', 'success');
    
    const prompt = `[VISIÓN SOSTENIDA] Describe brevemente y de forma natural lo que ves en esta imagen. 
    Máximo 20 palabras. Sé conciso. Si ves una persona en el suelo o cayéndose, di "ALERTA CAÍDA".`;
    
    this.visionInterval = setInterval(async () => {
      if (this.isProcessing() || !this.isCameraActive()) return;
      
      const frameBase64 = this.captureFrameAsBase64();
      if (!frameBase64) return;
      
      this.isProcessing.set(true);
      
      try {
        const frameFile = this.base64ToFile(frameBase64, `frame_${Date.now()}.jpg`);
        
        // Detección de caídas paralela
        const fallDetected = await this.detectFall(frameFile);
        if (fallDetected) {
          await this.triggerAlert('fall', 'Persona en el suelo detectada');
          this.stopLiveVision(); // Parar para no saturar
          return;
        }
        
        // Descripción normal con IA
        const response = await this.oracle.analyzeVision(prompt, frameFile);
        
        if (response?.choices?.[0]?.message?.content) {
          let description = response.choices[0].message.content;
          
          // Detectar caída por texto también
          if (description.toLowerCase().includes('caída') || description.toLowerCase().includes('suelo')) {
            await this.triggerAlert('fall', description);
          }
          
          this.lastDescription.set(description);
          this.lastMovement.set(new Date());
          
          // Guardar en historial
          this.visionHistory.update(history => {
            return [{ timestamp: new Date().toLocaleTimeString(), description, alert: false }, ...history];
          });
          
          // Hablar solo si hay cambio significativo
          if (this.shouldSpeak(description)) {
            this.speakDescription(description);
          }
        }
      } catch (error) {
        console.error('Vision error:', error);
        this.lastDescription.set('⚠️ Error procesando imagen');
      } finally {
        this.isProcessing.set(false);
      }
    }, this.intervalSeconds() * 1000);
  }
  
  stopLiveVision() {
    if (this.visionInterval) {
      clearInterval(this.visionInterval);
      this.visionInterval = null;
    }
    this.liveVisionActive.set(false);
    this.stopAbsenceMonitoring();
    this.showToast('VISIÓN CONTINUA DESACTIVADA', 'info');
  }
  
  private shouldSpeak(newDescription: string): boolean {
    const lastDesc = this.lastDescription();
    if (!lastDesc) return true;
    
    const wordsA = new Set(lastDesc.toLowerCase().split(' '));
    const wordsB = new Set(newDescription.toLowerCase().split(' '));
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    const similarity = intersection.size / union.size;
    
    return similarity < this.sensitivity();
  }
  
  // ─────────────────────────────────────────────────────────────
  // TTS
  // ─────────────────────────────────────────────────────────────
  speakDescription(text?: string) {
    const speechText = text || this.lastDescription();
    if (!speechText || this.isSpeaking()) return;
    
    this.synth.cancel();
    
    const cleanText = speechText.replace(/[*#$_\-`]/g, '').substring(0, 2000);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = localStorage.getItem('oracle_lang') === 'es' ? 'es-ES' : 'en-US';
    utterance.rate = 0.95;
    
    utterance.onstart = () => this.isSpeaking.set(true);
    utterance.onend = () => this.isSpeaking.set(false);
    utterance.onerror = () => this.isSpeaking.set(false);
    
    this.synth.speak(utterance);
  }
  
  stopSpeaking() {
    this.synth.cancel();
    this.isSpeaking.set(false);
  }
  
  // ─────────────────────────────────────────────────────────────
  // UTILS
  // ─────────────────────────────────────────────────────────────
  captureAndAnalyze() {
    const frameBase64 = this.captureFrameAsBase64();
    if (!frameBase64) return;
    
    this.isProcessing.set(true);
    const frameFile = this.base64ToFile(frameBase64, `capture_${Date.now()}.jpg`);
    
    this.oracle.analyzeVision('Describe detalladamente lo que ves en esta imagen.', frameFile)
      .then(response => {
        if (response?.choices?.[0]?.message?.content) {
          this.lastDescription.set(response.choices[0].message.content);
          this.speakDescription(response.choices[0].message.content);
          
          this.visionHistory.update(history => {
            return [{ timestamp: new Date().toLocaleTimeString(), description: response.choices[0].message.content, alert: false }, ...history];
          });
        }
      })
      .catch(err => console.error(err))
      .finally(() => this.isProcessing.set(false));
  }
  
  clearHistory() {
    this.visionHistory.set([]);
    this.showToast('HISTORIAL LIMPIADO', 'success');
  }
  
  clearAlert() {
    this.alertActive.set(false);
    this.alertMessage.set(null);
  }
  
  private showToast(message: string, type: 'success' | 'error' | 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Implementar toast visual si quieres
  }
}