import { Armoire } from './armoire.model';
import { Etagere } from './etagere.model';
import { BaseModel } from './base.model';

export interface Boitier extends BaseModel {
    idboit: string;
    code_barre: string;
    titre: string;
    capacite: number;
    armoire?: Armoire | string;
    etagere?: Etagere | string;
    statut: string;
    description?: string;
    taux_remplissage?: number; // calculé côté backend
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