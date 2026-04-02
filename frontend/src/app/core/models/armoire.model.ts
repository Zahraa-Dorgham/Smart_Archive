import { Salle } from './salle.model';
import { BaseModel } from './base.model';


export interface Armoire extends BaseModel {
    code: string;
    // type_armoire: string;
    salle: Salle | string;
    salle_nom?: Salle;
    code_barres?: string;
    description?: string;
    date_installation?: Date;
}

export interface ArmoireCreate {
    code: string;
    // type_armoire: string;
    salle: string;
    code_barres?: string;
    description?: string;
    date_installation?: Date;
}

export interface ArmoireUpdate extends Partial<ArmoireCreate> {
    id: string;
}