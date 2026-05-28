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
  showResend = false;
  resending = false;

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
    this.showResend = false;

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.loading = false;
        localStorage.setItem('access_token', res.access);
        localStorage.setItem('refresh_token', res.refresh);
        localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('login_date', new Date().toISOString());

        this.router.navigateByUrl(this.authService.getDashboardUrl());
      },
      error: (err) => {
        this.loading = false;
        console.group("Analyse Erreur Login");
        console.log("Status:", err.status);
        console.log("Corps de l'erreur:", err.error);
        
        let msg = 'Identifiants invalides';
        let fullErrorString = JSON.stringify(err.error || {}).toLowerCase();

        if (err.error?.detail) {
          msg = err.error.detail;
        } else if (typeof err.error === 'string') {
          msg = err.error;
        } else if (err.error && typeof err.error === 'object') {
          // Extraire le premier message d'erreur trouvé dans l'objet
          const firstKey = Object.keys(err.error)[0];
          const firstVal = err.error[firstKey];
          msg = Array.isArray(firstVal) ? firstVal[0] : firstVal;
        }

        this.errorMessage = msg;
        // Détection robuste : on cherche "verifie" partout dans l'objet d'erreur
        this.showResend = fullErrorString.includes('verifie') || fullErrorString.includes('vérifié');
        
        console.log("Message affiché:", msg);
        console.log("Bouton Renvoyer visible:", this.showResend);
        console.groupEnd();

        this.cdr.detectChanges();
      }
    });
  }

  resendVerification() {
    const email = this.loginForm.get('username')?.value;
    if (!email || !email.includes('@')) {
      this.errorMessage = "Impossible de renvoyer le lien : format d'email invalide.";
      return;
    }

    this.resending = true;
    this.authService.resendVerification(email).subscribe({
      next: (res) => {
        this.resending = false;
        this.errorMessage = "Le lien de vérification a été renvoyé à " + email;
        this.showResend = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.resending = false;
        this.errorMessage = "Erreur lors de l'envoi du lien.";
        this.cdr.detectChanges();
      }
    });
  }
}
