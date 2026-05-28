import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="verify-container">
      <div class="verify-card shadow-lg">
        <div class="logo-box">
          <i class="bx bxs-archive-in logo-icon"></i>
          <h2>InDA-ETAP</h2>
        </div>

        <div *ngIf="loading" class="state-box">
          <div class="spinner-border text-primary" role="status"></div>
          <p>Vérification de votre compte en cours...</p>
        </div>

        <div *ngIf="!loading && success" class="state-box success bounce-in">
          <i class="bx bx-check-circle icon-big"></i>
          <h3>Félicitations !</h3>
          <p>{{ message }}</p>
          <button routerLink="/login" class="btn btn-primary glow">Se connecter</button>
        </div>

        <div *ngIf="!loading && !success" class="state-box error shake-in">
          <i class="bx bx-x-circle icon-big"></i>
          <h3>Oups !</h3>
          <p>{{ message }}</p>
          <button routerLink="/login" class="btn btn-outline-primary">Retour à l'accueil</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verify-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #5a8dee 0%, #2c4ebf 100%);
      padding: 20px;
    }
    .verify-card {
      background: white;
      padding: 40px;
      border-radius: 12px;
      width: 100%;
      max-width: 450px;
      text-align: center;
    }
    .logo-box {
      margin-bottom: 30px;
    }
    .logo-icon {
      font-size: 3rem;
      color: #5a8dee;
    }
    .state-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    .icon-big {
      font-size: 5rem;
    }
    .success { color: #39da8a; }
    .error { color: #ff5b5c; }
    .btn-primary {
      background-color: #5a8dee;
      border: none;
      padding: 12px 30px;
      font-weight: 600;
      border-radius: 6px;
    }
    .bounce-in {
      animation: bounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes bounce {
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.05); }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class VerifyEmailComponent implements OnInit {
  loading = true;
  success = false;
  message = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.authService.verifyEmail(token).subscribe({
        next: (res) => {
          this.loading = false;
          this.success = true;
          this.message = res.message;
        },
        error: (err) => {
          this.loading = false;
          this.success = false;
          this.message = err.error?.error || 'Le lien de vérification est invalide ou a expiré.';
        }
      });
    } else {
      this.loading = false;
      this.success = false;
      this.message = 'Token de vérification manquant.';
    }
  }
}
