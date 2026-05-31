import { Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { LiveTrackingPageComponent } from './pages/live-tracking/live-tracking-page.component';
import { DriversPageComponent } from './pages/drivers/drivers-page.component';
import { VehiclesPageComponent } from './pages/vehicles/vehicles-page.component';
import { InvoicesPageComponent } from './pages/invoices/invoices-page.component';
import { ReportsPageComponent } from './pages/reports/reports-page.component';
import { DispatchesPageComponent } from './pages/dispatches/dispatches-page.component';
import { MaintenancePageComponent } from './pages/maintenance/maintenance-page.component';
import { CustomersPageComponent } from './pages/customers/customers-page.component';
import { SettingsPageComponent } from './pages/settings/settings-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  { path: 'overview', component: DashboardPageComponent, data: { title: 'Fleet Operations Overview' } },
  { path: 'dashboard', redirectTo: 'overview' },
  { path: 'live-tracking', component: LiveTrackingPageComponent, data: { title: 'Live Tracking' } },
  { path: 'dispatches', component: DispatchesPageComponent, data: { title: 'Dispatch Management' } },
  { path: 'drivers', component: DriversPageComponent, data: { title: 'Driver Control' } },
  { path: 'vehicles', component: VehiclesPageComponent, data: { title: 'Fleet Inventory' } },
  { path: 'maintenance', component: MaintenancePageComponent, data: { title: 'Maintenance Planner' } },
  { path: 'customers', component: CustomersPageComponent, data: { title: 'Customer Accounts' } },
  { path: 'invoices', component: InvoicesPageComponent, data: { title: 'Invoices & Billing' } },
  { path: 'reports', component: ReportsPageComponent, data: { title: 'Reports & Analytics' } },
  { path: 'settings', component: SettingsPageComponent, data: { title: 'Workspace Settings' } },
  { path: '**', redirectTo: 'overview' }
];
