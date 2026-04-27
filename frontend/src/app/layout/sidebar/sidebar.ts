import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements AfterViewInit {
  constructor(public authService: AuthService) {}

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
