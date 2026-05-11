import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';

interface DashboardGlobalStats {
  total_documents: number;
  total_dossiers: number;
  total_boitiers: number;
  total_transferts: number;
  transferts_en_attente: number;
  total_batiments: number;
  total_salles: number;
  total_armoires: number;
  total_etageres: number;
  capacite_emplacements: number;
  emplacements_occupes: number;
  emplacements_vides: number;
  pourcentage_emplacements_vides: number;
  total_users: number;
  active_users: number;
  users_with_login: number;
}

interface BatimentStat {
  id: number;
  nom: string;
  code?: string;
  salles: number;
  armoires: number;
  capacite: number;
  occupes: number;
  emplacements_vides: number;
  taux_vide: number;
  boitiers: number;
  dossiers: number;
  documents: number;
}

interface PhaseStat {
  id: number | null;
  nom: string;
  documents: number;
  dossiers: number;
  total: number;
}

interface TransferItem {
  id: number;
  reference: string;
  typeTransfer?: string;
  statut?: string;
  date_demande?: string;
  date_execution?: string | null;
  boitiers?: number;
}

interface TransferStatus {
  statut: string;
  total: number;
}

interface LoginItem {
  id: number;
  username: string;
  full_name: string;
  last_login: string;
  is_active: boolean;
}

interface DocumentEvolutionPoint {
  period: string;
  label: string;
  total: number;
  cumulative: number;
}

interface ChartPoint extends DocumentEvolutionPoint {
  x: number;
  y: number;
}

interface DashboardPayload {
  global?: Partial<DashboardGlobalStats>;
  batiments?: BatimentStat[];
  phases?: PhaseStat[];
  transferts?: {
    status?: TransferStatus[];
    recent?: TransferItem[];
    pending?: TransferItem[];
  };
  logins?: LoginItem[];
  document_evolution?: DocumentEvolutionPoint[];
}

const DEFAULT_GLOBAL_STATS: DashboardGlobalStats = {
  total_documents: 0,
  total_dossiers: 0,
  total_boitiers: 0,
  total_transferts: 0,
  transferts_en_attente: 0,
  total_batiments: 0,
  total_salles: 0,
  total_armoires: 0,
  total_etageres: 0,
  capacite_emplacements: 0,
  emplacements_occupes: 0,
  emplacements_vides: 0,
  pourcentage_emplacements_vides: 0,
  total_users: 0,
  active_users: 0,
  users_with_login: 0
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private readonly cacheKey = 'dashboard_stats_cache_v2';
  user$: any;
  loginDate: Date | null = null;
  loading = true;
  errorMessage = '';

  globalStats: DashboardGlobalStats = { ...DEFAULT_GLOBAL_STATS };

  batimentStats: BatimentStat[] = [];
  phaseDistribution: PhaseStat[] = [];
  transferStatus: TransferStatus[] = [];
  recentTransfers: TransferItem[] = [];
  pendingTransfers: TransferItem[] = [];
  recentLogins: LoginItem[] = [];
  documentEvolution: DocumentEvolutionPoint[] = [];

  readonly phaseColors = ['#5a8dee', '#39da8a', '#fdac41', '#ff5b5c', '#00cfdd', '#6f42c1'];

  constructor(
    public authService: AuthService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.user$ = this.authService.currentUser$;
    const ld = localStorage.getItem('login_date');
    this.loginDate = ld ? new Date(ld) : null;
    this.restoreCachedStats();
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get<DashboardPayload>('/stats/').subscribe({
      next: (res) => {
        if (!res || !res.global) {
          this.errorMessage = 'Les statistiques recues sont incompletes.';
          this.loading = false;
          return;
        }

        this.applyStats(res);
        this.cacheStats(res);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading stats', err);
        this.errorMessage = 'Impossible de charger les statistiques du tableau de bord.';
        this.loading = false;
      }
    });
  }

  private applyStats(res: DashboardPayload): void {
    this.globalStats = { ...DEFAULT_GLOBAL_STATS, ...this.globalStats, ...(res.global || {}) };
    this.batimentStats = Array.isArray(res.batiments)
      ? res.batiments.map((bat) => this.normalizeBatimentStat(bat))
      : this.batimentStats;
    this.phaseDistribution = Array.isArray(res.phases) ? res.phases : this.phaseDistribution;
    this.transferStatus = Array.isArray(res.transferts?.status) ? res.transferts!.status! : this.transferStatus;
    this.recentTransfers = Array.isArray(res.transferts?.recent) ? res.transferts!.recent! : this.recentTransfers;
    this.pendingTransfers = Array.isArray(res.transferts?.pending) ? res.transferts!.pending! : this.pendingTransfers;
    this.recentLogins = Array.isArray(res.logins) ? res.logins : this.recentLogins;
    this.documentEvolution = Array.isArray(res.document_evolution) ? res.document_evolution : this.documentEvolution;
  }

  private normalizeBatimentStat(bat: BatimentStat): BatimentStat {
    const archiveItems = (bat.documents || 0) + (bat.dossiers || 0) + (bat.boitiers || 0);
    const normalizedEmptyRate = archiveItems === 0 ? 100 : Math.min(Number(bat.taux_vide) || 0, 99.9);

    return {
      ...bat,
      taux_vide: normalizedEmptyRate
    };
  }

  private restoreCachedStats(): void {
    if (typeof window === 'undefined') return;

    const cached = sessionStorage.getItem(this.cacheKey);
    if (!cached) return;

    try {
      this.applyStats(JSON.parse(cached));
    } catch (e) {
      console.warn('Dashboard cache invalide', e);
      sessionStorage.removeItem(this.cacheKey);
    }
  }

  private cacheStats(res: DashboardPayload): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(this.cacheKey, JSON.stringify(res));
  }

  get userName(): string {
    const u = this.authService.getCurrentUser();
    if (!u) return 'Utilisateur';
    return u.first_name ? `${u.first_name} ${u.last_name}`.trim() : (u.username || 'Utilisateur');
  }

  get userRoles(): string[] {
    return this.authService.getUserRoles();
  }

  get kpiCards() {
    return [
      { label: 'Documents', value: this.globalStats.total_documents, icon: 'bx-file', tone: 'primary', hint: 'Pieces archivees' },
      { label: 'Dossiers', value: this.globalStats.total_dossiers, icon: 'bx-folder', tone: 'warning', hint: 'Dossiers suivis' },
      { label: 'Boitiers', value: this.globalStats.total_boitiers, icon: 'bx-box', tone: 'success', hint: 'Contenants actifs' },
      { label: 'Transferts', value: this.globalStats.total_transferts, icon: 'bx-transfer', tone: 'info', hint: `${this.globalStats.transferts_en_attente} en attente` }
    ];
  }

  get locationCards() {
    return [
      { label: 'Batiments', value: this.globalStats.total_batiments, icon: 'bx-building-house' },
      { label: 'Salles', value: this.globalStats.total_salles, icon: 'bx-layout' },
      { label: 'Armoires', value: this.globalStats.total_armoires, icon: 'bx-archive' },
      { label: 'Etageres', value: this.globalStats.total_etageres, icon: 'bx-grid-alt' }
    ];
  }

  get phaseTotal(): number {
    return this.phaseDistribution.reduce((sum, phase) => sum + (phase.total || 0), 0);
  }

  get maxBatimentDocuments(): number {
    return Math.max(...this.batimentStats.map((bat) => bat.documents || 0), 1);
  }

  get maxPhaseTotal(): number {
    return Math.max(...this.phaseDistribution.map((phase) => phase.total || 0), 1);
  }

  get latestDocumentEvolution(): DocumentEvolutionPoint | null {
    return this.documentEvolution.length ? this.documentEvolution[this.documentEvolution.length - 1] : null;
  }

  get maxDocumentEvolution(): number {
    return Math.max(...this.documentEvolution.map((point) => point.cumulative || 0), 1);
  }

  get documentEvolutionChartPoints(): ChartPoint[] {
    const width = 720;
    const height = 220;
    const paddingLeft = 42;
    const paddingRight = 18;
    const paddingTop = 18;
    const paddingBottom = 34;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;
    const max = this.maxDocumentEvolution;
    const lastIndex = Math.max(this.documentEvolution.length - 1, 1);

    return this.documentEvolution.map((point, index) => ({
      ...point,
      x: paddingLeft + (plotWidth * index) / lastIndex,
      y: paddingTop + plotHeight - ((point.cumulative || 0) / max) * plotHeight
    }));
  }

  get documentEvolutionPolyline(): string {
    return this.documentEvolutionChartPoints.map((point) => `${point.x},${point.y}`).join(' ');
  }

  get documentEvolutionArea(): string {
    const points = this.documentEvolutionChartPoints;
    if (!points.length) return '';

    const baseline = 186;
    return `42,${baseline} ${points.map((point) => `${point.x},${point.y}`).join(' ')} 702,${baseline}`;
  }

  get phaseDonutBackground(): string {
    if (!this.phaseTotal) {
      return 'conic-gradient(#eef1f6 0 360deg)';
    }

    let cursor = 0;
    const segments = this.phaseDistribution.map((phase, index) => {
      const start = cursor;
      const width = ((phase.total || 0) / this.phaseTotal) * 360;
      cursor += width;
      return `${this.phaseColors[index % this.phaseColors.length]} ${start}deg ${cursor}deg`;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }

  percent(value: number, total: number): number {
    return total ? Math.round((value / total) * 100) : 0;
  }

  barWidth(value: number, max: number): string {
    const width = max ? Math.max((value / max) * 100, value > 0 ? 6 : 0) : 0;
    return `${Math.min(width, 100)}%`;
  }

  statusLabel(status?: string): string {
    const labels: Record<string, string> = {
      EN_ATTENTE: 'En attente',
      VALIDE: 'Valide',
      ANNULE: 'Annule',
      REJETE: 'Rejete',
      NON_RENSEIGNE: 'Non renseigne'
    };
    return labels[status || ''] || status || 'Non renseigne';
  }

  statusTone(status?: string): string {
    const tones: Record<string, string> = {
      EN_ATTENTE: 'warning',
      VALIDE: 'success',
      ANNULE: 'secondary',
      REJETE: 'danger'
    };
    return tones[status || ''] || 'primary';
  }

  trackById(_: number, item: { id?: number | null; label?: string; nom?: string; reference?: string }): number | string | null | undefined {
    return item.id ?? item.label ?? item.nom ?? item.reference;
  }
}
