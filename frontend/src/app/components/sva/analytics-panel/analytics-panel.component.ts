import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

export interface Threat {
    id: string;
    type: string;
    severity: string;
    message: string;
    description: string;
    timestamp: number;
    frameSnapshot?: string;
}

export interface ThreatSummary {
    type: string;
    count: number;
    icon: string;
    color: string;
}

@Component({
    selector: 'app-analytics-panel',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="analytics-overlay" (click)="close.emit()">
      <div class="analytics-panel" (click)="$event.stopPropagation()">
        
        <!-- HEADER -->
        <div class="analytics-header">
          <div class="header-title">
            <span class="icon">📊</span>
            <h2>VERTEX SENTINEL ANALYTICS</h2>
          </div>
          <button class="close-btn" (click)="close.emit()">✕</button>
        </div>

        <!-- TARJETAS DE ESTADÍSTICAS -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🔍</div>
            <div class="stat-value">{{ totalScans | number }}</div>
            <div class="stat-label">Escaneos Totales</div>
          </div>
          <div class="stat-card threat">
            <div class="stat-icon">⚠️</div>
            <div class="stat-value">{{ threatsDetected | number }}</div>
            <div class="stat-label">Amenazas Detectadas</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-value">{{ formattedUptime }}</div>
            <div class="stat-label">Tiempo Activo</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📸</div>
            <div class="stat-value">{{ accuracy }}%</div>
            <div class="stat-label">Precisión Estimada</div>
          </div>
        </div>

        <!-- GRÁFICO Y TENDENCIAS -->
        <div class="charts-row">
          <div class="chart-container">
            <h3>📈 Detecciones por Tipo</h3>
            <canvas #threatChart></canvas>
          </div>
          <div class="trends-container">
            <h3>📅 Últimas 24hs</h3>
            <div class="trend-bars">
              @for (hour of last24Hours; track hour.label) {
                <div class="trend-bar-wrapper">
                  <div class="trend-bar" [style.height.%]="hour.count * 10"></div>
                  <span class="trend-label">{{ hour.label }}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- TABLA DE AMENAZAS RECIENTES -->
        <div class="history-section">
          <div class="section-header">
            <h3>🚨 Historial de Amenazas</h3>
            <div class="filters">
              <select [(ngModel)]="filterType" (ngModelChange)="applyFilters()">
                <option value="all">Todos los tipos</option>
                @for (type of threatTypes; track type) {
                  <option [value]="type">{{ type }}</option>
                }
              </select>
              <button class="export-btn" (click)="exportToCSV()">📥 Exportar CSV</button>
              <button class="refresh-btn" (click)="refreshData()">🔄 Refrescar</button>
            </div>
          </div>
          
          <div class="threat-table">
            <div class="table-header">
              <span>Tipo</span>
              <span>Mensaje</span>
              <span>Fecha/Hora</span>
            </div>
            @for (threat of filteredThreats; track threat.id) {
              <div class="table-row" [class.critical]="threat.severity === 'critical'">
                <span class="threat-type">
                  <span class="threat-icon">{{ getThreatIcon(threat.type) }}</span>
                  {{ threat.type }}
                </span>
                <span class="threat-message">{{ threat.message }}</span>
                <span class="threat-date">{{ formatDate(threat.timestamp) }}</span>
              </div>
            } @empty {
              <div class="empty-state">
                <span>✨ No hay amenazas registradas</span>
              </div>
            }
          </div>
        </div>

        <!-- FOOTER ACCIONES -->
        <div class="analytics-footer">
  <button class="action-btn close-btn-footer" (click)="close.emit()">
    ✕ CERRAR
  </button>
  
  <button class="action-btn primary" (click)="exportFullReport()">
    📋 EXPORTAR REPORTE
  </button>
  
  @if (threatHistory.length > 0) {
    <button class="action-btn danger" (click)="clearHistory.emit()">
      🗑️ LIMPIAR
    </button>
  }
</div>
      </div>
    </div>
  `,
    styles: [`
   /* ============================================
   ANALYTICS PANEL - ESTILO COHERENTE CON TU DASHBOARD
   ============================================ */

/* ============================================
   ANALYTICS PANEL - RESPONSIVE COMPLETO
   Compatible con Galaxy S22 (360px - 412px)
   ============================================ */

:host {
  --primary: #00ff88;
  --primary-dark: #00cc6a;
  --primary-glow: rgba(0, 255, 136, 0.2);
  --secondary: #00aaff;
  --secondary-glow: rgba(0, 170, 255, 0.2);
  --warning: #ffaa00;
  --danger: #ff4444;
  --bg-dark: #0a0a0f;
  --bg-card: rgba(10, 10, 15, 0.95);
  --bg-elevated: rgba(20, 20, 30, 0.9);
  --border: rgba(51, 51, 68, 0.5);
  --text-primary: #e0e0e0;
  --text-secondary: #8888aa;
  --text-muted: #555570;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
}

/* ============================================
   OVERLAY - OCUPA TODA LA PANTALLA
   ============================================ */
.analytics-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  animation: fadeIn 0.2s ease;
  overflow-y: auto;
}

/* ============================================
   PANEL PRINCIPAL - FULLSCREEN EN MÓVIL
   ============================================ */
.analytics-panel {
  background: var(--bg-card);
  backdrop-filter: blur(10px);
  border-radius: 0;
  width: 100%;
  max-width: none;
  min-height: 100vh;
  overflow-y: auto;
  border: none;
  box-shadow: none;
  animation: slideUp 0.2s ease;
}

/* Tablet y desktop */
@media (min-width: 769px) {
  .analytics-overlay {
    align-items: center;
  }
  
  .analytics-panel {
    border-radius: var(--radius-lg);
    width: 90%;
    max-width: 1300px;
    max-height: 85vh;
    min-height: auto;
    border: 1px solid var(--border);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
}

/* ============================================
   HEADER - FIJO EN MÓVIL
   ============================================ */
.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.95);
  position: sticky;
  top: 0;
  z-index: 10;
}

@media (min-width: 769px) {
  .analytics-header {
    padding: 1.2rem 1.8rem;
    position: relative;
    background: rgba(0, 0, 0, 0.3);
  }
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title .icon {
  font-size: 1.4rem;
}

.header-title h2 {
  margin: 0;
  font-size: 1rem;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 700;
}

@media (min-width: 769px) {
  .header-title .icon {
    font-size: 1.8rem;
  }
  .header-title h2 {
    font-size: 1.3rem;
  }
}

/* Botón cerrar - siempre visible */
.close-btn {
  background: rgba(255, 68, 68, 0.15);
  border: 1px solid var(--danger);
  color: var(--danger);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.3rem;
  font-weight: bold;
}

@media (min-width: 769px) {
  .close-btn {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    width: 36px;
    height: 36px;
    font-size: 1.2rem;
  }
  .close-btn:hover {
    border-color: var(--danger);
    color: var(--danger);
  }
}

/* ============================================
   STATS GRID - 2 COLUMNAS EN MÓVIL
   ============================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
}

@media (min-width: 769px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 1.5rem;
  }
}

.stat-card {
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  padding: 12px 8px;
  text-align: center;
  border: 1px solid var(--border);
}

.stat-icon {
  font-size: 1.4rem;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: bold;
  color: var(--primary);
  font-family: monospace;
}

.stat-label {
  font-size: 0.6rem;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-top: 4px;
}

@media (min-width: 769px) {
  .stat-card {
    padding: 16px;
  }
  .stat-icon {
    font-size: 1.8rem;
  }
  .stat-value {
    font-size: 2rem;
  }
  .stat-label {
    font-size: 0.7rem;
  }
}

/* ============================================
   CHARTS ROW - COLUMNA EN MÓVIL
   ============================================ */
.charts-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 16px 16px 16px;
}

@media (min-width: 769px) {
  .charts-row {
    display: grid;
    grid-template-columns: 1fr 0.8fr;
    gap: 1.2rem;
    padding: 0 1.5rem 1.5rem 1.5rem;
  }
}

.chart-container, .trends-container {
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  padding: 12px;
  border: 1px solid var(--border);
}

.chart-container h3, .trends-container h3 {
  margin: 0 0 12px 0;
  font-size: 0.7rem;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

@media (min-width: 769px) {
  .chart-container, .trends-container {
    padding: 1rem;
  }
  .chart-container h3, .trends-container h3 {
    font-size: 0.75rem;
  }
}

/* Canvas - responsive */
canvas {
  width: 100% !important;
  height: auto !important;
  max-height: 180px;
}

@media (min-width: 769px) {
  canvas {
    max-height: 250px;
  }
}

/* Trend bars - móvil */
.trend-bars {
  display: flex;
  gap: 4px;
  justify-content: space-around;
  align-items: flex-end;
  height: 120px;
}

.trend-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.trend-bar {
  width: 100%;
  background: linear-gradient(180deg, var(--primary), var(--secondary));
  border-radius: 3px 3px 0 0;
  min-height: 3px;
}

.trend-label {
  font-size: 0.55rem;
  color: var(--text-muted);
  margin-top: 6px;
}

@media (min-width: 769px) {
  .trend-bars {
    gap: 8px;
    height: 150px;
  }
  .trend-label {
    font-size: 0.65rem;
  }
}

/* ============================================
   HISTORY SECTION - FULL WIDTH
   ============================================ */
.history-section {
  padding: 0 16px 16px 16px;
}

@media (min-width: 769px) {
  .history-section {
    padding: 0 1.5rem 1.5rem 1.5rem;
  }
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

@media (min-width: 600px) {
  .section-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.section-header h3 {
  margin: 0;
  font-size: 0.75rem;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Filtros - wrap en móvil */
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

select {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-family: monospace;
  font-size: 0.7rem;
  flex: 1;
  min-width: 100px;
}

.export-btn, .refresh-btn {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--secondary);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

/* ============================================
   TABLA - SCROLL HORIZONTAL EN MÓVIL
   ============================================ */
.threat-table {
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-md);
  overflow-x: auto;
  border: 1px solid var(--border);
}

.table-header, .table-row {
  display: grid;
  grid-template-columns: 70px 1fr 90px;
  padding: 10px 12px;
  font-size: 0.7rem;
  min-width: 300px;
}

@media (min-width: 769px) {
  .table-header, .table-row {
    grid-template-columns: 100px 1fr 140px;
    padding: 10px 16px;
    font-size: 0.75rem;
    min-width: auto;
  }
}

.table-header {
  background: rgba(0, 255, 136, 0.08);
  font-weight: bold;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.table-row {
  border-bottom: 1px solid var(--border);
}

.table-row.critical {
  background: rgba(255, 68, 68, 0.1);
  border-left: 3px solid var(--danger);
}

.threat-type {
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: capitalize;
}

.threat-message {
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.threat-date {
  color: var(--text-muted);
  font-size: 0.65rem;
}

.empty-state {
  text-align: center;
  padding: 40px 16px;
  color: var(--text-muted);
  font-size: 0.75rem;
}

/* ============================================
   FOOTER - COLUMNA EN MÓVIL
   ============================================ */
.analytics-footer {
  padding: 16px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (min-width: 769px) {
  .analytics-footer {
    padding: 1rem 1.5rem;
    flex-direction: row;
    justify-content: flex-end;
  }
}

.action-btn {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: monospace;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: 100%;
  text-align: center;
}

@media (min-width: 769px) {
  .action-btn {
    width: auto;
    padding: 8px 20px;
  }
}

.action-btn.primary {
  border-color: var(--primary);
  color: var(--primary);
}

/* ============================================
   ANIMACIONES
   ============================================ */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* ============================================
   GALAXY S22 ESPECÍFICO (360px - 412px)
   ============================================ */
@media (max-width: 412px) {
  .stats-grid {
    gap: 8px;
    padding: 12px;
  }
  
  .stat-card {
    padding: 10px 6px;
  }
  
  .stat-value {
    font-size: 1.3rem;
  }
  
  .stat-label {
    font-size: 0.55rem;
  }
  
  .charts-row {
    gap: 12px;
    padding: 0 12px 12px 12px;
  }
  
  .history-section {
    padding: 0 12px 12px 12px;
  }
  
  .table-header, .table-row {
    padding: 8px 10px;
    font-size: 0.65rem;
    grid-template-columns: 65px 1fr 85px;
  }
  
  .threat-icon {
    font-size: 0.8rem;
  }
  
  .threat-date {
    font-size: 0.6rem;
  }
  
  .action-btn {
    padding: 8px 12px;
    font-size: 0.65rem;
  }
}
  `]
})
export class AnalyticsPanelComponent implements OnChanges, AfterViewInit {
    @Input() threatHistory: Threat[] = [];
    @Input() totalScans: number = 0;
    @Input() threatsDetected: number = 0;
    @Input() uptimeSeconds: number = 0;

    @Output() close = new EventEmitter<void>();
    @Output() clearHistory = new EventEmitter<void>();
    @Output() refresh = new EventEmitter<void>();

    @ViewChild('threatChart') threatChartRef!: ElementRef<HTMLCanvasElement>;

    private chart: Chart | null = null;

    filterType: string = 'all';
    filteredThreats: Threat[] = [];

    get formattedUptime(): string {
        const h = Math.floor(this.uptimeSeconds / 3600);
        const m = Math.floor((this.uptimeSeconds % 3600) / 60);
        const s = this.uptimeSeconds % 60;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    }

    get accuracy(): number {
        if (this.totalScans === 0) return 100;
        return Math.round(((this.totalScans - this.threatsDetected) / this.totalScans) * 100);
    }

    get threatTypes(): string[] {
        const types = new Set(this.threatHistory.map(t => t.type));
        return Array.from(types);
    }

    get last24Hours(): { label: string; count: number }[] {
        const now = Date.now();
        const hours = [];
        for (let i = 23; i >= 0; i--) {
            const hourStart = now - (i + 1) * 3600000;
            const hourEnd = now - i * 3600000;
            const count = this.threatHistory.filter(t => t.timestamp >= hourStart && t.timestamp < hourEnd).length;
            hours.push({ label: i === 0 ? 'Ahora' : `${23 - i}h`, count });
        }
        return hours;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['threatHistory']) {
            this.applyFilters();
            setTimeout(() => this.updateChart(), 50);
        }
    }

    ngAfterViewInit(): void {
        setTimeout(() => this.updateChart(), 100);
    }

    applyFilters(): void {
        if (this.filterType === 'all') {
            this.filteredThreats = [...this.threatHistory];
        } else {
            this.filteredThreats = this.threatHistory.filter(t => t.type === this.filterType);
        }
    }

    updateChart(): void {
        if (!this.threatChartRef?.nativeElement) return;

        const typeCounts: Record<string, number> = {};
        this.threatHistory.forEach(t => {
            typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
        });

        const labels = Object.keys(typeCounts);
        const data = Object.values(typeCounts);
        const colors = ['#00ffff', '#ff4444', '#ffaa00', '#ff6600', '#aa44ff', '#44ffaa'];

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(this.threatChartRef.nativeElement, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Detecciones',
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: '#fff' } }
                },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
                    x: { ticks: { color: '#fff' } }
                }
            }
        });
    }

    getThreatIcon(type: string): string {
        const icons: Record<string, string> = {
            fall: '🫸', fire: '🔥', intruder: '🚨', weapon: '⚠️',
            medical: '🏥', wolf: '🐺', dangerous_animal: '🦁', unknown: '❓'
        };
        return icons[type] || '❓';
    }

    formatDate(timestamp: number): string {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    exportToCSV(): void {
        const headers = ['Tipo', 'Mensaje', 'Descripción', 'Severidad', 'Fecha/Hora'];
        const rows = this.filteredThreats.map(t => [
            t.type, t.message, t.description, t.severity, new Date(t.timestamp).toLocaleString()
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sentinel_threats_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportFullReport(): void {
        const report = {
            generatedAt: new Date().toISOString(),
            statistics: {
                totalScans: this.totalScans,
                threatsDetected: this.threatsDetected,
                uptimeSeconds: this.uptimeSeconds,
                accuracy: this.accuracy
            },
            threats: this.threatHistory
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sentinel_full_report_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    refreshData(): void {
        this.refresh.emit();
        this.applyFilters();
    }
}