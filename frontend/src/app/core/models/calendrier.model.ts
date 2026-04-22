import { BaseModel } from './base.model';
import { Direction } from './direction.model';

export interface Calendrier extends BaseModel {
    code: string;
    title: string;
    description?: string;
    is_dossier?: boolean;
    parent?: string | null;
    exemplaire_type?: string | null;
    // FK primary key (number) is returned by default; nested object available as direction_detail
    direction?: number | null;
    direction_detail?: Direction | null;
    sous_direction_id?: string | null;
    unit_responsable?: string | null;
    conservation_active_period?: number | null;
    conservation_semi_active_period?: number | null;
    sort_final_type?: string | null;
    sort_final_comment?: string | null;
    sort_final_security_years?: number | null;
    remarques?: string | null;
    validation_archive?: boolean;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export type CalendrierCreate = Partial<Calendrier>;
export type CalendrierUpdate = Partial<Calendrier> & { id?: string };
