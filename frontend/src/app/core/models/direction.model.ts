// core/models/direction.model.ts
import { BaseModel } from './base.model';

export interface Direction extends BaseModel {
    nom: string;
    code?: string;
}

export interface DirectionCreate {
    nom: string;
    code?: string;
}

export interface DirectionUpdate extends Partial<DirectionCreate> {
}
