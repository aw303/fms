import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface CustomerAccount {
  name: string;
  tier: string;
  lanes: number;
  monthlySpend: string;
  sla: string;
  owner: string;
  status: 'Low' | 'Medium' | 'High';
}

@Component({
  selector: 'app-customers-page',
  imports: [CommonModule],
  templateUrl: './customers-page.component.html',
  styleUrl: './customers-page.component.scss'
})
export class CustomersPageComponent {
  readonly customers: CustomerAccount[] = [
    { name: 'Orbit Pharma', tier: 'Enterprise', lanes: 18, monthlySpend: '$92.4K', sla: '98.5%', owner: 'Nadia', status: 'High' },
    { name: 'Nexus Retail', tier: 'Growth', lanes: 12, monthlySpend: '$48.8K', sla: '96.1%', owner: 'Faraz', status: 'Low' },
    { name: 'Delta Foods', tier: 'Enterprise', lanes: 15, monthlySpend: '$63.2K', sla: '94.8%', owner: 'Mariam', status: 'Medium' },
    { name: 'Metro Mart', tier: 'Standard', lanes: 9, monthlySpend: '$24.6K', sla: '95.7%', owner: 'Bilal', status: 'Low' }
  ];

  riskClass(status: CustomerAccount['status']): string {
    return status.toLowerCase();
  }
}
