import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface ReportMetric {
  name: string;
  value: string;
  delta: string;
}

@Component({
  selector: 'app-reports-page',
  imports: [CommonModule],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.scss'
})
export class ReportsPageComponent {
  readonly metrics: ReportMetric[] = [
    { name: 'Delivery SLA', value: '96.4%', delta: '+1.8%' },
    { name: 'Avg Trip Duration', value: '38m', delta: '-3.2%' },
    { name: 'Fuel Efficiency', value: '7.9 km/l', delta: '+0.6' },
    { name: 'Cost Per Shipment', value: '$22.1', delta: '-1.1' }
  ];
}
