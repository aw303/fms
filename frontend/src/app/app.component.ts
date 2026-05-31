import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

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
export class AppComponent {
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

  constructor(private readonly router: Router) {}

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
}
