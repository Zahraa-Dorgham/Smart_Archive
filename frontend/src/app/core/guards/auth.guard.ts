// core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const isLoggedIn = authService.isLoggedIn();
    console.log('authGuard - isLoggedIn:', isLoggedIn, 'pour route:', router.url);
    if (isLoggedIn) {
        return true;
    }
    return router.parseUrl('/login');
};