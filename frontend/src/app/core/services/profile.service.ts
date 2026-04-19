import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// ─── INTERFACES Y TIPOS ──────────────────────────────────────────────────────
//type: 'education' | 'health' | 'coding' | 'mental_health' | 'nutrition' | 'community';
export interface HistoryItem {
    id: string;
    type: string;
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

export interface GlobalStats {
    edu: number;
    health: number;
    docs: number;
    total: number;
}

export type Permission =
    | 'mode_coding'
    | 'mode_nutrition'
    | 'mode_mental_health'
    | 'mode_history'
    | 'mode_culture'
    | 'upload_pdf'
    | 'upload_video'
    | 'upload_csv'
    | 'upload_json'
    | 'live_vision'
    | 'video_url'
    | 'view_history'
    | 'change_language'
    | 'clear_all';

// ─── CONFIGURACIÓN DE ROLES (HARDENING) ──────────────────────────────────────

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    child: [],
    elder: ['mode_mental_health'],
    parent: [
        'mode_coding', 'mode_nutrition', 'mode_mental_health',
        'mode_history', 'mode_culture', 'upload_pdf', 'upload_video',
        'upload_csv', 'upload_json', 'video_url', 'view_history',
        'change_language', 'clear_all',
         'live_vision',
    ],
    aunt: [
        'mode_coding', 'mode_nutrition', 'mode_mental_health',
        'mode_history', 'mode_culture', 'upload_pdf', 'upload_video',
        'upload_csv', 'upload_json', 'video_url', 'view_history',
        'change_language', 'clear_all',
    ],
    caregiver: [
        'mode_coding', 'mode_nutrition', 'mode_mental_health',
        'mode_history', 'mode_culture', 'upload_pdf', 'upload_video',
        'upload_csv', 'upload_json', 'live_vision', 'video_url',
        'view_history', 'change_language', 'clear_all',
         'live_vision',
    ],

};

const ROLE_META: Record<string, { label: string; color: string; icon: string }> = {
    child: { label: 'Básico', color: '#FF9F1C', icon: '⭐' },
    elder: { label: 'Básico+', color: '#7C9E7C', icon: '⭐' },
    parent: { label: 'Estándar', color: '#118AB2', icon: '⭐⭐' },
    aunt: { label: 'Estándar', color: '#9C27B0', icon: '⭐⭐' },
    caregiver: { label: 'Completo', color: '#22c55e', icon: '⭐⭐⭐' },
};

// ─── SERVICIO ────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ProfileService {
    private http = inject(HttpClient);
    private apiUrl = 'https://Denisijcu-oracle-hub-backend.hf.space/api/v1';

    // Signals de Estado
    private profiles = signal<UserProfile[]>([
        { id: '1', name: 'Mateo', role: 'child', avatar: '👦', color: '#FF9F1C' },
        { id: '4', name: 'Elena', role: 'child', avatar: '👧', color: '#E91E63' },
        { id: '2', name: 'Abuela', role: 'elder', avatar: '👵', color: '#7C9E7C' },
        { id: '5', name: 'Abuelo', role: 'elder', avatar: '👴', color: '#8D6E63' },
        { id: '3', name: 'Papá', role: 'parent', avatar: '👨', color: '#118AB2' },
        { id: '6', name: 'Tía', role: 'aunt', avatar: '👩🏾', color: '#9C27B0' },
    ]);

    private currentProfile = signal<UserProfile | null>(null);
    private history = signal<HistoryItem[]>([]);

    public globalStats = signal<GlobalStats>({ edu: 0, health: 0, docs: 0, total: 0 });
    public sportsScores = signal<string[]>([]);

    constructor() {
        this.initProfile();
    }

    private async initProfile() {
        const savedId = localStorage.getItem('oracleai_current_profile_id');
        const found = this.profiles().find(p => p.id === savedId);

        if (found) {
            this.currentProfile.set(found);
        } else {
            const defaultP = this.profiles()[0];
            this.currentProfile.set(defaultP);
            localStorage.setItem('oracleai_current_profile_id', defaultP.id);
        }
        await this.loadHistory();
    }

    // ── MÉTODOS DE PERFIL ──────────────────────────────────────────────────────

    async selectProfile(profile: UserProfile) {
        this.currentProfile.set(profile);
        localStorage.setItem('oracleai_current_profile_id', profile.id);
        await this.loadHistory();
    }

    getCurrentProfile() { return this.currentProfile(); }
    getProfiles() { return this.profiles(); }

    // ── MÉTODOS DE PERMISOS (PARCHE APLICADO) ───────────────────────────────────

    hasPermission(permission: Permission): boolean {
        const role = this.currentProfile()?.role;
        if (!role) return false;
        return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
    }

    getRoleMeta() {
        const role = this.currentProfile()?.role ?? 'child';
        return ROLE_META[role];
    }

    // ── HISTORIAL Y PERSISTENCIA ────────────────────────────────────────────────

    async loadHistory(): Promise<void> {
        const profile = this.currentProfile();
        if (!profile) return;

        try {
            const url = `${this.apiUrl}/history/${profile.id}?limit=50`;
            const response = await firstValueFrom(this.http.get<{ history: any[] }>(url));
            const data = response?.history || [];

            this.history.set(data.map(item => ({
                id: String(item.id),
                type: item.type || 'education',
                prompt: item.prompt || '',
                response: item.response || '',
                date: item.created_at ? new Date(item.created_at) : new Date(),
                filetype: item.file_type,
                filename: item.file_name
            })));
        } catch (error) {
            console.error('❌ Error History:', error);
            this.history.set([]);
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

    async addToHistory(item: Omit<HistoryItem, 'id' | 'date'>) {
        const profile = this.currentProfile();
        if (!profile) return;

        const body = {
            profile_id: profile.id,
            type: item.type || (profile.role === 'child' ? 'education' : 'health'),
            prompt: item.prompt,
            response: item.response,
            file_type: item.filetype || null,
            file_name: item.filename || null
        };

        try {
            await firstValueFrom(this.http.post(`${this.apiUrl}/history/save`, body));
            await this.loadHistory();
        } catch (e) {
            console.error('❌ Sync Error:', e);
        }
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

    // ── ANALYTICS & EXTERNAL ───────────────────────────────────────────────────

    async fetchGlobalStats() {
        try {
            const data = await firstValueFrom(this.http.get<GlobalStats>(`${this.apiUrl}/analytics/stats`));
            this.globalStats.set(data);
        } catch (e) { console.error('❌ Stats Error', e); }
    }

    async fetchSports() {
        try {
            const res = await firstValueFrom(this.http.get<any>(`${this.apiUrl}/sports/ticker`));
            this.sportsScores.set(res.scores);
        } catch (e) {
            this.sportsScores.set(["SINCRONIZACIÓN OFFLINE"]);
        }
    }
}