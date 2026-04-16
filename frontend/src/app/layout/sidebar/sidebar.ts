import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  standalone: true
})
export class Sidebar implements AfterViewInit {
  constructor(public authService: AuthService) {}

  ngAfterViewInit() {
    // Trigger Frest menu initialization after view is ready
    setTimeout(() => {
      const $ = (window as any).$;
      if ($ && $.app && $.app.menu) {
        $.app.menu.init();
      }
      if ($ && $.app && $.app.nav) {
        $.app.nav.init();
      }
    }, 100);
  }
}
