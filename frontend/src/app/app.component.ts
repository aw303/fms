import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FleetApiService } from './services/fleet-api.service';

interface NavItem {
  label: string;
  path: string;
  hint: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  readonly navItems: NavItem[] = [
    { label: 'Overview', path: '/overview', hint: 'Command center', icon: 'OV' },
    { label: 'Live Tracking', path: '/live-tracking', hint: 'Realtime map', icon: 'LT' },
    { label: 'Dispatches', path: '/dispatches', hint: 'Orders and trips', icon: 'DS' },
    { label: 'Drivers', path: '/drivers', hint: 'Crew status', icon: 'DR' },
    { label: 'Vehicles', path: '/vehicles', hint: 'Fleet health', icon: 'VH' },
    { label: 'Maintenance', path: '/maintenance', hint: 'Service work', icon: 'MT' },
    { label: 'Customers', path: '/customers', hint: 'Contracts and SLAs', icon: 'CU' },
    { label: 'Invoices', path: '/invoices', hint: 'Billing flow', icon: 'IN' },
    { label: 'Reports', path: '/reports', hint: 'Insights', icon: 'RP' },
    { label: 'Settings', path: '/settings', hint: 'Access and rules', icon: 'ST' }
  ];

  constructor(
    private readonly router: Router,
    private readonly api: FleetApiService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      await firstValueFrom(this.api.ensureDemoSession());
    } catch {
      window.alert('Authentication failed. Please verify backend auth is available.');
    }
  }

  get pageHeading(): string {
    const path = this.currentPath;
    const titles: Record<string, string> = {
      overview: 'Fleet Operations Overview',
      'live-tracking': 'Live Tracking',
      dispatches: 'Dispatch Management',
      drivers: 'Driver Control',
      vehicles: 'Fleet Inventory',
      maintenance: 'Maintenance Planner',
      customers: 'Customer Accounts',
      invoices: 'Invoices & Billing',
      reports: 'Reports & Analytics',
      settings: 'Workspace Settings'
    };

    return titles[path] ?? 'Fleet Operations Overview';
  }

  get pageCaption(): string {
    const path = this.currentPath;
    const captions: Record<string, string> = {
      overview: 'Today at a glance',
      'live-tracking': 'Dispatch Intelligence',
      dispatches: 'Load planning and execution',
      drivers: 'People & Schedules',
      vehicles: 'Assets & Maintenance',
      maintenance: 'Preventive service and repairs',
      customers: 'Contracts, lanes, and billing owners',
      invoices: 'Finance Operations',
      reports: 'Business Intelligence',
      settings: 'Roles, alerts, and operating policies'
    };

    return captions[path] ?? 'Today at a glance';
  }

  private get currentPath(): string {
    const path = this.router.url.split('?')[0].replace(/^\//, '') || 'overview';
    return path === 'dashboard' ? 'overview' : path;
  }

  async onExport(): Promise<void> {
    const scope = this.exportScope;

    try {
      const blob = await firstValueFrom(this.api.export(scope));
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `fleet-${scope}-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);

      window.alert('Export completed successfully.');
    } catch {
      window.alert('Export failed. Please verify the backend is running.');
    }
  }

  async onNewDispatch(): Promise<void> {
    const customer = window.prompt('Customer name', 'Orbit Pharma');
    if (!customer) {
      return;
    }

    const pickup = window.prompt('Pickup location', 'Karachi Port');
    if (!pickup) {
      return;
    }

    const dropoff = window.prompt('Dropoff location', 'Multan Yard');
    if (!dropoff) {
      return;
    }

    const vehicle = window.prompt('Vehicle', 'TRK-118');
    if (!vehicle) {
      return;
    }

    const planner = window.prompt('Planner', 'Imran');
    if (!planner) {
      return;
    }

    const windowLabel = window.prompt('Window', '13:00 - 16:00');
    if (!windowLabel) {
      return;
    }

    try {
      const result = await firstValueFrom(
        this.api.createDispatch({
          customer,
          pickup,
          dropoff,
          vehicle,
          planner,
          window: windowLabel,
          status: 'Scheduled',
        }),
      );

      await this.router.navigateByUrl('/dispatches');
      window.alert(`Dispatch ${result.code} created.`);
    } catch {
      window.alert('Failed to create dispatch. Please try again.');
    }
  }

  async onOpenAccountMenu(): Promise<void> {
    try {
      await firstValueFrom(this.api.logAction('open-account-menu', { page: this.currentPath }));
      window.alert('Account menu action logged.');
    } catch {
      window.alert('Unable to log account action.');
    }
  }

  private get exportScope(): 'all' | 'dispatches' | 'customers' | 'actions' {
    const current = this.currentPath;

    if (current === 'dispatches') {
      return 'dispatches';
    }

    if (current === 'customers') {
      return 'customers';
    }

    return 'all';
  }

  can(permission: string): boolean {
    return this.api.hasPermission(permission);
  }
}
