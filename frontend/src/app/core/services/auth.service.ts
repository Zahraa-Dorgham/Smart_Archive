import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface AuthResponse {
    access: string;
    refresh: string;
    user: {
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        roles: string[];
        is_staff: boolean;
        is_superuser: boolean;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = environment.apiUrl;
    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient, private router: Router) { }

    private loadStoredUser(): void {
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem('user');
            if (user) {
                this.currentUserSubject.next(JSON.parse(user));
            }
        }
    }

    login(credentials: LoginCredentials): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login/`, credentials).pipe(
            tap(response => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('access_token', response.access);
                    localStorage.setItem('refresh_token', response.refresh);
                    localStorage.setItem('user', JSON.stringify(response.user));
                }
                this.currentUserSubject.next(response.user);
            })
        );
    }


    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);   // ← redirection vers login
    }
    getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('access_token');
        }
        return null;
    }

    isLoggedIn(): boolean {
  const token = this.getToken();
  console.log('isLoggedIn() called, token:', token);
  return !!token;
}

    getUserRoles(): string[] {
        const user = this.currentUserSubject.value;
        return user?.roles || [];
    }

    hasRole(role: string | string[]): boolean {
        const roles = this.getUserRoles();
        if (Array.isArray(role)) {
            return role.some(r => roles.includes(r));
        }
        return roles.includes(role);
    }
}