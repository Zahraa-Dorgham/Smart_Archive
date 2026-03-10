// core/models/salle.model.ts
import { BaseModel } from './base.model';
import { Batiment } from './batiment.model';

export interface Salle extends BaseModel {
    nom: string;
    code: string;
    batiment: Batiment | string;
    batiment_details?: Batiment;
    type_salle: string;
    etage: number;
    description?: string;
    // autres champs
}

export interface SalleCreate {
    nom: string;
    code: string;
    batiment: string;
    type_salle: string;
    etage: number;
    description?: string;
}

export interface SalleUpdate extends Partial<SalleCreate> {
    id: string;
}