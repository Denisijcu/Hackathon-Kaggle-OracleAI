import { Component, signal, computed, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppComponent } from '../../app';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { OracleService } from '../../core/services/oracle.service';

interface SystemMetrics {
    cpu: { percent: number; cores: number; frequency: number | null };
    memory: { percent: number; total: number; available: number; used: number };
    disk: { percent: number; total: number; used: number; free: number };
    system: { hostname: string; os: string; os_version: string; architecture: string };
    timestamp: string;
}

interface SentinelLog {
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
}

interface SentinelAlert {
    severity: 'low' | 'medium' | 'high';
    message: string;
}



@Component({
    selector: 'app-sentinel',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './sentinel.component.html',
    styleUrls: ['./sentinel.component.css']
})
export class SentinelComponent implements OnInit, OnDestroy {

  

    private app = inject(AppComponent);
    private http = inject(HttpClient);

    private oracle = inject(OracleService);

    // ─── CONFIGURACIÓN API ────────────────────────────────────
    private apiBaseUrl = 'https://Denisijcu-oracle-hub-backend.hf.space/api/sentinel';
    private pingUrl = 'https://Denisijcu-oracle-hub-backend.hf.space/api/sentinel/ping';

    // ─── IDIOMAS ─────────────────────────────────────────────
    selectedLanguage = this.app.selectedLanguage;

    // ─── ESTADO DEL SISTEMA ──────────────────────────────────
    systemStatus = signal<'online' | 'degraded' | 'offline'>('online');
    lastPing = signal<Date | null>(null);
    uptimeSeconds = signal<number>(0);
    private uptimeInterval: any = null;
    private metricsInterval: any = null;
    private pingInterval: any = null;


    private lastAlertState = {
        cpu: false,
        memory: false,
        disk: false
    };
    // ─── MÉTRICAS REALES ─────────────────────────────────────
    cpuUsage = signal<number>(0);
    memoryUsage = signal<number>(0);
    diskUsage = signal<number>(0);
    activeConnections = signal<number>(0);
    totalRequests = signal<number>(1247);
    avgResponseTime = signal<number>(187);

    // ─── LOGS Y ALERTAS REALES ───────────────────────────────
    sentinelLogs = signal<Array<{ timestamp: Date, level: 'info' | 'warning' | 'error', message: string }>>([]);
    activeAlerts = signal<Array<{ id: number, severity: 'low' | 'medium' | 'high', message: string, timestamp: Date }>>([]);

    // ─── TRADUCCIONES (igual que antes, no cambia) ───────────
    private translations: Record<string, any> = {
        // ... tus traducciones existentes ...
        es: { title: '🚨 CENTINELA VIC', subtitle: 'Monitoreo de Salud del Sistema | Vertex Intelligence Core', status: 'ESTADO DEL SISTEMA', online: 'ONLINE', degraded: 'DEGRADADO', offline: 'OFFLINE', onlineMsg: 'Todos los sistemas operan normalmente', degradedMsg: 'Algunos servicios presentan latencia', offlineMsg: 'Conexión perdida con el núcleo', lastPing: 'Último ping', uptime: 'Tiempo activo', metrics: 'MÉTRICAS EN VIVO', cpu: 'CPU', memory: 'MEMORIA', disk: 'DISCO', connections: 'CONEXIONES', requests: 'PETICIONES', responseTime: 'RESPUESTA (ms)', logs: '📋 LOGS DEL SENTINELA', alerts: '⚠️ ALERTAS ACTIVAS', clearAlerts: 'LIMPIAR ALERTAS', refresh: 'REFRESCAR', scan: 'ESCANEAR SISTEMA', noAlerts: 'No hay alertas activas', noLogs: 'No hay logs registrados', simulated: '[SIMULADO]' },
        en: { title: '🚨 VIC SENTINEL', subtitle: 'System Health Monitoring | Vertex Intelligence Core', status: 'SYSTEM STATUS', online: 'ONLINE', degraded: 'DEGRADED', offline: 'OFFLINE', onlineMsg: 'All systems operating normally', degradedMsg: 'Some services experiencing latency', offlineMsg: 'Connection lost to core', lastPing: 'Last ping', uptime: 'Uptime', metrics: 'LIVE METRICS', cpu: 'CPU', memory: 'MEMORY', disk: 'DISK', connections: 'CONNECTIONS', requests: 'REQUESTS', responseTime: 'RESPONSE (ms)', logs: '📋 SENTINEL LOGS', alerts: '⚠️ ACTIVE ALERTS', clearAlerts: 'CLEAR ALERTS', refresh: 'REFRESH', scan: 'SCAN SYSTEM', noAlerts: 'No active alerts', noLogs: 'No logs recorded', simulated: '[SIMULATED]' },
        fr: { title: '🚨 SENTINELLE VIC', subtitle: 'Surveillance de Santé Système | Vertex Intelligence Core', status: 'ÉTAT DU SYSTÈME', online: 'EN LIGNE', degraded: 'DÉGRADÉ', offline: 'HORS LIGNE', onlineMsg: 'Tous les systèmes fonctionnent normalement', degradedMsg: 'Certains services présentent une latence', offlineMsg: 'Connexion perdue avec le noyau', lastPing: 'Dernier ping', uptime: 'Temps de fonctionnement', metrics: 'MÉTRIQUES EN DIRECT', cpu: 'CPU', memory: 'MÉMOIRE', disk: 'DISQUE', connections: 'CONNEXIONS', requests: 'REQUÊTES', responseTime: 'RÉPONSE (ms)', logs: '📋 JOURNAUX SENTINELLE', alerts: '⚠️ ALERTES ACTIVES', clearAlerts: 'EFFACER ALERTES', refresh: 'RAFRÎCHIR', scan: 'ANALYSER SYSTÈME', noAlerts: 'Aucune alerte active', noLogs: 'Aucun journal enregistré', simulated: '[SIMULÉ]' },
        pt: { title: '🚨 SENTINELA VIC', subtitle: 'Monitoramento de Saúde do Sistema | Vertex Intelligence Core', status: 'ESTADO DO SISTEMA', online: 'ONLINE', degraded: 'DEGRADADO', offline: 'OFFLINE', onlineMsg: 'Todos os sistemas operam normalmente', degradedMsg: 'Alguns serviços apresentam latência', offlineMsg: 'Conexão perdida com o núcleo', lastPing: 'Último ping', uptime: 'Tempo ativo', metrics: 'MÉTRICAS AO VIVO', cpu: 'CPU', memory: 'MEMÓRIA', disk: 'DISCO', connections: 'CONEXÕES', requests: 'REQUISIÇÕES', responseTime: 'RESPOSTA (ms)', logs: '📋 LOGS DO SENTINELA', alerts: '⚠️ ALERTAS ATIVAS', clearAlerts: 'LIMPAR ALERTAS', refresh: 'ATUALIZAR', scan: 'VERIFICAR SISTEMA', noAlerts: 'Sem alertas ativas', noLogs: 'Sem logs registrados', simulated: '[SIMULADO]' },
        it: { title: '🚨 SENTINELLA VIC', subtitle: 'Monitoraggio Salute Sistema | Vertex Intelligence Core', status: 'STATO DEL SISTEMA', online: 'ONLINE', degraded: 'DEGRADATO', offline: 'OFFLINE', onlineMsg: 'Tutti i sistemi operano normalmente', degradedMsg: 'Alcuni servizi presentano latenza', offlineMsg: 'Connessione persa con il nucleo', lastPing: 'Ultimo ping', uptime: 'Tempo attivo', metrics: 'METRICHE IN DIRETTA', cpu: 'CPU', memory: 'MEMORIA', disk: 'DISCO', connections: 'CONNESSIONI', requests: 'RICHIESTE', responseTime: 'RISPOSTA (ms)', logs: '📋 LOG DELLA SENTINELLA', alerts: '⚠️ ALLERTE ATTIVE', clearAlerts: 'CANCELLA ALLERTE', refresh: 'AGGIORNA', scan: 'SCANSIONA SISTEMA', noAlerts: 'Nessuna allerta attiva', noLogs: 'Nessun log registrato', simulated: '[SIMULATO]' },
        ru: { title: '🚨 СТРАЖ VIC', subtitle: 'Мониторинг здоровья системы | Vertex Intelligence Core', status: 'СТАТУС СИСТЕМЫ', online: 'ОНЛАЙН', degraded: 'ДЕГРАДИРОВАН', offline: 'ОФФЛАЙН', onlineMsg: 'Все системы работают нормально', degradedMsg: 'Некоторые услуги испытывают задержку', offlineMsg: 'Потеряно соединение с ядром', lastPing: 'Последний пинг', uptime: 'Время работы', metrics: 'ЖИВЫЕ МЕТРИКИ', cpu: 'ЦП', memory: 'ПАМЯТЬ', disk: 'ДИСК', connections: 'СОЕДИНЕНИЯ', requests: 'ЗАПРОСЫ', responseTime: 'ОТВЕТ (мс)', logs: '📋 ЖУРНАЛЫ СТРАЖА', alerts: '⚠️ АКТИВНЫЕ ОПОВЕЩЕНИЯ', clearAlerts: 'ОЧИСТИТЬ ОПОВЕЩЕНИЯ', refresh: 'ОБНОВИТЬ', scan: 'ПРОВЕРИТЬ СИСТЕМУ', noAlerts: 'Нет активных оповещений', noLogs: 'Нет зарегистрированных журналов', simulated: '[СИМУЛИРОВАН]' },
        hu: { title: '🚨 VIC ŐRSZEM', subtitle: 'Rendszer Egészségfigyelés | Vertex Intelligence Core', status: 'RENDSZER ÁLLAPOT', online: 'ELÉRHETŐ', degraded: 'ROMLOTT', offline: 'NEM ELÉRHETŐ', onlineMsg: 'Minden rendszer normálisan működik', degradedMsg: 'Néhány szolgáltatás késleltetést tapasztal', offlineMsg: 'Kapcsolat megszakadt a maggal', lastPing: 'Utolsó ping', uptime: 'Üzemidő', metrics: 'ÉLŐ METRIKÁK', cpu: 'CPU', memory: 'MEMÓRIA', disk: 'LEMEZ', connections: 'KAPCSOLATOK', requests: 'KÉRÉSEK', responseTime: 'VÁLASZIDŐ (ms)', logs: '📋 ŐRSZEM NAPLÓK', alerts: '⚠️ AKTÍV RIASZTÁSOK', clearAlerts: 'RIASZTÁSOK TÖRLÉSE', refresh: 'FRISSÍTÉS', scan: 'RENDSZER VIZSGÁLAT', noAlerts: 'Nincs aktív riasztás', noLogs: 'Nincs naplóbejegyzés', simulated: '[SZIMULÁLT]' }
    };

    t = computed(() => {
        const lang = this.selectedLanguage();
        return this.translations[lang] || this.translations['en'];
    });




    // ─── MÉTRICAS FORMATEADAS ─────────────────────────────────
    cpuPercent = computed(() => `${this.cpuUsage()}%`);
    memoryPercent = computed(() => `${this.memoryUsage()}%`);
    diskPercent = computed(() => `${this.diskUsage()}%`);

    getCpuColor(): string {
        const val = this.cpuUsage();
        if (val < 50) return '#00ff88';
        if (val < 75) return '#ffaa00';
        return '#ff4444';
    }

    getMemoryColor(): string {
        const val = this.memoryUsage();
        if (val < 60) return '#00ff88';
        if (val < 85) return '#ffaa00';
        return '#ff4444';
    }

    getDiskColor(): string {
        const val = this.diskUsage();
        if (val < 70) return '#00ff88';
        if (val < 85) return '#ffaa00';
        return '#ff4444';
    }

    formatUptime(): string {
        const seconds = this.uptimeSeconds();
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }



    constructor() {
        effect(() => {
            const lastResponse = this.oracle.lastResponse();
            // Accedemos a la data de Sentinel que inyectamos en el backend de Python
            const sentinelData = (lastResponse as any)?.sentinel_analysis;

            if (sentinelData?.threat_detected) {
                this.addAlert('high', `🚨 INTRUSION DETECTED: ${lastResponse?.choices[0].message.content}`);
                this.triggerRedProtocol(); // Función para el flash visual
            }
        });

    }

    // ─── API: OBTENER MÉTRICAS REALES ─────────────────────────
    async fetchRealMetrics(): Promise<void> {
        try {
            const response = await firstValueFrom(
                this.http.get<{ status: string; data: SystemMetrics }>(`${this.apiBaseUrl}/metrics`).pipe(timeout(10000))
            );

            if (response.status === 'success' && response.data) {
                this.cpuUsage.set(response.data.cpu.percent);
                this.memoryUsage.set(response.data.memory.percent);
                this.diskUsage.set(response.data.disk.percent);

                // Actualizar uptime (si el backend lo provee, sino usar el nuestro)
                // this.uptimeSeconds.set(calcular desde system.uptime)

                this.addLog('info', `Metrics updated: CPU ${response.data.cpu.percent}% | RAM ${response.data.memory.percent}% | DISK ${response.data.disk.percent}%`);

                // Verificar umbrales para alertas automáticas
                this.checkThresholds(response.data);
            }
        } catch (error) {
            console.error('❌ Error fetching metrics:', error);
            this.addLog('error', 'Failed to fetch system metrics from backend');
            this.systemStatus.set('degraded');
        }
    }


    // ─── API: PING REAL AL BACKEND ────────────────────────────
    async pingBackend() {
        this.addLog('info', 'Pinging VIC Core...');
        const startTime = Date.now();

        try {
            const response = await firstValueFrom(
                this.http.get<{ pong: boolean; timestamp: string }>(this.pingUrl).pipe(timeout(5000))
            );

            const latency = Date.now() - startTime;
            this.lastPing.set(new Date());
            this.avgResponseTime.set(latency);

            if (response.pong) {
                this.systemStatus.set('online');
                this.addLog('info', `VIC Core responded successfully (${latency}ms)`);
            }
        } catch (error) {
            this.systemStatus.set('offline');
            this.addLog('error', 'VIC Core unreachable - Connection timeout');
            this.addAlert('high', 'VIC Core connection lost');
        }
    }

    // ─── API: OBTENER LOGS REALES ─────────────────────────────
    async fetchRealLogs(): Promise<void> {
        try {
            const response = await firstValueFrom(
                this.http.get<{ logs: Array<{ timestamp: string; level: string; message: string }> }>(`${this.apiBaseUrl}/logs?limit=20`).pipe(timeout(5000))
            );

            const logs = response.logs.map(log => ({
                timestamp: new Date(log.timestamp),
                level: log.level as 'info' | 'warning' | 'error',
                message: log.message
            }));

            this.sentinelLogs.set(logs);
        } catch (error) {
            console.error('❌ Error fetching logs:', error);
            // No mostrar error al usuario, solo mantener logs existentes
        }
    }

    // ─── API: OBTENER ALERTAS REALES ──────────────────────────
    async fetchRealAlerts(): Promise<void> {
        try {
            const response = await firstValueFrom(
                this.http.get<{ alerts: SentinelAlert[]; count: number }>(`${this.apiBaseUrl}/alerts`).pipe(timeout(5000))
            );

            const alerts = response.alerts.map((alert, index) => ({
                id: Date.now() + index,
                severity: alert.severity,
                message: alert.message,
                timestamp: new Date()
            }));

            // Merge con alertas existentes para no perder las manuales
            const currentAlerts = this.activeAlerts();
            const newAlerts = [...alerts, ...currentAlerts].slice(0, 20);
            this.activeAlerts.set(newAlerts);
        } catch (error) {
            console.error('❌ Error fetching alerts:', error);
        }
    }

    // ─── ESCANEO COMPLETO DEL SISTEMA ─────────────────────────
    async fullSystemScan() {
        this.addLog('info', '🔍 INITIATING FULL SYSTEM SCAN');
        this.addLog('info', 'Fetching latest metrics...');

        await this.fetchRealMetrics();
        await this.fetchRealLogs();
        await this.fetchRealAlerts();

        this.addLog('info', 'Checking VIC Core integrity...');
        await this.pingBackend();

        this.addLog('info', 'Validating neural pathways...');
        this.addLog('info', 'Scanning multimodal interfaces...');

        setTimeout(() => {
            const issues = [];
            if (this.cpuUsage() > 70) issues.push('High CPU load');
            if (this.memoryUsage() > 80) issues.push('Memory pressure');
            if (this.systemStatus() !== 'online') issues.push('Connectivity issues');

            if (issues.length === 0) {
                this.addLog('info', '✅ FULL SCAN COMPLETE: No issues detected');
            } else {
                this.addLog('warning', `⚠️ FULL SCAN COMPLETE: ${issues.length} issues found`);
                issues.forEach(issue => this.addAlert('medium', issue));
            }
        }, 2000);
    }

    // ─── REFRESCAR MANUAL ─────────────────────────────────────
    async refreshMetrics() {
        this.addLog('info', 'Manual refresh triggered');
        await this.fetchRealMetrics();
        await this.fetchRealAlerts();
        this.totalRequests.update(v => v + 1);
    }

    // ─── AGREGAR LOG LOCAL ────────────────────────────────────
    addLog(level: 'info' | 'warning' | 'error', message: string) {
        const currentLogs = this.sentinelLogs();
        const newLog = { timestamp: new Date(), level, message };
        this.sentinelLogs.set([newLog, ...currentLogs].slice(0, 50));
    }

    // ─── AGREGAR ALERTA LOCAL ─────────────────────────────────
    addAlert(severity: 'low' | 'medium' | 'high', message: string) {
        const currentAlerts = this.activeAlerts();
        const newAlert = {
            id: Date.now(),
            severity,
            message,
            timestamp: new Date()
        };
        this.activeAlerts.set([newAlert, ...currentAlerts].slice(0, 20));
        this.addLog('warning', `ALERT: ${message}`);
    }

    // ─── LIMPIAR ALERTAS ──────────────────────────────────────
    clearAlerts() {
        this.activeAlerts.set([]);
        this.addLog('info', 'All alerts cleared');
    }

    // ─── INICIALIZACIÓN ───────────────────────────────────────
    ngOnInit() {
        this.addLog('info', '🚨 VIC Sentinel activated');
        this.addLog('info', 'System monitoring initialized');
        this.lastPing.set(new Date());

        // Cargar datos reales iniciales
        this.fetchRealMetrics();
        this.fetchRealLogs();
        this.fetchRealAlerts();
        this.pingBackend();

        // Simular uptime (el backend no lo provee, lo mantenemos local)
        this.uptimeSeconds.set(172800); // 2 días simulados

        this.uptimeInterval = setInterval(() => {
            this.uptimeSeconds.update(v => v + 1);
        }, 1000);

        // Ping automático cada 30 segundos
        this.pingInterval = setInterval(() => {
            this.pingBackend();
        }, 30000);

        // Refresh automático de métricas cada 10 segundos
        this.metricsInterval = setInterval(() => {
            this.fetchRealMetrics();
            this.fetchRealAlerts();
        }, 10000);
    }

    ngOnDestroy() {
        if (this.uptimeInterval) clearInterval(this.uptimeInterval);
        if (this.pingInterval) clearInterval(this.pingInterval);
        if (this.metricsInterval) clearInterval(this.metricsInterval);
        this.addLog('info', 'VIC Sentinel deactivated');
    }


    private checkThresholds(metrics: SystemMetrics): void {
        const cpu = metrics.cpu.percent;
        const memory = metrics.memory.percent;
        const disk = metrics.disk.percent;

        // ─── MEMORIA ─────────────────────────────────────────
        if (memory > 85 && !this.lastAlertState.memory) {
            this.addAlert('high', `⚠️ MEMORY CRITICAL: ${memory}%`);
            this.lastAlertState.memory = true;
        } else if (memory <= 85) {
            this.lastAlertState.memory = false;
        }

        // ─── DISCO ───────────────────────────────────────────
        if (disk > 85 && !this.lastAlertState.disk) {
            this.addAlert('high', `⚠️ DISK CRITICAL: ${disk}%`);
            this.lastAlertState.disk = true;
        } else if (disk <= 85) {
            this.lastAlertState.disk = false;
        }

        // ─── CPU (FILTRO INTELIGENTE VERTEX) ──────────────────
        // Solo disparamos alerta si el CPU está alto Y la IA NO está analizando.
        // Si la IA está analizando, es NORMAL que el CPU esté al 100%.
        const aiIsThinking = this.oracle.isAnalyzing();

        if (cpu > 85 && !aiIsThinking && !this.lastAlertState.cpu) {
            this.addAlert('medium', `⚠️ CPU UNUSUAL LOAD: ${cpu}%`);
            this.lastAlertState.cpu = true;
        } else if (cpu <= 80) {
            this.lastAlertState.cpu = false;
        }
    }

    triggerRedProtocol() {
        const body = document.body;
        body.classList.add('alert-flash-red');

        // Sonido de alerta (Vertex Standard)
        const audio = new Audio('assets/sounds/alarm.mp3');
        audio.play().catch(() => console.log('Interacción requerida para audio'));

        setTimeout(() => {
            body.classList.remove('alert-flash-red');
        }, 5000); // 5 segundos de pánico
    }
}