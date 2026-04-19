// services/config.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GemmaModel, GEMMA_MODELS } from '../../../interfaces/models.interface';

@Injectable({ providedIn: 'root' })
export class ConfigService {
    private http = inject(HttpClient);
    private backendUrl = 'https://Denisijcu-oracle-hub-backend.hf.space/api/v1';

    // Modelo actual seleccionado
     currentModel = signal<GemmaModel>(
            (() => {
                const saved = localStorage.getItem('vic_active_model');
                if (saved) return JSON.parse(saved);
                return GEMMA_MODELS[0];
            })()  // ← El IIFE va DENTRO de signal, no afuera
        );

    // Endpoint actual (local o Kaggle)
    currentEndpoint = signal<string>(
        localStorage.getItem('vic_endpoint') || 'http://localhost:1234'
    );

    // Estado de conexión
    connectionStatus = signal<'checking' | 'connected' | 'error'>('checking');
    lastLatency = signal<number | null>(null);

    // Modelos disponibles
    availableModels = signal<GemmaModel[]>(GEMMA_MODELS);

    // Filtrar modelos por endpoint
    modelsByEndpoint = computed(() => {
        const endpoint = this.currentEndpoint();
        if (endpoint.includes('kaggle')) {
            return this.availableModels().filter(m => m.endpoint === 'kaggle' || m.endpoint === 'local');
        }
        return this.availableModels().filter(m => m.endpoint === 'local');
    });

    // Cambiar modelo
    async switchModel(model: GemmaModel): Promise<boolean> {
        try {
            // Notificar al backend el cambio de modelo
            const response = await firstValueFrom(
                this.http.post(`${this.backendUrl}/config/model`, {
                    model_id: model.id,
                    endpoint: this.currentEndpoint()
                })
            );

            this.currentModel.set(model);
            localStorage.setItem('vic_active_model', JSON.stringify(model));

            console.log(`✅ Modelo cambiado a: ${model.name}`);
            return true;
        } catch (error) {
            console.error('❌ Error cambiando modelo:', error);
            return false;
        }
    }

    // Cambiar endpoint (local vs Kaggle)
    async switchEndpoint(endpoint: string, apiKey?: string): Promise<boolean> {
        try {
            // Probar conexión al nuevo endpoint
            const isReachable = await this.testConnection(endpoint);

            if (!isReachable && endpoint !== 'http://localhost:1234') {
                console.warn('⚠️ Endpoint no alcanzable');
                return false;
            }

            this.currentEndpoint.set(endpoint);
            localStorage.setItem('vic_endpoint', endpoint);

            if (apiKey) {
                localStorage.setItem('kaggle_api_key', apiKey);
            }

            // Notificar al backend
            await firstValueFrom(
                this.http.post(`${this.backendUrl}/config/endpoint`, {
                    endpoint: endpoint,
                    api_key: apiKey
                })
            );

            console.log(`✅ Endpoint cambiado a: ${endpoint}`);
            return true;
        } catch (error) {
            console.error('❌ Error cambiando endpoint:', error);
            return false;
        }
    }

    // Probar conexión a un endpoint
    async testConnection(endpoint: string): Promise<boolean> {
        this.connectionStatus.set('checking');
        const startTime = Date.now();

        try {
            const response = await firstValueFrom(
                this.http.get(`${endpoint}/v1/models`, { timeout: 5000 })
            );

            const latency = Date.now() - startTime;
            this.lastLatency.set(latency);
            this.connectionStatus.set('connected');

            return true;
        } catch (error) {
            this.connectionStatus.set('error');
            this.lastLatency.set(null);
            return false;
        }
    }

    // Obtener recomendación de modelo según hardware
    async getRecommendedModel(): Promise<GemmaModel> {
        try {
            const systemMetrics = await firstValueFrom(
                this.http.get<any>('https://Denisijcu-oracle-hub-backend.hf.space/api/sentinel/metrics')
            );

            const freeRAM = systemMetrics.data.memory.available;
            const freeRAM_GB = freeRAM / (1024 ** 3);

            if (freeRAM_GB > 12) return GEMMA_MODELS.find(m => m.id === 'gemma-4-9b-it')!;
            if (freeRAM_GB > 6) return GEMMA_MODELS.find(m => m.id === 'gemma-4-4b-it')!;
            if (freeRAM_GB > 3) return GEMMA_MODELS.find(m => m.id === 'gemma-4-2b-it')!;
            return GEMMA_MODELS.find(m => m.id === 'gemma-3n-e2b-it')!;
        } catch {
            return GEMMA_MODELS[0];
        }
    }
}
