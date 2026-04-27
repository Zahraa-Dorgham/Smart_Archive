import { BaseModel } from './base.model';
import { Boitier } from './boitier.model';
import { PhaseArchive } from './phase-archive.model';

export interface Dossier extends BaseModel {
    idDossier: number;
    nomDos?: string | null;
    boitier?: Boitier | string | null;
    boitier_idboit?: string;
    phaseArchive?: PhaseArchive | string | null;
    phaseArchive_nom?: string;
    phaseType: string;
    date_creation: Date;
    date_cloture?: Date | null;
    dureeCourant: number;
    dureeIntermediaire: number;
    dureeDefinitive: number;
    conservation_active_period?: number | null;
    conservation_semi_active_period?: number | null;
    sort_final_type?: string | null;
    sort_final_comment?: string | null;
    sort_final_security_years?: number | null;
    nombre_documents?: number;
}

export interface DossierCreate {
    nomDos?: string | null;
    boitier?: string | null;
    phaseArchive?: string | null;
    phaseType: string;
    date_creation: Date;
    date_cloture?: Date | null;
    dureeCourant?: number;
    dureeIntermediaire?: number;
    dureeDefinitive?: number;
    conservation_active_period?: number | null;
    conservation_semi_active_period?: number | null;
    sort_final_type?: string | null;
    sort_final_comment?: string | null;
    sort_final_security_years?: number | null;
}

export interface DossierUpdate extends Partial<DossierCreate> {
    idDossier: number;
}
