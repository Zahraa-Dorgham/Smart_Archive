import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements AfterViewInit, OnDestroy {
  private routerSubscription: Subscription | undefined;

  constructor(public authService: AuthService, private router: Router) {
    // Re-initialize Frest menu on every navigation event to keep UI and JS in sync
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.reinitMenu();
    });
  }

  ngAfterViewInit() {
    this.reinitMenu();
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private reinitMenu() {
    // Trigger Frest menu initialization after view is ready/route changed
    setTimeout(() => {
      const $ = (window as any).$;
      if ($ && $.app && $.app.menu) {
        $.app.menu.init();
      }
      if ($ && $.app && $.app.nav) {
        $.app.nav.init();
      }
    }, 200);
  }
}
