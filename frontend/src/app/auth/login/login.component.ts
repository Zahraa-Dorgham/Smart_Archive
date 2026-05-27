import { Component, OnInit, OnDestroy, Renderer2, ChangeDetectorRef } from '@angular/core';
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
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  hidePassword = true;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    this.renderer.addClass(document.body, 'login-page');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'login-page');
  }

  get credentials() {
    const { username, password } = this.loginForm.value;
    return { username, password };
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.loading = false;
        localStorage.setItem('access_token', res.access);
        localStorage.setItem('refresh_token', res.refresh);
            localStorage.setItem('user', JSON.stringify(res.user));
            // Store login timestamp for display in the topnav
            localStorage.setItem('login_date', new Date().toISOString());

        this.router.navigateByUrl(this.authService.getDashboardUrl());
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Identifiants invalides';
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }
}
