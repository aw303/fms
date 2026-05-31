import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FleetApiService } from '../../services/fleet-api.service';

interface Invoice {
  ref: string;
  client: string;
  amount: string;
  due: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  trips: number;
  owner: string;
}

@Component({
  selector: 'app-invoices-page',
  imports: [CommonModule],
  templateUrl: './invoices-page.component.html',
  styleUrl: './invoices-page.component.scss'
})
export class InvoicesPageComponent {
  readonly invoices: Invoice[] = [
    { ref: 'INV-9021', client: 'Nexus Retail', amount: '$12,480', due: 'Jun 03', status: 'Pending', trips: 18, owner: 'Faraz' },
    { ref: 'INV-8993', client: 'Delta Foods', amount: '$8,210', due: 'May 28', status: 'Paid', trips: 11, owner: 'Mariam' },
    { ref: 'INV-8960', client: 'Orbit Pharma', amount: '$15,740', due: 'May 25', status: 'Overdue', trips: 22, owner: 'Nadia' },
    { ref: 'INV-8917', client: 'Metro Mart', amount: '$6,330', due: 'Jun 05', status: 'Pending', trips: 9, owner: 'Bilal' }
  ];

  constructor(private readonly api: FleetApiService) {}

  statusClass(status: Invoice['status']): string {
    return status.toLowerCase();
  }

  async onSyncFinance(): Promise<void> {
    await this.runAction('sync-finance', { source: 'invoices-page' });
  }

  async onCreateInvoice(): Promise<void> {
    await this.runAction('create-invoice', { source: 'invoices-page' });
  }

  private async runAction(action: string, payload: Record<string, unknown>): Promise<void> {
    try {
      const result = await firstValueFrom(this.api.logAction(action, payload));
      window.alert(result.message);
    } catch {
      if (this.api.isAuthenticated()) {
        window.alert('Failed to run action.');
      }
    }
  }
}
