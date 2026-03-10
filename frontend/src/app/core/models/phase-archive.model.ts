import { BaseModel } from './base.model';

export interface PhaseArchive extends BaseModel {
    nom: string;
    code?: string;
    type_phase: string;        // 'COURANTE', 'INTERMEDIAIRE', 'DEFINITIVE'
    duree_conservation: number; // en années
    description?: string;
    phase_suivante?: string | null; // ID de la phase suivante
    action_finale: string;      // 'CONSERVER' ou 'ELIMINER'
    ordre: number;
}

export interface PhaseArchiveCreate {
    nom: string;
    code?: string;
    type_phase: string;
    duree_conservation: number;
    description?: string;
    phase_suivante?: string | null;
    action_finale: string;
    ordre: number;
}

export interface PhaseArchiveUpdate extends Partial<PhaseArchiveCreate> {
    id: string;
}