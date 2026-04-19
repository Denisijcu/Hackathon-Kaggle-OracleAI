import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppComponent } from '../../app';

@Component({
  selector: 'app-footer',
  imports: [RouterModule],
  standalone: true,
  template: `
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-section">
          <h3 class="footer-title">OracleAI</h3>
          <p class="footer-description">
            {{ app.footerTranslations().desc }}
          </p>
          <div class="footer-social">
            <a href="https://github.com/vertexcoders" class="social-link">🐙 GitHub</a>
            <a href="#" class="social-link">💼 LinkedIn</a>
          </div>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-subtitle">{{ app.footerTranslations().links }}</h4>
          <ul class="footer-links">
            <li><a routerLink="/">{{ app.navTranslations().home }}</a></li>
            <li><a routerLink="/about">{{ app.navTranslations().about }}</a></li>
            <li><a routerLink="/docs">{{ app.navTranslations().docs }}</a></li>
            <li><a routerLink="/contact">{{ app.navTranslations().contact }}</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-subtitle">{{ app.footerTranslations().legal }}</h4>
          <ul class="footer-links">
            <li><a href="#">{{ app.footerTranslations().privacy }}</a></li>
            <li><a href="#">{{ app.footerTranslations().terms }}</a></li>
            <li><a href="#">Licencia MIT</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4 class="footer-subtitle">{{ app.footerTranslations().tech }}</h4>
          <ul class="footer-links">
            <li>🐍 FastAPI</li>
            <li>🅰 Angular 19</li>
            <li>🤖 Gemma 4</li>
            <li>🐧 Raspberry Pi</li>
          </ul>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; 2026 OracleAI Global Community Hub. {{ app.footerTranslations().made }}</p>
        <p class="footer-version">v4.1.0 | Vertex Intelligence Core</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: linear-gradient(180deg, #0a0a0a 0%, #000000 100%);
      border-top: 1px solid #22c55e;
      padding: 3rem 2rem 1.5rem;
      margin-top: 4rem;
    }
    
    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }
    
    .footer-title {
      color: #22c55e;
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }
    
    .footer-subtitle {
      color: #4ade80;
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    
    .footer-description {
      color: #a3a3a3;
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: 1rem;
    }
    
    .footer-links {
      list-style: none;
      padding: 0;
    }
    
    .footer-links li {
      margin-bottom: 0.5rem;
    }
    
    .footer-links a {
      color: #a3a3a3;
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s;
    }
    
    .footer-links a:hover {
      color: #22c55e;
    }
    
    .footer-social {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
    
    .social-link {
      color: #a3a3a3;
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s;
    }
    
    .social-link:hover {
      color: #22c55e;
    }
    
    .footer-bottom {
      text-align: center;
      padding-top: 1.5rem;
      border-top: 1px solid #1a1a1a;
    }
    
    .footer-bottom p {
      color: #666;
      font-size: 0.75rem;
      margin-bottom: 0.25rem;
    }
    
    .footer-version {
      color: #22c55e;
      opacity: 0.5;
    }
  `]
})
export class FooterComponent {
 public app = inject(AppComponent);

}