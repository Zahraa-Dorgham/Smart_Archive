import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]) => {
    return () => {
        const authService = inject(AuthService);
        const router = inject(Router);

        if (authService.hasRole(allowedRoles)) {
            return true;
        }
        return router.parseUrl('/');
    };
};
