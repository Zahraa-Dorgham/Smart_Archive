// core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take, Observable } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    let authReq = req;
    const isMalformedToken = token === 'undefined' || token === 'null';
    
    if (token && !isMalformedToken && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
        authReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
                return handle401Error(authService, authReq, next);
            }
            return throwError(() => error);
        })
    );
};

const handle401Error = (authService: any, req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
    if (!isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(null);

        return authService.refreshToken().pipe(
            switchMap((token: any) => {
                isRefreshing = false;
                const access = token.access;
                refreshTokenSubject.next(access);
                return next(req.clone({
                    headers: req.headers.set('Authorization', `Bearer ${access}`)
                }));
            }),
            catchError((err) => {
                isRefreshing = false;
                authService.logout();
                return throwError(() => err);
            })
        );
    } else {
        return refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap((token) => {
                return next(req.clone({
                    headers: req.headers.set('Authorization', `Bearer ${token}`)
                }));
            })
        );
    }
};