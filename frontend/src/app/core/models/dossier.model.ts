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
}

export interface DossierUpdate extends Partial<DossierCreate> {
    idDossier: number;
}
