import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
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
    if (this.loginForm.invalid) return;
    
    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.loading = false;
        localStorage.setItem('access_token', res.access);
        localStorage.setItem('refresh_token', res.refresh);
        localStorage.setItem('user', JSON.stringify(res.user));

        const roles = (res.user?.roles || []).map((role: string) => role.toLowerCase());
        if (roles.includes('admin') || roles.includes('administrateur')) {
          this.router.navigate(['/admin/users']);
        } else if (roles.includes('archiviste')) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Identifiants invalides';
        console.error(err);
      }
    });
  }
}
