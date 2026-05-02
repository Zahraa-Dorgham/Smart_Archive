import { BaseModel } from './base.model';

export interface TransfertBoitierDetail {
    id: number;
    idboit: string;
    titre: string;
    code_barre?: string | null;
}

export interface Transfert extends BaseModel {
    reference?: string | null;
    bordereauxReference?: string | null;
    typeTransfer: string;
    date_demande?: string | Date | null;
    date_execution?: string | Date | null;
    statut: string;
    boitier_ids: number[];
    boitiers_detail?: TransfertBoitierDetail[];
}

export interface TransfertCreate {
    reference?: string | null;
    bordereauxReference?: string | null;
    typeTransfer: string;
    date_demande?: string | Date | null;
    date_execution?: string | Date | null;
    statut: string;
    boitier_ids: number[];
}

export interface TransfertUpdate extends Partial<TransfertCreate> {
    id: string;
}
