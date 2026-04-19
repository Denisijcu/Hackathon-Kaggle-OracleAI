import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface HistoryItem {
    id: string;
    type: 'education' | 'health' | 'coding' | 'mental_health' | 'nutrition' | 'community';
    prompt: string;
    response: string;
    date: Date;
    filetype?: string;
    filename?: string;
}

export interface UserProfile {
    id: string;
    name: string;
    role: 'child' | 'elder' | 'caregiver' | 'parent' | 'aunt';
    avatar: string;
    color: string;
}

// 1. Definimos la interfaz para que TypeScript no se queje
export interface GlobalStats {
  edu: number;
  health: number;
  docs: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/api/v1';

    // Perfiles disponibles
    private profiles = signal<UserProfile[]>([
    { id: '1', name: 'Mateo', role: 'child', avatar: '👦', color: '#FF9F1C' },
    { id: '4', name: 'Elena', role: 'child', avatar: '👧', color: '#E91E63' }, // 🆕 Nueva
    { id: '2', name: 'Abuela', role: 'elder', avatar: '👵', color: '#7C9E7C' },
    { id: '5', name: 'Abuelo', role: 'elder', avatar: '👴', color: '#8D6E63' }, // 🆕 Nuevo
    { id: '3', name: 'Papá', role: 'parent', avatar: '👨', color: '#118AB2' },
    { id: '6', name: 'Tía', role: 'aunt', avatar: '👩🏾', color: '#9C27B0' } // 🆕 Nueva
]);

    // Perfil actual
    private currentProfile = signal<UserProfile | null>(null);

    // Historial de conversaciones
    private history = signal<HistoryItem[]>([]);


    public globalStats = signal<GlobalStats>({ edu: 0, health: 0, docs: 0, total: 0 });


    public sportsScores = signal<string[]>([]); // 🛰️ El Signal de deportes

    constructor() {
        // Inicializar sin esperar para no bloquear
        this.initProfile();
    }

    private async initProfile() {
        const savedProfileId = localStorage.getItem('oracleai_current_profile_id');

        if (savedProfileId) {
            const profile = this.profiles().find(p => p.id === savedProfileId);
            if (profile) {
                this.currentProfile.set(profile);
                await this.loadHistory();
                return;
            } else {
                localStorage.removeItem('oracleai_current_profile_id'); // 🧹 Limpieza si el ID es basura
            }
        }

        // Si no hay perfil guardado, seleccionar el primero (Mateo)
        if (this.profiles().length > 0) {
            const defaultProfile = this.profiles()[0];
            this.currentProfile.set(defaultProfile);
            localStorage.setItem('oracleai_current_profile_id', defaultProfile.id);
            await this.loadHistory();
        }
    }



    // Seleccionar perfil
    async selectProfile(profile: UserProfile) {
        console.log('👤 Seleccionando perfil:', profile);
        this.currentProfile.set(profile);
        localStorage.setItem('oracleai_current_profile_id', profile.id);
        await this.loadHistory();
    }

    getCurrentProfile() {
        return this.currentProfile();
    }

    getProfiles() {
        console.log('👥 Perfiles disponibles:', this.profiles());
        return this.profiles();
    }

    // ============================================
    // HISTORIAL
    // ============================================

    async loadHistory(): Promise<void> {
        const profile = this.currentProfile();

        if (!profile) {
            console.warn('⚠️ No hay perfil seleccionado');
            this.history.set([]);
            return;
        }

        try {
            // ✅ URL CORREGIDA: se usa query param con ?
            const url = `${this.apiUrl}/history/${profile.id}?limit=50`;
            console.log(`📡 GET ${url}`);

            const response = await firstValueFrom(
                this.http.get<{ history: any[] }>(url)
            );

            // Asegurarse de que response.history existe y es un array
            const historyData = response?.history || [];
            console.log(`✅ Recibidos ${historyData.length} items del backend`);

            const historyItems: HistoryItem[] = historyData.map((item: any) => ({
                id: String(item.id),
                type: item.type || 'education',
                prompt: item.prompt || '',
                response: item.response || '',
                date: item.created_at ? new Date(item.created_at) : new Date(),
                fileType: item.file_type,
                fileName: item.file_name
            }));

            this.history.set(historyItems);
            console.log(`📜 Historial cargado: ${historyItems.length} items`);

        } catch (error) {
            console.error('❌ Error cargando historial:', error);
            this.history.set([]);
        }
    }

    // En ProfileService
    // En ProfileService.ts

    async addToHistory(item: Omit<HistoryItem, 'id' | 'date'>) {
        const profile = this.currentProfile();

        if (!profile) {
            console.error('❌ Fallo crítico: No hay perfil activo para guardar historial');
            return;
        }

        // EL CONTRATO: Estos nombres deben ser IDÉNTICOS a los de tu clase HistoryEntry en Python
        const body = {
            profile_id: profile.id,
            type: profile.role === 'child' ? 'education' : 'health', // O usa item.type si lo pasas dinámico
            prompt: item.prompt,
            response: item.response,
            file_type: item.filetype || null, // Mapeamos CamelCase (TS) a snake_case (Py)
            file_name: item.filename || null  // Mapeamos CamelCase (TS) a snake_case (Py)
        };

        try {
            console.log('📡 Guardando en SQLite:', body);
            await firstValueFrom(this.http.post(`${this.apiUrl}/history/save`, body));

            // Recargar el historial para que los Signals actualicen la UI
            await this.loadHistory();
        } catch (error) {
            console.error('❌ Error al persistir en el Backend:', error);
        }
    }

    async clearHistory() {
        const profile = this.currentProfile();
        if (!profile) return;

        try {
            await firstValueFrom(
                this.http.delete(`${this.apiUrl}/history/${profile.id}`)
            );
            this.history.set([]);
            console.log('✅ Historial limpiado');
        } catch (error) {
            console.error('❌ Error limpiando historial:', error);
        }
    }

    getHistory() {
        return this.history();
    }

    // ============================================
    // ESTADÍSTICAS
    // ============================================

    async loadStats() {
        const profile = this.currentProfile();
        if (!profile) return null;

        try {
            const response = await firstValueFrom(
                this.http.get<any>(`${this.apiUrl}/stats/${profile.id}`)
            );
            console.log('📊 Estadísticas:', response);
            return response;
        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
            return null;
        }
    }

    getStats() {
        const history = this.history();
        return {
            educationQueries: history.filter(h => h.type === 'education').length,
            healthQueries: history.filter(h => h.type === 'health').length,
            documentsProcessed: history.filter(h => h.filetype).length,
            avgResponseTime: 2.3,
            totalQueries: history.length
        };
    }

    // Función para refrescar los datos desde la DB
  async fetchGlobalStats() {
    try {
      const data = await firstValueFrom(
        this.http.get<GlobalStats>(`${this.apiUrl}/analytics/stats`)
      );
      this.globalStats.set(data);
      console.log('📊 Stats sincronizados con oracleai.db:', data);
    } catch (error) {
      console.error('❌ Error vinculando con el motor de analíticas:', error);
    }
  }


  async fetchSports() {
  try {
    const res = await firstValueFrom(
      this.http.get<any>(`${this.apiUrl}/sports/ticker`)
    );
    this.sportsScores.set(res.scores);
  } catch (e) {
    this.sportsScores.set(["SINCRONIZACIÓN OFFLINE"]);
  }
}





}