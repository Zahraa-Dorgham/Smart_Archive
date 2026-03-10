// core/services/loading.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LoadingService {
    private loadingSubject = new BehaviorSubject<boolean>(false);
    loading$ = this.loadingSubject.asObservable();

    private requestCount = 0;

    show(): void {
        this.requestCount++;
        if (this.requestCount === 1) {
            this.loadingSubject.next(true);
        }
    }

    hide(): void {
        this.requestCount--;
        if (this.requestCount === 0) {
            this.loadingSubject.next(false);
        }
    }
}