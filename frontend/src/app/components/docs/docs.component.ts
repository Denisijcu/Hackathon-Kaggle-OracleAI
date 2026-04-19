import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppComponent } from '../../app'

@Component({
    selector: 'app-docs',
    standalone: true,
    imports: [CommonModule],
    template: `
 <div class="docs-container">
  <header class="docs-header">
    <h1 class="docs-title">{{ app.docsTranslations().title }}</h1>
    <p class="docs-subtitle uppercase-tracking">{{ app.docsTranslations().subtitle }}</p>
  </header>

  <div class="docs-grid">
    <section class="docs-card border-green">
      <div class="card-header">
        <span class="icon">🏗️</span>
        <h2>{{ app.docsTranslations().archTitle }}</h2>
      </div>
      <div class="card-content">
        <p>{{ app.docsTranslations().archDesc }}</p>
        <ul>
          <li><strong>Core Engine:</strong> Gemma-4 (7B) Quantized.</li>
          <li><strong>Backend:</strong> FastAPI.</li>
          <li><strong>Frontend:</strong> Angular 19 Signals.</li>
        </ul>
      </div>
    </section>

    <section class="docs-card border-blue">
      <div class="card-header">
        <span class="icon">⚡</span>
        <h2>{{ app.docsTranslations().setupTitle }}</h2>
      </div>
      <div class="card-content">
        <pre class="terminal-box"><code>git clone https://github.com/vertexcoders/oracleai
docker-compose up --build -d</code></pre>
        <p class="note">{{ app.docsTranslations().setupReq }}</p>
      </div>
    </section>

    <section class="docs-card border-purple">
      <div class="card-header">
        <span class="icon">👁️</span>
        <h2>{{ app.docsTranslations().multiTitle }}</h2>
      </div>
      <div class="card-content">
        <p>{{ app.docsTranslations().multiDesc }}</p>
        <ul>
          <li>Vision: Base64 Stream.</li>
          <li>Voice: Web Speech API.</li>
          <li>Knowledge: PDF/CSV Injection.</li>
        </ul>
      </div>
    </section>

    <section class="docs-card border-zinc">
      <div class="card-header">
        <span class="icon">📡</span>
        <h2>{{ app.docsTranslations().offlineTitle }}</h2>
      </div>
      <div class="card-content">
        <p>{{ app.docsTranslations().offlineDesc }}</p>
        <div class="status-badge">STATUS: OPERATIONAL</div>
      </div>
    </section>
  </div>
</div>
  `,
    styles: [`
    .docs-container { min-height: calc(100vh - 80px); background: #000; padding: 4rem 2rem; color: #fff; }
    .docs-header { text-align: center; margin-bottom: 4rem; }
    .docs-title { font-size: 2.5rem; font-weight: 900; letter-spacing: -1px; }
    .uppercase-tracking { text-transform: uppercase; letter-spacing: 0.3em; color: #525252; font-size: 0.75rem; font-weight: 800; }
    
    .docs-grid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    
    .docs-card { background: #050505; border: 1px solid #18181b; border-radius: 16px; padding: 2rem; transition: transform 0.3s ease; }
    .docs-card:hover { transform: translateY(-5px); border-color: #27272a; }
    
    .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; }
    .card-header h2 { font-size: 0.8rem; font-weight: 900; letter-spacing: 0.1em; color: #22c55e; }
    .icon { font-size: 1.5rem; }

    .card-content p { color: #a1a1aa; font-size: 0.9rem; line-height: 1.6; margin-bottom: 1rem; }
    .card-content ul { color: #71717a; font-size: 0.85rem; padding-left: 1.2rem; }
    .card-content li { margin-bottom: 0.5rem; }

    .terminal-box { background: #000; padding: 1rem; border-radius: 8px; border: 1px solid #18181b; color: #4ade80; font-family: 'Monaco', monospace; font-size: 0.8rem; margin: 1rem 0; overflow-x: auto; }
    
    .border-green { border-top: 4px solid #22c55e; }
    .border-blue { border-top: 4px solid #3b82f6; }
    .border-purple { border-top: 4px solid #a855f7; }
    .border-zinc { border-top: 4px solid #71717a; }

    .status-badge { display: inline-block; background: rgba(34, 197, 94, 0.1); color: #22c55e; padding: 4px 12px; border-radius: 4px; font-size: 10px; font-weight: 900; margin-top: 10px; }
    .note { font-size: 10px; color: #525252; font-style: italic; }

    .docs-footer { text-align: center; margin-top: 5rem; color: #27272a; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.2em; }
  `]
})
export class DocsComponent {
    public app = inject(AppComponent);
}
