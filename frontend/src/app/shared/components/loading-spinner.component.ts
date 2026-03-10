// shared/components/loading-spinner.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-loading-spinner',
    standalone: true,
    imports: [CommonModule, MatProgressSpinnerModule],
    template: `
    <div class="spinner-overlay">
      <mat-spinner diameter="50"></mat-spinner>
    </div>
  `,
    styles: [`
    .spinner-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
  `]
})
export class LoadingSpinnerComponent { }