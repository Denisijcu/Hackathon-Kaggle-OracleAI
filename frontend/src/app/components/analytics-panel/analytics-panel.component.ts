import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppComponent } from '../../app'; // ✅ FIX: Ruta correcta al componente principal
import { ProfileService } from '../../core/services/profile.service'; 

@Component({
  selector: 'app-analytics-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-panel.component.html',
  styles: [`
    /* 🛡️ Evitamos @apply aquí para no chocar con el compilador de Tailwind en runtime */
    .panel-card {
      background-color: rgba(0, 0, 0, 0.7);
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 0.75rem;
      padding: 1rem;
      backdrop-filter: blur(12px);
      transition: all 0.5s ease;
    }
    .panel-card:hover {
      border-color: rgba(34, 197, 94, 0.5);
    }
    .stat-label {
      font-size: 10px;
      color: rgba(34, 197, 94, 0.7);
      font-weight: 900;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }
    .glow-bar {
      height: 100%;
      transition: all 1s ease-out;
    }
  `]
})
export class AnalyticsPanelComponent implements OnInit {
  // Inyectamos el componente raíz para tener los Signals de idioma
  public app = inject(AppComponent);
  private profile = inject(ProfileService);
  private profileService = inject(ProfileService);

  public sportsScores = this.profileService.sportsScores;

  // 🛰️ Signals reactivos para la data real
  //public totalEdu = computed(() => this.profile.getHistory().filter(h => h.type === 'education').length);
  //public totalHealth = computed(() => this.profile.getHistory().filter(h => h.type === 'health').length);
  
  // FIX: Verificamos si existe la propiedad filetype o filename en tu interfaz de HistoryItem
  //public totalDocs = computed(() => this.profile.getHistory().filter(h => h.filename).length);

  // 📡 Mapeamos los Signals del servicio a variables locales para el HTML
  public totalEdu = computed(() => this.profileService.globalStats().edu);
  public totalHealth = computed(() => this.profileService.globalStats().health);
  public totalDocs = computed(() => this.profileService.globalStats().docs);

  ngOnInit() {
    console.log('📊 VIC Analytics Engine: Online');
    // Carga inicial al prender la consola
    this.profileService.fetchGlobalStats();

    // 🕒 POLLING TÁCTICO: Refresca cada 10 segundos por si hay otros usuarios
    setInterval(() => {
      this.profileService.fetchGlobalStats();
    }, 10000)

    this.profileService.fetchSports(); // Carga inicial
    
    // Polling de 5 minutos (300,000 ms) para mantener la Pi 5 fresca
    setInterval(() => {
      this.profileService.fetchSports();
    }, 300000);
  }
}