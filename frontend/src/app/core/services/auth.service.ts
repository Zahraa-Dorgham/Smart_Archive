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
        groups?: any[];
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
    private authInitialized = false;

    constructor(private http: HttpClient, private router: Router) {
        // Initialize auth on service creation
        this.loadStoredUser();
    }

    initializeAuth(): void {
        this.loadStoredUser();
        this.authInitialized = true;
    }

    private loadStoredUser(): void {
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem('user');
            if (user) {
                try {
                    this.currentUserSubject.next(JSON.parse(user));
                } catch (e) {
                    console.error('Failed to parse stored user', e);
                    localStorage.removeItem('user');
                }
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

    getCurrentUser(): any {
        return this.currentUserSubject.value;
    }

    isLoggedIn(): boolean {
        const token = this.getToken();
        return !!token;
    }

    getUserRoles(): string[] {
        const user = this.currentUserSubject.value;
        let roles = user?.roles || [];
        
        // Handle both roles and groups from backend
        if (!roles || roles.length === 0) {
            const groups = user?.groups || [];
            if (Array.isArray(groups)) {
                roles = groups.map((g: any) => typeof g === 'object' ? g.name : g);
            }
        }
        
        return roles;
    }

    hasRole(roles: string | string[]): boolean {
        const userRoles = this.getUserRoles();
        if (Array.isArray(roles)) {
            return roles.some(role => userRoles.includes(role));
        }
        return userRoles.includes(roles);
    }
}