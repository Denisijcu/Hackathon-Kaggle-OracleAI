import { Component } from '@angular/core';

@Component({
  selector: 'app-documentation',
  standalone: true,
  template: `
    <div class="docs-container">
      <div class="docs-header">
        <h1 class="docs-title">📚 Documentación</h1>
        <p class="docs-subtitle">Guía completa de instalación y uso</p>
      </div>
      
      <div class="docs-content">
        <div class="docs-sidebar">
          <ul>
            <li><a href="#intro">Introducción</a></li>
            <li><a href="#install">Instalación</a></li>
            <li><a href="#usage">Uso</a></li>
            <li><a href="#modes">Modos</a></li>
            <li><a href="#api">API</a></li>
            <li><a href="#hardware">Hardware</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </div>
        
        <div class="docs-main">
          <section id="intro" class="docs-section">
            <h2>🚀 Introducción</h2>
            <p>OracleAI es un asistente multimodal diseñado para comunidades remotas. Corre completamente offline en hardware de bajo costo y ofrece capacidades de educación y salud.</p>
          </section>
          
          <section id="install" class="docs-section">
            <h2>⚙️ Instalación</h2>
            <h3>Backend</h3>
            <pre><code>git clone https://github.com/vertexcoders/oracleai
cd oracleai/backend
pip install -r requirements.txt
python main.py</code></pre>
            
            <h3>Frontend</h3>
            <pre><code>cd oracleai/frontend
npm install
ng serve</code></pre>
            
            <h3>LM Studio</h3>
            <p>Descarga LM Studio y carga Gemma 4 26B A4B en el puerto 1234</p>
          </section>
          
          <section id="usage" class="docs-section">
            <h2>🎮 Uso</h2>
            <ul>
              <li><strong>Texto:</strong> Escribe tu pregunta directamente</li>
              <li><strong>Imagen:</strong> Arrastra una imagen al drop zone</li>
              <li><strong>Video:</strong> Arrastra un video (extrae frame automático)</li>
              <li><strong>Audio:</strong> Arrastra un audio (transcripción)</li>
              <li><strong>Documentos:</strong> PDF, DOCX, CSV, JSON soportados</li>
            </ul>
          </section>
          
          <section id="modes" class="docs-section">
            <h2>🎓 Modo Educación</h2>
            <p>Optimizado para niños de 6-14 años. Responde con entusiasmo, usa ejemplos divertidos y motiva al estudiante.</p>
            
            <h2>🏥 Modo Salud</h2>
            <p>Diseñado para adultos mayores. Habla con calma, respuestas claras y completas. Nunca reemplaza a un médico.</p>
          </section>
          
          <section id="api" class="docs-section">
            <h2>🔌 API Endpoints</h2>
            <pre><code>POST /api/v1/oracle/analyze
GET  /api/v1/health
GET  /api/v1/modos</code></pre>
          </section>
          
          <section id="hardware" class="docs-section">
            <h2>🖥️ Hardware Recomendado</h2>
            <ul>
              <li><strong>Básico:</strong> Raspberry Pi 5 (8GB) + SSD → $80-90</li>
              <li><strong>Óptimo:</strong> Mini PC (16GB) → $150-200</li>
              <li><strong>Reciclado:</strong> Android 8GB+ → $30-50</li>
            </ul>
          </section>
          
          <section id="faq" class="docs-section">
            <h2>❓ Preguntas Frecuentes</h2>
            
            <div class="faq-item">
              <h3>¿Necesita internet?</h3>
              <p>No. OracleAI corre 100% offline.</p>
            </div>
            
            <div class="faq-item">
              <h3>¿Es privado?</h3>
              <p>Sí. Todo el procesamiento es local. Nada sale del dispositivo.</p>
            </div>
            
            <div class="faq-item">
              <h3>¿Qué idiomas soporta?</h3>
              <p>Español, Inglés, Francés, Árabe, Portugués. Más próximamente.</p>
            </div>
            
            <div class="faq-item">
              <h3>¿Es gratuito?</h3>
              <p>Sí. Código abierto bajo licencia MIT.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .docs-container {
      min-height: calc(100vh - 200px);
      background: linear-gradient(135deg, #000000 0%, #0a0a0a 100%);
      padding: 4rem 2rem;
    }
    
    .docs-header {
      text-align: center;
      margin-bottom: 3rem;
    }
    
    .docs-title {
      color: #22c55e;
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    
    .docs-subtitle {
      color: #a3a3a3;
      font-size: 1.1rem;
    }
    
    .docs-content {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 2rem;
    }
    
    .docs-sidebar {
      position: sticky;
      top: 2rem;
      height: fit-content;
      background: rgba(34, 197, 94, 0.05);
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 12px;
      padding: 1.5rem;
    }
    
    .docs-sidebar ul {
      list-style: none;
      padding: 0;
    }
    
    .docs-sidebar li {
      margin-bottom: 0.75rem;
    }
    
    .docs-sidebar a {
      color: #a3a3a3;
      text-decoration: none;
      transition: color 0.2s;
    }
    
    .docs-sidebar a:hover {
      color: #22c55e;
    }
    
    .docs-main {
      background: rgba(34, 197, 94, 0.05);
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 12px;
      padding: 2rem;
    }
    
    .docs-section {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid rgba(34, 197, 94, 0.2);
    }
    
    .docs-section:last-child {
      border-bottom: none;
    }
    
    .docs-section h2 {
      color: #22c55e;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
    
    .docs-section h3 {
      color: #4ade80;
      font-size: 1.1rem;
      margin: 1rem 0 0.5rem;
    }
    
    .docs-section p {
      color: #d4d4d4;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    
    .docs-section ul {
      color: #d4d4d4;
      padding-left: 1.5rem;
      margin-bottom: 1rem;
    }
    
    .docs-section li {
      margin-bottom: 0.5rem;
    }
    
    pre {
      background: #0a0a0a;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
      margin: 1rem 0;
    }
    
    code {
      color: #22c55e;
      font-family: monospace;
    }
    
    .faq-item {
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(34, 197, 94, 0.1);
    }
    
    .faq-item h3 {
      color: #4ade80;
      margin-bottom: 0.5rem;
    }
    
    @media (max-width: 768px) {
      .docs-content {
        grid-template-columns: 1fr;
      }
      
      .docs-sidebar {
        position: static;
      }
    }
  `]
})
export class DocumentationComponent {}