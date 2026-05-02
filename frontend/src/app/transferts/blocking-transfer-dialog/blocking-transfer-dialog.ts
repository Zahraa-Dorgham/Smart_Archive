import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { BlockingTransferPayload } from '../../core/models/transfert.model';

@Component({
  selector: 'app-blocking-transfer-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './blocking-transfer-dialog.html',
  styleUrls: ['./blocking-transfer-dialog.css']
})
export class BlockingTransferDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: BlockingTransferPayload) {}

  getDialogTitle(): string {
    return this.data.transfer_type === 'FINAL'
      ? 'Transfert final bloque'
      : 'Transfert intermediaire bloque';
  }

  getDateValue(item: { date_pass_intermediaire?: string | null; date_pass_final?: string | null }): string {
    const value = this.data.date_field === 'date_pass_final'
      ? item.date_pass_final
      : item.date_pass_intermediaire;

    return value || 'Non renseignee';
  }
}
