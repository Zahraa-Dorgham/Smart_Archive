import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-4">
        <h3>Role Form</h3>
        <p>This page is a placeholder for creating/editing roles.</p>
        <button class="btn btn-secondary" routerLink="/admin/roles">Back</button>
    </div>
  `
})
export class RoleFormComponent {
}
