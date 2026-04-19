import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Feature {
  icon: string;
  title: string;
  desc: string;
  tag?: string;
}

@Component({
  selector: 'app-user-guide',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-guide.component.html',
  styleUrls: ['./user-guide.component.css']
})
export class UserGuideComponent {
  // --- 📦 DATA CORE ---
  private readonly featuresData = signal<Record<string, Feature[]>>({
    'Accesibilidad': [
      { icon: '🦯', title: 'Guía de Ciegos', desc: 'Navegación espacial con radar de obstáculos en tiempo real.' },
      { icon: '🤟', title: 'Intérprete ASL', desc: 'Traducción de lenguaje de señas a voz (American Sign Language).' }
    ],
    'Vigilancia Sentinel': [
      { icon: '🚨', title: 'Detector de Caídas', desc: 'Telemetría humana avanzada para detectar accidentes usando MediaPipe.', tag: 'BETA' },
      { icon: '🛡️', title: 'Análisis de Amenazas', desc: 'Detección de intrusos, armas y situaciones de peligro crítico.' },
      { icon: '👁️', title: 'Visión Sostenida', desc: 'Stream de video con descripción táctica continua de baja latencia.' }
    ],
    'Análisis de Datos': [
      { icon: '📊', title: 'Data Oracle (Pandas)', desc: 'Análisis estadístico y generación de gráficas a partir de archivos CSV.' },
      { icon: '📄', title: 'Document Intelligence', desc: 'Extracción de contexto en PDF, Word, JSON y archivos de texto.' }
    ],
    'Multimedia & News': [
      { icon: '🎙️', title: 'Audio Transcriber', desc: 'Conversión de archivos de audio a texto con limpieza de ruido.' },
      { icon: '📰', title: 'Radar de Noticias', desc: 'Extracción táctica de actualidad mundial vía RSS por palabras clave.' }
    ]
  });

  // --- 🛰️ REACTIVE SIGNALS ---
  public categories = computed(() => Object.keys(this.featuresData()));
  public searchQuery = signal<string>('');

  // --- 🛠️ METHODS ---
  getFeatures(category: string): Feature[] {
    const query = this.searchQuery().toLowerCase();
    const allFeatures = this.featuresData()[category] || [];
    
    if (!query) return allFeatures;

    return allFeatures.filter(f => 
      f.title.toLowerCase().includes(query) || 
      f.desc.toLowerCase().includes(query)
    );
  }

  updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  


  // Agrega esto a tu UserGuideComponent
public isTestingSentinel = signal(false);

testSentinelAlert(): void {
  if (this.isTestingSentinel()) return;

  this.isTestingSentinel.set(true);
  console.log("🚨 [SENTINEL_SIM] Iniciando simulación de caída...");

  // Simulamos la latencia de la Raspberry Pi 5
  setTimeout(() => {
    // Aquí dispararías la alerta visual en el Dashboard
    const audio = new Audio('assets/alarm.mp3');
    audio.play().catch(e => console.warn("Audio bloqueado por el navegador"));
    
    alert("🚨 [SIMULACIÓN SENTINEL]: ¡Caída detectada en Sector Alpha!");
    
    this.isTestingSentinel.set(false);
    console.log("✅ [SENTINEL_SIM] Test finalizado.");
  }, 2000);
}
  
}