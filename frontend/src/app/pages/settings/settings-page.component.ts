import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface SettingRow {
  name: string;
  description: string;
  status: 'Enabled' | 'Review' | 'Disabled';
}

@Component({
  selector: 'app-settings-page',
  imports: [CommonModule],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss'
})
export class SettingsPageComponent {
  readonly settings: SettingRow[] = [
    { name: 'Role-based access', description: 'Admin, dispatcher, finance, and maintenance permissions.', status: 'Enabled' },
    { name: 'SLA alerts', description: 'Notify dispatchers when delivery confidence drops.', status: 'Enabled' },
    { name: 'Finance integration', description: 'Sync invoices and payment status to accounting.', status: 'Review' },
    { name: 'Customer portal', description: 'Expose shipment tracking and proof of delivery.', status: 'Disabled' }
  ];

  statusClass(status: SettingRow['status']): string {
    const map: Record<SettingRow['status'], string> = {
      Enabled: 'success',
      Review: 'warning',
      Disabled: 'neutral'
    };

    return map[status];
  }
}
