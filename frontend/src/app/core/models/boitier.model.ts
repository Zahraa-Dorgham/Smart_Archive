import { BaseModel } from './base.model';

export interface Boitier extends BaseModel {
    idboit: string;
    code_barre: string;
    titre: string;
    capacite: number;
    armoire?: string;
    armoire_nom?: string;
    etagere?: string;
    etagere_numero?: number;
    statut: string;
    description?: string;
    localisation?: string;
    taux_remplissage?: number;
}

export interface BoitierCreate {
    idboit: string;
    code_barre: string;
    titre: string;
    capacite: number;
    armoire?: string;
    etagere?: string;
    statut: string;
    description?: string;
}

export interface BoitierUpdate extends Partial<BoitierCreate> {
    id: string;
}