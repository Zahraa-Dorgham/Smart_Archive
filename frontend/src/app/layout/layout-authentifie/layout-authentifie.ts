import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, Header, Sidebar, Footer],
  templateUrl: './layout-authentifie.html',
  styleUrls: ['./layout-authentifie.css']
})
export class LayoutComponent implements OnInit, OnDestroy {
  constructor(public authService: AuthService, private router: Router, private renderer: Renderer2) { }

  ngOnInit() {
    this.renderer.addClass(document.body, 'vertical-layout');
    this.renderer.addClass(document.body, 'vertical-menu-modern');
    this.renderer.addClass(document.body, 'semi-dark-layout');
    this.renderer.addClass(document.body, '2-columns');
    this.renderer.addClass(document.body, 'navbar-sticky');
    this.renderer.addClass(document.body, 'footer-static');
    this.renderer.setAttribute(document.body, 'data-open', 'click');
    this.renderer.setAttribute(document.body, 'data-menu', 'vertical-menu-modern');
    this.renderer.setAttribute(document.body, 'data-col', '2-columns');
    this.renderer.setAttribute(document.body, 'data-layout', 'semi-dark-layout');
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'vertical-layout');
    this.renderer.removeClass(document.body, 'vertical-menu-modern');
    this.renderer.removeClass(document.body, 'semi-dark-layout');
    this.renderer.removeClass(document.body, '2-columns');
    this.renderer.removeClass(document.body, 'navbar-sticky');
    this.renderer.removeClass(document.body, 'footer-static');
    this.renderer.removeAttribute(document.body, 'data-open');
    this.renderer.removeAttribute(document.body, 'data-menu');
    this.renderer.removeAttribute(document.body, 'data-col');
    this.renderer.removeAttribute(document.body, 'data-layout');
  }

  logout(): void {
    this.authService.logout();
  }
}