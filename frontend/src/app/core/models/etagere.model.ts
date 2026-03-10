import { Armoire } from './armoire.model';
import { BaseModel } from './base.model';

export interface Etagere extends BaseModel {
    armoire: Armoire | string;      // Peut être un objet Armoire ou un ID
    armoire_code?: string;           // Optionnel, si le sérialiseur backend le fournit
    numero: number;
    code_barres?: string;
    capacite_max_boites: number;
    occupation_actuelle: number;
    description?: string;
}

export interface EtagereCreate {
    armoire: string;
    numero: number;
    code_barres?: string;
    capacite_max_boites: number;
    occupation_actuelle: number;
    description?: string;
}

export interface EtagereUpdate extends Partial<EtagereCreate> {
    id: string;
}