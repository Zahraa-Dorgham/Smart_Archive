// core/models/batiment.model.ts
import { BaseModel } from './base.model'; // si vous avez un modèle de base

export interface Batiment extends BaseModel {
    nom: string;
    adresse: string;
    description?: string;
    
    ville?: string;
    pays?: string;
    
    
    nombre_salles?: number; 
}

export interface BatimentCreate {
    nom: string;
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