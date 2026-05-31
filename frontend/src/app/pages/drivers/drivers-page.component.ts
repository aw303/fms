import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { FleetApiService } from '../../services/fleet-api.service';

interface Driver {
  name: string;
  shift: string;
  rating: string;
  trips: number;
  status: 'Available' | 'On Trip' | 'Off Duty';
  license: string;
  compliance: string;
  hours: string;
  zone: string;
}

interface ShiftCoverage {
  label: string;
  drivers: number;
  coverage: number;
}

interface DriverFormModel {
  name: string;
  zone: string;
  shift: 'Morning' | 'Evening' | 'Night';
  license: string;
  status: Driver['status'];
}

@Component({
  selector: 'app-drivers-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './drivers-page.component.html',
  styleUrl: './drivers-page.component.scss'
})
export class DriversPageComponent {
  drivers: Driver[] = [
    { name: 'Adeel Khan', shift: 'Morning', rating: '4.9', trips: 186, status: 'On Trip', license: 'HTV-2291', compliance: 'Valid', hours: '6h 20m', zone: 'North Hub' },
    { name: 'Sana Tariq', shift: 'Morning', rating: '4.8', trips: 144, status: 'Available', license: 'LTV-8142', compliance: 'Valid', hours: '2h 45m', zone: 'Airport Belt' },
    { name: 'Mubashir Ali', shift: 'Evening', rating: '4.7', trips: 203, status: 'On Trip', license: 'HTV-7712', compliance: 'Review', hours: '7h 50m', zone: 'Industrial East' },
    { name: 'Hira Noman', shift: 'Night', rating: '4.9', trips: 119, status: 'Off Duty', license: 'LTV-4209', compliance: 'Valid', hours: '0h', zone: 'City Core' },
    { name: 'Rehan Qureshi', shift: 'Evening', rating: '4.6', trips: 165, status: 'Available', license: 'HTV-3368', compliance: 'Expiring', hours: '3h 15m', zone: 'North Hub' }
  ];

  readonly coverage: ShiftCoverage[] = [
    { label: 'Morning', drivers: 48, coverage: 94 },
    { label: 'Evening', drivers: 39, coverage: 82 },
    { label: 'Night', drivers: 22, coverage: 68 }
  ];

  isAddDriverModalOpen = false;
  isSubmitting = false;

  driverForm: DriverFormModel = {
    name: '',
    zone: '',
    shift: 'Morning',
    license: '',
    status: 'Available',
  };

  constructor(private readonly api: FleetApiService) {}

  statusClass(status: Driver['status']): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  onAddDriver(): void {
    this.driverForm = {
      name: '',
      zone: '',
      shift: 'Morning',
      license: '',
      status: 'Available',
    };
    this.isAddDriverModalOpen = true;
  }

  onCloseAddDriverModal(): void {
    this.isAddDriverModalOpen = false;
    this.isSubmitting = false;
  }

  async onSubmitAddDriver(): Promise<void> {
    if (!this.driverForm.name.trim() || !this.driverForm.zone.trim() || !this.driverForm.license.trim()) {
      window.alert('Name, zone, and license are required.');
      return;
    }

    this.isSubmitting = true;

    try {
      await firstValueFrom(this.api.logAction('add-driver', { ...this.driverForm }));

      this.drivers = [
        {
          name: this.driverForm.name.trim(),
          zone: this.driverForm.zone.trim(),
          shift: this.driverForm.shift,
          license: this.driverForm.license.trim(),
          status: this.driverForm.status,
          rating: '5.0',
          trips: 0,
          compliance: 'Valid',
          hours: '0h 00m',
        },
        ...this.drivers,
      ];

      this.onCloseAddDriverModal();
      window.alert('Driver added successfully.');
    } catch {
      this.isSubmitting = false;
      if (this.api.isAuthenticated()) {
        window.alert('Failed to add driver. You may not have permission.');
      }
    }
  }
}
