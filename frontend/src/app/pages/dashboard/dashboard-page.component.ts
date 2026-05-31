import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FleetApiService } from '../../services/fleet-api.service';

interface KpiCard {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  note: string;
}

interface DriverStatus {
  name: string;
  vehicle: string;
  zone: string;
  eta: string;
  state: 'On Route' | 'Loading' | 'Delayed';
}

interface WorkQueueItem {
  ref: string;
  account: string;
  lane: string;
  owner: string;
  priority: 'Low' | 'Medium' | 'High';
}

interface HubCapacity {
  hub: string;
  docked: number;
  capacity: number;
  dwell: string;
}

interface ExceptionItem {
  title: string;
  detail: string;
  severity: 'warning' | 'danger' | 'success';
}

@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
  readonly kpis: KpiCard[] = [
    { label: 'Active Vehicles', value: '184', trend: '+12 today', trendUp: true, note: '74% utilization' },
    { label: 'Trips In Progress', value: '67', trend: '+8.6%', trendUp: true, note: '31 long-haul routes' },
    { label: 'Delayed Deliveries', value: '09', trend: '-2.1%', trendUp: true, note: '4 need dispatch action' },
    { label: 'Daily Margin', value: '$31.8K', trend: '+6.4%', trendUp: true, note: 'after fuel and tolls' }
  ];

  readonly driverStatus: DriverStatus[] = [
    { name: 'A. Khan', vehicle: 'TRK-219', zone: 'North Hub', eta: '14 min', state: 'On Route' },
    { name: 'S. Ahmed', vehicle: 'VAN-044', zone: 'Airport Belt', eta: '32 min', state: 'Loading' },
    { name: 'I. Malik', vehicle: 'TRK-118', zone: 'Industrial East', eta: '48 min', state: 'Delayed' },
    { name: 'R. Fatima', vehicle: 'VAN-302', zone: 'City Core', eta: '11 min', state: 'On Route' }
  ];

  readonly workQueue: WorkQueueItem[] = [
    { ref: 'DSP-4182', account: 'Orbit Pharma', lane: 'Karachi Port to Multan Yard', owner: 'Imran', priority: 'High' },
    { ref: 'DSP-4179', account: 'Nexus Retail', lane: 'Lahore Hub to Islamabad DC', owner: 'Sana', priority: 'Medium' },
    { ref: 'DSP-4176', account: 'Metro Mart', lane: 'Faisalabad Node to City Core', owner: 'Adeel', priority: 'Low' },
    { ref: 'DSP-4171', account: 'Delta Foods', lane: 'Cold Chain North Loop', owner: 'Hira', priority: 'High' }
  ];

  readonly hubCapacity: HubCapacity[] = [
    { hub: 'Lahore Hub', docked: 38, capacity: 52, dwell: '22m avg dwell' },
    { hub: 'Karachi Port', docked: 46, capacity: 60, dwell: '41m avg dwell' },
    { hub: 'Islamabad DC', docked: 21, capacity: 36, dwell: '18m avg dwell' }
  ];

  readonly exceptions: ExceptionItem[] = [
    { title: 'Cold chain probe offline', detail: 'TRK-118 has not reported temperature for 17 minutes.', severity: 'danger' },
    { title: 'Customs document pending', detail: 'Route R-237 needs signed gate pass before 14:30.', severity: 'warning' },
    { title: 'SLA recovery complete', detail: 'Three delayed stops returned inside delivery window.', severity: 'success' }
  ];

  constructor(private readonly api: FleetApiService) {}

  statusClass(state: DriverStatus['state']): string {
    return state.toLowerCase().replace(/\s+/g, '-');
  }

  priorityClass(priority: WorkQueueItem['priority']): string {
    return priority.toLowerCase();
  }

  capacityPercent(item: HubCapacity): number {
    return Math.round((item.docked / item.capacity) * 100);
  }

  async onAssign(): Promise<void> {
    await this.runAction('assign-driver', { source: 'dashboard-watchlist' });
  }

  async onPlanLoads(): Promise<void> {
    await this.runAction('plan-loads', { source: 'dashboard-queue' });
  }

  private async runAction(action: string, payload: Record<string, unknown>): Promise<void> {
    try {
      const result = await firstValueFrom(this.api.logAction(action, payload));
      window.alert(result.message);
    } catch {
      if (this.api.isAuthenticated()) {
        window.alert('Action failed.');
      }
    }
  }
}
