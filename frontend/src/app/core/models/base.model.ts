// core/models/base.model.ts
export interface BaseModel {
    id: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}