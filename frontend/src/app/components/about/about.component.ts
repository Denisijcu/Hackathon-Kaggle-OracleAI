import { Component, inject } from '@angular/core';
import { AppComponent } from '../../app';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="about-container">
      <div class="about-header">
        <h1 class="about-title">🦾 {{ app.aboutTranslations().title }} <span class="v-tag">V4.1</span></h1>
        <p class="about-subtitle uppercase-tracking">Vertex Intelligence Core | Open Source Impact</p>
      </div>
      
      <div class="about-content">
        <section class="about-section highlight-border">
          <h2>🎯 {{ app.aboutTranslations().mission }}</h2>
          <p [innerHTML]="app.aboutTranslations().missionDesc"></p>
        </section>

        <div class="about-grid">
          <div class="about-card">
            <span class="card-icon">🎓</span>
            <h3>{{ app.aboutTranslations().eduTitle }}</h3>
            <p>{{ app.aboutTranslations().eduDesc }}</p>
          </div>
          
          <div class="about-card border-green">
            <span class="card-icon">🏥</span>
            <h3>{{ app.aboutTranslations().healthTitle }}</h3>
            <p>{{ app.aboutTranslations().healthDesc }}</p>
          </div>
          
          <div class="about-card">
            <span class="card-icon">🔒</span>
            <h3>{{ app.aboutTranslations().privTitle }}</h3>
            <p>{{ app.aboutTranslations().privDesc }}</p>
          </div>
          
          <div class="about-card">
            <span class="card-icon">🌍</span>
            <h3>{{ app.aboutTranslations().multiTitle }}</h3>
            <p>{{ app.aboutTranslations().multiDesc }}</p>
          </div>
        </div>

        <section class="about-section tech-box">
          <h2>🏗️ {{ app.aboutTranslations().archTitle }}</h2>
          <div class="tech-stack">
            <span class="t-badge">Angular 19</span>
            <span class="t-badge">FastAPI</span>
            <span class="t-badge">Gemma-4 (VIC Engine)</span>
            <span class="t-badge">Local SSD / RPi5</span>
          </div>
          <p class="tech-desc" [innerHTML]="app.aboutTranslations().archDesc"></p>
        </section>

        <footer class="about-footer">
          <p>Developed by <strong>Vertex Coders LLC</strong> | Miami, FL</p>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .about-container {
      min-height: calc(100vh - 80px);
      background: #000000;
      padding: 4rem 2rem;
      font-family: 'Inter', sans-serif;
    }
    .about-header { text-align: center; margin-bottom: 4rem; }
    .about-title { color: #ffffff; font-size: 3rem; font-weight: 900; letter-spacing: -2px; }
    .v-tag { color: #22c55e; font-size: 1rem; vertical-align: top; }
    .uppercase-tracking { text-transform: uppercase; letter-spacing: 0.3em; color: #525252; font-size: 0.75rem; font-weight: 800; margin-top: 10px; }
    .about-content { max-width: 900px; margin: 0 auto; }
    
    .about-section {
      background: #050505;
      border: 1px solid #18181b;
      border-radius: 16px;
      padding: 2.5rem;
      margin-bottom: 2rem;
    }
    .highlight-border { border-left: 4px solid #22c55e; }
    
    .about-section h2 { color: #22c55e; font-size: 0.8rem; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 1rem; font-weight: 900; }
    .about-section p { color: #a1a1aa; line-height: 1.8; font-size: 1.1rem; }
    
    .about-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .about-card { background: #09090b; border: 1px solid #18181b; border-radius: 16px; padding: 2rem; transition: all 0.3s ease; }
    .about-card:hover { border-color: #27272a; transform: translateY(-5px); background: #0c0c0e; }
    .border-green { border-bottom: 2px solid #22c55e; }
    .card-icon { font-size: 2rem; margin-bottom: 1rem; display: block; }
    .about-card h3 { color: #ffffff; font-size: 0.9rem; font-weight: 800; margin-bottom: 0.5rem; letter-spacing: 0.05em; }
    .about-card p { color: #71717a; font-size: 0.85rem; line-height: 1.6; }

    .tech-stack { display: flex; gap: 8px; margin: 1.5rem 0; flex-wrap: wrap; }
    .t-badge { background: #18181b; color: #22c55e; padding: 4px 12px; border-radius: 4px; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; }
    .tech-desc { font-size: 0.9rem !important; color: #52525b !important; }

    .about-footer { text-align: center; margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #18181b; }
    .about-footer p { color: #3f3f46; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; }
  `]
})
export class AboutComponent {
  public app = inject(AppComponent);
}