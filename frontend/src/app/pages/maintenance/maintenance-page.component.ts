import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FleetApiService } from '../../services/fleet-api.service';

interface WorkOrder {
  id: string;
  vehicle: string;
  issue: string;
  bay: string;
  due: string;
  cost: string;
  status: 'Scheduled' | 'Critical' | 'Completed';
}

@Component({
  selector: 'app-maintenance-page',
  imports: [CommonModule],
  templateUrl: './maintenance-page.component.html',
  styleUrl: './maintenance-page.component.scss'
})
export class MaintenancePageComponent {
  readonly workOrders: WorkOrder[] = [
    { id: 'WO-7781', vehicle: 'TRK-118', issue: 'Brake inspection and coolant sensor', bay: 'Bay 2', due: 'Today', cost: '$640', status: 'Critical' },
    { id: 'WO-7769', vehicle: 'VAN-044', issue: 'Tire rotation', bay: 'Bay 1', due: 'Jun 03', cost: '$180', status: 'Scheduled' },
    { id: 'WO-7758', vehicle: 'TRK-221', issue: 'Reefer calibration', bay: 'Bay 4', due: 'Jun 05', cost: '$420', status: 'Scheduled' },
    { id: 'WO-7734', vehicle: 'VAN-302', issue: 'Oil service', bay: 'Bay 3', due: 'May 30', cost: '$120', status: 'Completed' }
  ];

  constructor(private readonly api: FleetApiService) {}

  statusClass(status: WorkOrder['status']): string {
    return status.toLowerCase();
  }

  async onCreateWorkOrder(): Promise<void> {
    try {
      const result = await firstValueFrom(this.api.logAction('create-work-order', { source: 'maintenance-work-orders' }));
      window.alert(result.message);
    } catch {
      if (this.api.isAuthenticated()) {
        window.alert('Failed to run action.');
      }
    }
  }
}
