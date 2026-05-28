import { Component, Input, Directive } from '@angular/core';
import { 
  DashboardGlobalStats, BatimentStat, PhaseStat, 
  TransferItem, TransferStatus, LoginItem, 
  DocumentEvolutionPoint 
} from '../dashboard.models';

@Directive()
export abstract class BaseRoleDashboardComponent {
  @Input() globalStats!: DashboardGlobalStats;
  @Input() kpiCards: any[] = [];
  @Input() locationCards: any[] = [];
  @Input() transferStatus: TransferStatus[] = [];
  @Input() pendingTransfers: TransferItem[] = [];
  @Input() phaseDistribution: PhaseStat[] = [];
  @Input() recentTransfers: TransferItem[] = [];
  @Input() documentEvolution: DocumentEvolutionPoint[] = [];
  @Input() batimentStats: BatimentStat[] = [];
  @Input() recentLogins: LoginItem[] = [];
  
  @Input() phaseTotal = 0;
  @Input() maxPhaseTotal = 1;
  @Input() phaseColors: string[] = [];
  @Input() latestDocumentEvolution: any;
  @Input() documentEvolutionArea = '';
  @Input() documentEvolutionPolyline = '';
  @Input() documentEvolutionChartPoints: any[] = [];
  @Input() phaseDonutBackground = '';
  @Input() maxBatimentDocuments = 1;
  @Input() loading = false;

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

  percent(value: number, total: number): number {
    return total ? Math.round((value / total) * 100) : 0;
  }

  barWidth(value: number, max: number): string {
    const width = max ? Math.max((value / max) * 100, value > 0 ? 6 : 0) : 0;
    return `${Math.min(width, 100)}%`;
  }

  trackById(_: number, item: any): any {
    return item.id ?? item.label ?? item.nom ?? item.reference;
  }
}
