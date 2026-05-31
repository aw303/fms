import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FleetApiService } from '../../services/fleet-api.service';

interface ReportMetric {
  name: string;
  value: string;
  delta: string;
  tone: 'success' | 'warning' | 'danger';
}

interface LaneMetric {
  lane: string;
  shipments: number;
  sla: string;
  cost: string;
}

@Component({
  selector: 'app-reports-page',
  imports: [CommonModule],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.scss'
})
export class ReportsPageComponent {
  readonly metrics: ReportMetric[] = [
    { name: 'Delivery SLA', value: '96.4%', delta: '+1.8%', tone: 'success' },
    { name: 'Avg Trip Duration', value: '38m', delta: '-3.2%', tone: 'success' },
    { name: 'Fuel Efficiency', value: '7.9 km/l', delta: '+0.6', tone: 'warning' },
    { name: 'Cost Per Shipment', value: '$22.1', delta: '-1.1', tone: 'success' }
  ];

  readonly lanes: LaneMetric[] = [
    { lane: 'Lahore to Islamabad', shipments: 316, sla: '97.8%', cost: '$18.40' },
    { lane: 'Karachi to Multan', shipments: 244, sla: '93.1%', cost: '$29.20' },
    { lane: 'Peshawar to Faisalabad', shipments: 186, sla: '95.4%', cost: '$24.70' },
    { lane: 'City Core Express', shipments: 402, sla: '98.2%', cost: '$12.10' }
  ];

  constructor(private readonly api: FleetApiService) {}

  async onDownload(): Promise<void> {
    try {
      const blob = await firstValueFrom(this.api.export('all'));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fleet-report-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      window.alert('Report downloaded successfully.');
    } catch {
      if (this.api.isAuthenticated()) {
        window.alert('Failed to download report.');
      }
    }
  }
}
