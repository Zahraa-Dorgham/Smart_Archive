import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatFormFieldModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  get credentials() {
    const { username, password } = this.loginForm.value;
    return { username, password };
  }

  onSubmit() {
    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        // Stocker le token (ex: localStorage)
        localStorage.setItem('access_token', res.access);
        localStorage.setItem('refresh_token', res.refresh);
        // Stocker les infos utilisateur (pour les rôles)
        localStorage.setItem('user', JSON.stringify(res.user));

        // Redirection selon le rôle
        const roles = res.user?.roles || [];
        if (roles.includes('Administrateur')) {
          this.router.navigate(['/admin/users']);
        } else if (roles.includes('Archiviste')) {
          this.router.navigate(['/archiviste/batiments']);
        } else if (roles.includes('Responsable')) {
          this.router.navigate(['/responsable/transferts']);
        } else {
          this.router.navigate(['/employe/recherche']);
        }
      },
      error: (err) => console.error(err)
    });
  }

  socialSignIn() {
    console.log('Social sign-in clicked - implement OAuth flow');
  }
}