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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user$: any;
  loginDate: Date | null = null;
  loading = true;
  errorMessage = '';

  globalStats: DashboardGlobalStats = {
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

  batimentStats: BatimentStat[] = [];
  phaseDistribution: PhaseStat[] = [];
  transferStatus: TransferStatus[] = [];
  recentTransfers: TransferItem[] = [];
  pendingTransfers: TransferItem[] = [];
  recentLogins: LoginItem[] = [];

  readonly phaseColors = ['#5a8dee', '#39da8a', '#fdac41', '#ff5b5c', '#00cfdd', '#6f42c1'];

  constructor(
    public authService: AuthService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.user$ = this.authService.currentUser$;
    const ld = localStorage.getItem('login_date');
    this.loginDate = ld ? new Date(ld) : null;
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get('/stats/').subscribe({
      next: (res: any) => {
        this.globalStats = { ...this.globalStats, ...(res.global || {}) };
        this.batimentStats = res.batiments || [];
        this.phaseDistribution = res.phases || [];
        this.transferStatus = res.transferts?.status || [];
        this.recentTransfers = res.transferts?.recent || [];
        this.pendingTransfers = res.transferts?.pending || [];
        this.recentLogins = res.logins || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading stats', err);
        this.errorMessage = 'Impossible de charger les statistiques du tableau de bord.';
        this.loading = false;
      }
    });
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
