import { Injectable, signal, computed } from '@angular/core';

export type SupportedLanguages = 'es' | 'en' | 'fr' | 'pt' | 'it' | 'zh' | 'ko' | 'hi' | 'ru' | 'hu' | 'de';

@Injectable({ providedIn: 'root' })
export class TranslocoService {
  // Idioma por defecto
  currentLang = signal<SupportedLanguages>('es');

  // Diccionario de la UI (Vertex Standard)
  private dictionary: any = {
    es: {
      VERDICT: 'VEREDICTO',
      LIVE_VISION: 'VISIÓN ACTIVA',
      STOP: 'DETENER',
      LISTEN: 'ESCUCHAR',
      PROMPT_PLACEHOLDER: 'Habla con OracleAI...',
    },
    en: {
      VERDICT: 'VERDICT',
      LIVE_VISION: 'LIVE VISION',
      STOP: 'STOP',
      LISTEN: 'LISTEN',
      PROMPT_PLACEHOLDER: 'Talk to OracleAI...',
    },
    // Añadimos más según necesites
  };

  // Signal computada para obtener las etiquetas actuales
  t = computed(() => this.dictionary[this.currentLang()]);

  setLanguage(lang: SupportedLanguages) {
    this.currentLang.set(lang);
    localStorage.setItem('oracle_pref_lang', lang);
  }
}