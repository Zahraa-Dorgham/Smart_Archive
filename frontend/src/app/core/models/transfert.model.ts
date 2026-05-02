import { BaseModel } from './base.model';

export interface TransfertBoitierDetail {
    id: number;
    idboit: string;
    titre: string;
    code_barre?: string | null;
}

export interface BlockingTransferDocument {
    id: number;
    idDoc: string;
    reference?: string | null;
    titre: string;
    date_pass_intermediaire?: string | null;
    date_pass_final?: string | null;
}

export interface BlockingTransferDossier {
    idDossier: number;
    nomDos?: string | null;
    date_pass_intermediaire?: string | null;
    date_pass_final?: string | null;
    documents: BlockingTransferDocument[];
}

export interface BlockingTransferBoitier {
    id: number;
    idboit: string;
    titre: string;
    dossiers: BlockingTransferDossier[];
}

export interface BlockingTransferPayload {
    message: string;
    transfer_type: string;
    date_field: 'date_pass_intermediaire' | 'date_pass_final';
    today: string;
    boitiers: BlockingTransferBoitier[];
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
