// core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Check if token exists
    const token = authService.getToken();
    if (!token) {
        return router.parseUrl('/login');
    }

    // Ensure user data is loaded from storage
    authService.initializeAuth();

    // Check if user data exists
    const user = authService.getCurrentUser();
    if (user) {
        return true;
    }

    // If we have a token but no user data, try to load it
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const userData = JSON.parse(storedUser);
            // Manually set the user data
            (authService as any).currentUserSubject.next(userData);
            return true;
        } catch (e) {
            console.error('Failed to parse stored user', e);
        }
    }

    // Clear invalid data and redirect to login
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    return router.parseUrl('/login');
};