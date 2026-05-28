import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements AfterViewInit, OnInit {
  isEmplacementOpen = false;

  constructor(public authService: AuthService, private router: Router) {
    // Écouter les changements de route pour garder le menu ouvert si un enfant est actif
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkActiveRoute(event.urlAfterRedirects);
      this.refreshMenu(); // Re-initialiser le JS du theme
    });
  }

  ngOnInit() {
    this.checkActiveRoute(this.router.url);
  }

  get dashboardLink(): string {
    return this.authService.getDashboardUrl();
  }

  get menuHeader(): string {
    if (this.authService.hasRole('Administrateur')) {
      return 'Administrateur';
    }
    if (this.authService.hasRole('Archiviste')) {
      return 'Gestion Archives';
    }
    return 'Menu';
  }

  private checkActiveRoute(url: string) {
    const childRoutes = ['/archiviste/batiments', '/archiviste/salles', '/archiviste/armoires', '/archiviste/etageres', '/archiviste/boitiers'];
    if (childRoutes.some(route => url.includes(route))) {
      this.isEmplacementOpen = true;
    } else {
      this.isEmplacementOpen = false;
    }
  }

  toggleEmplacement(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.isEmplacementOpen = !this.isEmplacementOpen;
  }

  ngAfterViewInit() {
    this.refreshMenu();
  }

  private refreshMenu() {
    // Initial delay to let DOM settle
    setTimeout(() => {
      this.reinitFrest();
    }, 200);
  }

  private reinitFrest() {
    const $ = (window as any).$;
    if ($ && $.app && $.app.menu) {
      // Re-initialize menu only if needed to avoid flickering and fighting with toggle
      $.app.menu.init(false); 
    }
    if ($ && $.app && $.app.nav) {
      $.app.nav.init();
    }
  }
}
