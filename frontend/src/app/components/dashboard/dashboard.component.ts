import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import { OracleService } from '../../core/services/oracle.service';
import { AppComponent } from '../../app';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="dashboard">
      <!-- Perfiles -->
      <div class="profile-section">
        <h2>{{ app.dashboardTranslations().who }}</h2>
        <div class="profile-cards">
          @for (profile of profiles(); track profile.id) {
            <div class="profile-card" 
                 [class.active]="currentProfile()?.id === profile.id"
                 (click)="selectProfile(profile)">
              <span class="profile-avatar">{{ profile.avatar }}</span>
              <span class="profile-name">{{ profile.name }}</span>
              <span class="profile-role">
                {{ app.dashboardTranslations().roles[profile.role] || profile.role }}
              </span>
            </div>
          }
        </div>
      </div>
      
      <!-- Estadísticas -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-icon">🎓</span>
          <div class="stat-info">
            <h3>{{ app.dashboardTranslations().stats.edu }}</h3>
            <p class="stat-number">{{ stats().educationQueries }}</p>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🏥</span>
          <div class="stat-info">
            <h3>{{ app.dashboardTranslations().stats.health }}</h3>
            <p class="stat-number">{{ stats().healthQueries }}</p>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📄</span>
          <div class="stat-info">
            <h3>{{ app.dashboardTranslations().stats.docs }}</h3>
            <p class="stat-number">{{ stats().documentsProcessed }}</p>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">⚡</span>
          <div class="stat-info">
            <h3>{{ app.dashboardTranslations().stats.time }}</h3>
            <p class="stat-number">{{ stats().avgResponseTime }}s</p>
          </div>
        </div>
      </div>
      
   
      <!-- Agentes por Categorías -->
      <div class="agents-section">
        <h2>{{ app.dashboardTranslations().agentsTitle }}</h2>
        <p class="section-subtitle">{{ app.dashboardTranslations().agentsSub }}</p>
        
        @for (category of categories(); track category.name) {
          <div class="category-group">
            <div class="category-header">
             
             <h3 class="category-title">{{ app.dashboardTranslations().categories.education_sciences }}</h3>
            </div>
            <div class="agents-grid">
              @for (agent of category.agents; track agent.key) {
                <div class="agent-card" (click)="goToPlayground(getAgentMode(agent.key), agent.key)">
                  <span class="agent-icon">{{ agent.icon }}</span>
                  <span class="agent-name">{{ app.dashboardTranslations().names[agent.key] }}</span>
                  <span class="agent-desc">{{ app.dashboardTranslations().descs[agent.key] }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
      
      <!-- Acciones rápidas -->
      <div class="quick-actions">
        <button class="action-btn" (click)="goToPlayground('education', '')">
          {{ app.dashboardTranslations().modes.edu }}
        </button>
        <button class="action-btn health-btn" (click)="goToPlayground('health', '')">
          {{ app.dashboardTranslations().modes.health }}
        </button>
        <button class="action-btn secondary" (click)="goToHistory()">
          {{ app.dashboardTranslations().modes.history }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .profile-section { background: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; }
    .profile-section h2 { color: #22c55e; font-size: 1.2rem; margin-bottom: 1rem; }
    .profile-cards { display: flex; gap: 1rem; flex-wrap: wrap; }
    .profile-card { background: #1a1a1a; border: 2px solid #2a2a2a; border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.25rem; cursor: pointer; transition: all 0.2s; min-width: 110px; }
    .profile-card:hover { transform: translateY(-2px); border-color: #22c55e; }
    .profile-card.active { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); }
    .profile-avatar { font-size: 2rem; }
    .profile-name { color: white; font-weight: bold; }
    .profile-role { color: #a3a3a3; font-size: 0.7rem; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; }
    .stat-icon { font-size: 2rem; }
    .stat-info h3 { color: #a3a3a3; font-size: 0.75rem; margin-bottom: 0.25rem; }
    .stat-number { color: #22c55e; font-size: 1.5rem; font-weight: bold; }
    
    .agents-section { margin-bottom: 2rem; }
    .agents-section h2 { color: #22c55e; margin-bottom: 0.25rem; }
    .section-subtitle { color: #a3a3a3; font-size: 0.8rem; margin-bottom: 1.5rem; }
    
    .category-group { margin-bottom: 2rem; }
    .category-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(34, 197, 94, 0.3); }
    .category-icon { font-size: 1.5rem; }
    .category-title { color: #22c55e; font-size: 1rem; font-weight: bold; letter-spacing: 1px; margin: 0; }
    
    .agents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(135px, 1fr)); gap: 1.5rem; }
    .agent-card { background: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px; padding: 1rem; text-align: center; cursor: pointer; transition: all 0.2s; }
    .agent-card:hover { transform: translateY(-2px); background: rgba(34, 197, 94, 0.1); border-color: #22c55e; }
    .agent-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
    .agent-name { color: white; font-weight: bold; display: block; margin-bottom: 0.25rem; font-size: 0.8rem; }
    .agent-desc { color: #a3a3a3; font-size: 0.7rem; }
    
    .quick-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
    .action-btn { background: #22c55e; color: black; border: none; border-radius: 8px; padding: 0.75rem 1.5rem; font-weight: bold; cursor: pointer; transition: all 0.2s; }
    .action-btn:hover { background: #16a34a; transform: scale(0.98); }
    .action-btn.health-btn { background: #118AB2; color: white; }
    .action-btn.secondary { background: #2a2a2a; color: #22c55e; border: 1px solid #22c55e; }
  `]
})
export class DashboardComponent implements OnInit {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  public app = inject(AppComponent);
  private profileService = inject(ProfileService);
  private oracleService = inject(OracleService);
  private router = inject(Router);

  // --- ESTADOS REACTIVOS (SIGNALS) ---
  profiles = computed(() => this.profileService.getProfiles());
  currentProfile = computed(() => this.profileService.getCurrentProfile());
  stats = computed(() => this.profileService.getStats());

  // --- CATEGORÍAS CON AGENTES ---
  categories = signal([
    {
      name: '📚 EDUCACIÓN Y CIENCIAS',
      icon: '📚',
      agents: [
        { key: 'math', icon: '🔢' },
        { key: 'lang', icon: '📖' },
        { key: 'code', icon: '💻' },
        { key: 'geo', icon: '🌍' },
        { key: 'physics', icon: '⚛️' },
        { key: 'chemistry', icon: '🧪' },
        { key: 'biology', icon: '🧬' }
      ]
    },
    {
      name: '🏥 SALUD Y BIENESTAR',
      icon: '🏥',
      agents: [
        { key: 'health', icon: '🏥' },
        { key: 'mental', icon: '🧠' },
        { key: 'nut', icon: '🍎' },
        { key: 'counselor', icon: '🫂' },
        { key: 'coach', icon: '💪' }
      ]
    },
    {
      name: '🎨 CULTURA Y HUMANIDADES',
      icon: '🎨',
      agents: [
        { key: 'art', icon: '🎨' },
        { key: 'hist', icon: '📜' },
        { key: 'cul', icon: '🗿' },
        { key: 'philosophy', icon: '🧠' },
        { key: 'theology', icon: '✝️' },
        { key: 'archaeology', icon: '🏺' }
      ]
    },
    {
      name: '💼 DESARROLLO PERSONAL',
      icon: '💼',
      agents: [
        { key: 'tutor', icon: '📚' },
        { key: 'mentor', icon: '🧭' },
        { key: 'finance', icon: '📈' },
        { key: 'rabbi', icon: '🕎' }
      ]
    },
    {
      name: '🍳 VIDA DIARIA',
      icon: '🍳',
      agents: [
        { key: 'chef', icon: '🍳' },
        { key: 'sport', icon: '⚽' },
        { key: 'news', icon: '📰' }
      ]
    },
    {
      name: '♿ ACCESIBILIDAD',
      icon: '♿',
      agents: [
        { key: 'asl', icon: '🤟' },
        { key: 'novelist', icon: '✍️' },
        { key: 'blind_guide', icon: '🦯' }
      ]
    }
  ]);

  // --- CICLO DE VIDA ---
  async ngOnInit() {
    await this.profileService.loadHistory();
    await this.profileService.loadStats();
  }

  // --- MÉTODOS DE NAVEGACIÓN Y PERFIL ---
  async selectProfile(profile: UserProfile) {
    await this.profileService.selectProfile(profile);
  }

  getAgentMode(key: string): string {
    const healthModes = ['health', 'mental', 'nut'];
    const newsModes = ['sport', 'news'];
    const historyModes = ['philosophy', 'theology', 'archaeology', 'history', 'culture'];
    const educationModes = ['coach', 'mentor', 'tutor', 'counselor', 'rabbi', 'education', 'coding', 'math', 'lang', 'code', 'geo', 'physics', 'chemistry', 'biology', 'art', 'hist', 'cul'];
    const aslModes = ['asl'];
    const narratorModes = ['novelist', 'narrator'];

    if (healthModes.includes(key)) return 'health';
    if (newsModes.includes(key)) return 'news';
    if (historyModes.includes(key)) return 'history';
    if (educationModes.includes(key)) return 'education';
    if (aslModes.includes(key)) return 'asl';
    if (narratorModes.includes(key)) return 'narrator';
    if (key === 'blind_guide') return 'blind_guide';
    
    return 'education';
  }

  goToPlayground(mode: string, agent: string) {
    const modeMapping: Record<string, string> = {
      'math': 'education', 'lang': 'education', 'code': 'coding',
      'geo': 'education', 'physics': 'education', 'chemistry': 'education',
      'biology': 'education', 'art': 'education', 'hist': 'history',
      'cul': 'culture', 'health': 'health', 'mental': 'mental_health',
      'nut': 'nutrition', 'sport': 'news', 'news': 'news',
      'asl': 'asl', 'novelist': 'narrator', 'blind_guide': 'blind_guide',
      'philosophy': 'history', 'theology': 'history', 'archaeology': 'history',
      'coach': 'education', 'mentor': 'education', 'tutor': 'education',
      'counselor': 'education', 'rabbi': 'education', 'chef': 'education',
      'finance': 'education'
    };

    const finalMode = modeMapping[agent] || mode;
    const lang = this.app.selectedLanguage();

    const activationPrompts: Record<string, string> = {
      es: `Hola OracleAI, actúa como mi experto en ${agent}.`,
      en: `Hello OracleAI, act as my expert in ${agent}.`,
      fr: `Bonjour OracleAI, agis en tant que mon expert en ${agent}`,
      pt: `Olá OracleAI, atue como meu especialista em ${agent}`
    };

    const prompt = agent ? (activationPrompts[lang] || activationPrompts['en']) : '';

    this.router.navigate(['/playground'], {
      queryParams: { mode: finalMode, agent: agent, prompt: prompt }
    });
  }

  goToHistory() {
    this.router.navigate(['/history']);
  }
}