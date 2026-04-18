// core/models/batiment.model.ts
import { BaseModel } from './base.model'; // si vous avez un modèle de base
import { Salle } from './salle.model';

export interface Batiment extends BaseModel {
    nom: string;
    code?: string;
    adresse: string;
    description?: string;
    ville?: string;
    pays?: string;
    nombre_salles?: number;
    salles?: Array<Salle | string>;
}

export interface BatimentCreate {
    nom: string;
    code?: string;
    adresse: string;
    description?: string;
    ville?: string;
}

export interface BatimentUpdate extends Partial<BatimentCreate> {
    id: string;
}

// Si vous utilisez la pagination
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}