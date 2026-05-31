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
import { LoginPageComponent } from './pages/login/login-page.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginPageComponent },
  { path: 'overview', component: DashboardPageComponent, canActivate: [authGuard], data: { title: 'Fleet Operations Overview' } },
  { path: 'dashboard', redirectTo: 'overview' },
  { path: 'live-tracking', component: LiveTrackingPageComponent, canActivate: [authGuard], data: { title: 'Live Tracking' } },
  { path: 'dispatches', component: DispatchesPageComponent, canActivate: [authGuard], data: { title: 'Dispatch Management' } },
  { path: 'drivers', component: DriversPageComponent, canActivate: [authGuard], data: { title: 'Driver Control' } },
  { path: 'vehicles', component: VehiclesPageComponent, canActivate: [authGuard], data: { title: 'Fleet Inventory' } },
  { path: 'maintenance', component: MaintenancePageComponent, canActivate: [authGuard], data: { title: 'Maintenance Planner' } },
  { path: 'customers', component: CustomersPageComponent, canActivate: [authGuard], data: { title: 'Customer Accounts' } },
  { path: 'invoices', component: InvoicesPageComponent, canActivate: [authGuard], data: { title: 'Invoices & Billing' } },
  { path: 'reports', component: ReportsPageComponent, canActivate: [authGuard], data: { title: 'Reports & Analytics' } },
  { path: 'settings', component: SettingsPageComponent, canActivate: [authGuard], data: { title: 'Workspace Settings' } },
  { path: '**', redirectTo: 'login' }
];
