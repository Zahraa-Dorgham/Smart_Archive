export type DashboardRole = 'admin' | 'archiviste' | 'responsable' | 'employe';

export interface DashboardConfig {
  eyebrow: string;
  title: string;
  description: string;
  showCapacity: boolean;
  showLocations: boolean;
  showTransfers: boolean;
  showPhases: boolean;
  showHistory: boolean;
  showEvolution: boolean;
  showBuildings: boolean;
  showLogins: boolean;
}

export interface DashboardGlobalStats {
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

export interface BatimentStat {
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

export interface PhaseStat {
  id: number | null;
  nom: string;
  documents: number;
  dossiers: number;
  total: number;
}

export interface TransferItem {
  id: number;
  reference: string;
  typeTransfer?: string;
  statut?: string;
  date_demande?: string;
  date_execution?: string | null;
  boitiers?: number;
}

export interface TransferStatus {
  statut: string;
  total: number;
}

export interface LoginItem {
  id: number;
  username: string;
  full_name: string;
  last_login: string;
  is_active: boolean;
}

export interface DocumentEvolutionPoint {
  period: string;
  label: string;
  total: number;
  cumulative: number;
}

export interface ChartPoint extends DocumentEvolutionPoint {
  x: number;
  y: number;
}

export interface DashboardPayload {
  scope?: DashboardRole;
  direction?: string;
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

export const DEFAULT_GLOBAL_STATS: DashboardGlobalStats = {
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
