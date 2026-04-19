import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService, HistoryItem } from '../../core/services/profile.service';
import { AppComponent } from '../../app';

@Component({
  selector: 'app-history',
  standalone: true,
  template: `
    <div class="history-container">
      <div class="history-header">
        <h2>{{ app.dashboardTranslations().modes.history }}</h2>
        @if (history().length > 0) {
          <button class="clear-btn" (click)="clearHistory()" [disabled]="isLoading()">
            🗑️ {{ app.selectedLanguage() === 'es' ? 'Limpiar todo' : 'Clear all' }}
          </button>
        }
      </div>
      
      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ app.selectedLanguage() === 'es' ? 'Cargando historial...' : 'Loading history...' }}</p>
        </div>
      } @else if (history().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">📭</span>
          <p>{{ app.selectedLanguage() === 'es' ? 'Aún no hay conversaciones guardadas' : 'No saved conversations yet' }}</p>
          <button class="start-btn" (click)="goToPlayground()">🎮 {{ app.selectedLanguage() === 'es' ? 'Comenzar ahora' : 'Start now' }}</button>
        </div>
      } @else {
        <div class="history-stats">
          <span>🎓 {{ educationCount() }} {{ app.dashboardTranslations().stats.edu }}</span>
          <span>🏥 {{ healthCount() }} {{ app.dashboardTranslations().stats.health }}</span>
          <span>📄 {{ docsCount() }} {{ app.dashboardTranslations().stats.docs }}</span>
        </div>
        
        <div class="history-list">
          @for (item of history(); track item.id) {
            <div class="history-item" 
                 [class.education]="item.type === 'education'" 
                 [class.health]="item.type === 'health'"
                 (click)="loadToPlayground(item)">
              <div class="history-icon">{{ item.type === 'education' ? '🎓' : '🏥' }}</div>
              <div class="history-content">
                <div class="history-header-row">
                  <p class="history-prompt">{{ item.prompt }}</p>
                  <span class="history-date">{{ formatDate(item.date) }}</span>
                </div>
                <p class="history-response">{{ truncateResponse(item.response) }}</p>
                @if (item.filename) {
                  <div class="history-file">📎 {{ item.filename }}</div>
                }
              </div>
            </div>
          }
        </div>
      }
      
      <div class="history-footer">
        <button class="back-btn" (click)="goBack()">
           ← {{ app.selectedLanguage() === 'es' ? 'Volver al Dashboard' : 'Back to Dashboard' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .history-container {
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }
    
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .history-header h2 {
      color: #22c55e;
      font-size: 1.8rem;
    }
    
    .clear-btn {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid #ef4444;
      color: #ef4444;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .clear-btn:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.4);
    }
    
    .clear-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .loading-state {
      text-align: center;
      padding: 4rem;
      background: rgba(34, 197, 94, 0.05);
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 16px;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #22c55e;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .empty-state {
      text-align: center;
      padding: 4rem;
      background: rgba(34, 197, 94, 0.05);
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 16px;
    }
    
    .empty-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }
    
    .empty-state p {
      color: #a3a3a3;
      margin-bottom: 1.5rem;
    }
    
    .start-btn {
      background: #22c55e;
      color: black;
      border: none;
      border-radius: 8px;
      padding: 0.75rem 1.5rem;
      font-weight: bold;
      cursor: pointer;
    }
    
    .history-stats {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: rgba(34, 197, 94, 0.05);
      border-radius: 12px;
      flex-wrap: wrap;
    }
    
    .history-stats span {
      color: #a3a3a3;
      font-size: 0.8rem;
    }
    
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .history-item {
      background: rgba(34, 197, 94, 0.05);
      border-left: 4px solid;
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .history-item:hover {
      transform: translateX(4px);
      background: rgba(34, 197, 94, 0.1);
    }
    
    .history-item.education {
      border-left-color: #FF9F1C;
    }
    
    .history-item.health {
      border-left-color: #118AB2;
    }
    
    .history-icon {
      font-size: 1.5rem;
    }
    
    .history-content {
      flex: 1;
    }
    
    .history-header-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    
    .history-prompt {
      color: #4ade80;
      font-weight: bold;
    }
    
    .history-date {
      color: #666;
      font-size: 0.7rem;
    }
    
    .history-response {
      color: #a3a3a3;
      font-size: 0.875rem;
      line-height: 1.4;
    }
    
    .history-file {
      color: #666;
      font-size: 0.7rem;
      margin-top: 0.5rem;
    }
    
    .history-footer {
      margin-top: 2rem;
      text-align: center;
    }
    
    .back-btn {
      background: transparent;
      border: 1px solid #22c55e;
      color: #22c55e;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .back-btn:hover {
      background: rgba(34, 197, 94, 0.1);
    }
  `]
})
export class HistoryComponent implements OnInit {
  public app = inject(AppComponent); // 💡 Socio tecnológico inyectado
  private profileService = inject(ProfileService);
  private router = inject(Router);
  
  history = computed(() => this.profileService.getHistory()); 
  
  isLoading = signal(true);

  formatDate(date: Date): string {
    const lang = this.app.selectedLanguage();
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return lang === 'es' ? 'Hace unos minutos' : 'A few minutes ago';
    if (hours < 24) return lang === 'es' ? `Hace ${hours} horas` : `${hours} hours ago`;
    return new Date(date).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US');
  }

  async clearHistory() {
    const msg = this.app.selectedLanguage() === 'es' 
      ? '¿Estás seguro de que quieres borrar todo el historial?' 
      : 'Are you sure you want to clear all history?';
      
    if (confirm(msg)) {
      await this.profileService.clearHistory();
      await this.loadHistory();
    }
  }
  

  
  educationCount = computed(() => {
    return this.history().filter(h => h.type === 'education').length;
  });
  
  healthCount = computed(() => {
    return this.history().filter(h => h.type === 'health').length;
  });
  
  docsCount = computed(() => {
    return this.history().filter(h => h.filetype).length;
  });
  
  async ngOnInit() {
    await this.loadHistory();
  }
  
  async loadHistory() {
    this.isLoading.set(true);
    await this.profileService.loadHistory();
    this.isLoading.set(false);
  }
  

  truncateResponse(response: string): string {
    if (response.length > 150) {
      return response.substring(0, 150) + '...';
    }
    return response;
  }
  

  
  loadToPlayground(item: HistoryItem) {
    // Navegar al playground con la conversación seleccionada
    this.router.navigate(['/playground'], { 
      queryParams: { 
        mode: item.type,
        prompt: item.prompt,
        loadHistory: item.id
      } 
    });
  }
  
  goToPlayground() {
    this.router.navigate(['/playground']);
  }
  
  goBack() {
    this.router.navigate(['/']);
  }
}