// core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    // Check if token exists in localStorage
    const token = authService.getToken();
    const isLoggedIn = !!token;
    
    if (isLoggedIn) {
        // Reload user data from storage to ensure currentUser$ is populated
        authService.initializeAuth();
        return true;
    }
    
    // Clear any stale data
    localStorage.removeItem('user');
    return router.parseUrl('/login');
};