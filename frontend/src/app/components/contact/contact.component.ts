import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="contact-container">
      <div class="contact-header">
        <h1 class="contact-title">📧 CONNECT_WITH_VIC</h1>
        <p class="contact-subtitle uppercase-tracking">Vertex Intelligence Core | Global Support</p>
      </div>
      
      <div class="contact-content">
        <div class="contact-info">
          <div class="info-card terminal-border">
            <span class="info-icon">📧</span>
            <h3>SYSTEM_ADMIN</h3>
            <a href="mailto:denisijcu266@gmail.com">denisijcu266@gmail.com</a>
          </div>
          
          <div class="info-card terminal-border">
            <span class="info-icon">🐙</span>
            <h3>SOURCE_CODE</h3>
            <a href="https://github.com/vertexcoders" target="_blank">github.com/vertexcoders</a>
          </div>
          
          <div class="info-card terminal-border">
            <span class="info-icon">📍</span>
            <h3>NODE_LOCATION</h3>
            <span class="text-zinc-500">Miami, FL / Global</span>
          </div>
        </div>
        
        <div class="contact-form terminal-window">
          <div class="terminal-bar">
            <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
            <span class="terminal-title">SEND_MESSAGE.EXE</span>
          </div>
          
          <form (ngSubmit)="onSubmit()" #contactForm="ngForm">
            <div class="form-group">
              <label>SENDER_NAME</label>
              <input type="text" [(ngModel)]="formData.name" name="name" required placeholder="Tu nombre...">
            </div>
            
            <div class="form-group">
              <label>SENDER_EMAIL</label>
              <input type="email" [(ngModel)]="formData.email" name="email" required placeholder="tu@email.com">
            </div>
            
            <div class="form-group">
              <label>MESSAGE_BODY</label>
              <textarea [(ngModel)]="formData.message" name="message" rows="4" required placeholder="Escribe tu mensaje aquí..."></textarea>
            </div>

            <div class="form-group">
              <label>ATTACH_SCREENSHOT (OPTIONAL)</label>
              <input type="file" (change)="onFileSelected($event)" accept="image/*" style="font-size: 10px; color: #525252;">
              @if (currentBase64()) {
                <p style="color: #22c55e; font-size: 10px; margin-top: 5px;">✅ IMAGE_ATTACHED_READY</p>
              }
            </div>
            
            <button type="submit" [disabled]="isSending() || !contactForm.form.valid" class="submit-btn">
              {{ isSending() ? '⚡ UPLOADING_DATA...' : '📨 TRANSMIT_MESSAGE' }}
            </button>
          </form>
          
          @if (showSuccess()) {
            <div class="success-message animate-in zoom-in duration-300">
              <p>✅ DATA_RECEIVED: Gracias, brother. Te responderemos pronto.</p>
            </div>
          }

          @if (showError()) {
            <div class="error-message animate-in shake duration-300">
              <p>❌ UPLOAD_FAILED: El servidor de Google no respondió. Reintenta luego.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact-container { min-height: calc(100vh - 80px); background: #000; padding: 4rem 2rem; color: #fff; }
    .contact-header { text-align: center; margin-bottom: 3rem; }
    .contact-title { font-size: 2.5rem; font-weight: 900; letter-spacing: -1px; color: #22c55e; }
    .uppercase-tracking { text-transform: uppercase; letter-spacing: 0.3em; color: #525252; font-size: 0.7rem; font-weight: 800; }
    .contact-content { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1.5fr; gap: 2.5rem; }
    .contact-info { display: flex; flex-direction: column; gap: 1rem; }
    .terminal-border { border: 1px solid #18181b; background: #09090b; border-radius: 12px; padding: 1.5rem; transition: border 0.3s; }
    .terminal-border:hover { border-color: #22c55e; }
    .info-card h3 { color: #22c55e; font-size: 0.7rem; font-weight: 900; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
    .info-card a { color: #a1a1aa; text-decoration: none; font-size: 0.9rem; }
    .terminal-window { background: #050505; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; }
    .terminal-bar { background: #18181b; padding: 8px 16px; display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .red { background: #ff5f56; } .yellow { background: #ffbd2e; } .green { background: #27c93f; }
    .terminal-title { margin-left: 10px; font-size: 10px; color: #71717a; font-weight: 900; letter-spacing: 0.1em; }
    form { padding: 2rem; }
    .form-group { margin-bottom: 1.2rem; }
    .form-group label { display: block; color: #22c55e; font-size: 0.7rem; font-weight: 900; margin-bottom: 0.5rem; letter-spacing: 0.05em; }
    .form-group input, .form-group textarea {
      width: 100%; background: #0a0a0a; border: 1px solid #18181b; border-radius: 6px; padding: 0.8rem; color: #fff; font-family: 'Monaco', monospace; font-size: 0.9rem;
    }
    .form-group input:focus, .form-group textarea:focus { outline: none; border-color: #22c55e; background: #0c0c0e; }
    .submit-btn {
      width: 100%; background: #22c55e; color: #000; border: none; border-radius: 6px; padding: 1rem; font-weight: 900; cursor: pointer; transition: all 0.2s;
    }
    .submit-btn:hover:not(:disabled) { background: #4ade80; transform: translateY(-2px); box-shadow: 0 4px 20px rgba(34, 197, 94, 0.2); }
    .submit-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .success-message { margin: 1.5rem; padding: 1rem; border: 1px solid #22c55e; color: #22c55e; background: rgba(34, 197, 94, 0.05); font-size: 0.8rem; font-weight: 800; border-radius: 8px; }
    .error-message { margin: 1.5rem; padding: 1rem; border: 1px solid #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.05); font-size: 0.8rem; font-weight: 800; border-radius: 8px; }
    @media (max-width: 768px) { .contact-content { grid-template-columns: 1fr; } }
  `]
})
export class ContactComponent {
  private http = inject(HttpClient);
  
  private readonly APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxCXIDJ3rqNy-WiPnHRoGaSPclcAUnQiwXJIA1Tpa57DTnafscTiAxHrZMkjxUA0fxA/exec';

  formData = { name: '', email: '', message: '' };
  currentBase64 = signal<string | null>(null);
  isSending = signal(false);
  showSuccess = signal(false);
  showError = signal(false);

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        this.currentBase64.set(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async onSubmit() {
  if (this.isSending()) return;
  this.isSending.set(true);
  this.showSuccess.set(false);
  this.showError.set(false);

  // 1. Preparamos el cuerpo como URL Search Params (Formulario)
  const urlSearchParams = new URLSearchParams();
  urlSearchParams.append('name', this.formData.name);
  urlSearchParams.append('email', this.formData.email);
  urlSearchParams.append('message', this.formData.message);
  urlSearchParams.append('image_data', this.currentBase64() || "");
  urlSearchParams.append('timestamp', new Date().toISOString());

  try {
    /**
     * 🚀 ESTRATEGIA DE "DISPARA Y OLVIDA" (Bypass CORS)
     * Usamos fetch nativo con modo 'no-cors' porque Google Apps Script 
     * redirige a dominios de 'googleusercontent' que rompen el HttpClient de Angular.
     */
    await fetch(this.APP_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // <--- LA CLAVE: Evita que el navegador bloquee por CORS
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: urlSearchParams.toString()
    });

    // Como es 'no-cors', no podemos leer la respuesta, así que asumimos éxito 
    // si el fetch no lanzó una excepción de red.
    this.showSuccess.set(true);
    this.resetForm();
    setTimeout(() => this.showSuccess.set(false), 8000);

  } catch (err) {
    console.error("❌ CRITICAL_TRANSMISSION_FAILURE:", err);
    this.showError.set(true);
  } finally {
    this.isSending.set(false);
  }
}

  private resetForm() {
    this.formData = { name: '', email: '', message: '' };
    this.currentBase64.set(null);
  }
}