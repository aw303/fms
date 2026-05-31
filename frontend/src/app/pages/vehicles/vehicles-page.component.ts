import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FleetApiService } from '../../services/fleet-api.service';

interface Vehicle {
  id: string;
  type: string;
  mileage: string;
  fuel: string;
  health: 'Excellent' | 'Good' | 'Service Due';
  hub: string;
  odometer: string;
  nextService: string;
  utilization: number;
}

@Component({
  selector: 'app-vehicles-page',
  imports: [CommonModule],
  templateUrl: './vehicles-page.component.html',
  styleUrl: './vehicles-page.component.scss'
})
export class VehiclesPageComponent {
  readonly vehicles: Vehicle[] = [
    { id: 'TRK-219', type: 'Truck', mileage: '11,420 km', fuel: '78%', health: 'Excellent', hub: 'Lahore Hub', odometer: '118,420 km', nextService: 'Jun 12', utilization: 86 },
    { id: 'VAN-044', type: 'Van', mileage: '7,215 km', fuel: '52%', health: 'Good', hub: 'Airport Belt', odometer: '64,215 km', nextService: 'Jun 18', utilization: 62 },
    { id: 'TRK-118', type: 'Truck', mileage: '14,902 km', fuel: '33%', health: 'Service Due', hub: 'Karachi Port', odometer: '142,902 km', nextService: 'Today', utilization: 74 },
    { id: 'VAN-302', type: 'Van', mileage: '5,870 km', fuel: '69%', health: 'Excellent', hub: 'City Core', odometer: '45,870 km', nextService: 'Jul 02', utilization: 91 },
    { id: 'TRK-221', type: 'Reefer', mileage: '9,408 km', fuel: '64%', health: 'Good', hub: 'Cold Store 04', odometer: '98,408 km', nextService: 'Jun 24', utilization: 79 }
  ];

  constructor(private readonly api: FleetApiService) {}

  healthClass(health: Vehicle['health']): string {
    return health.toLowerCase().replace(/\s+/g, '-');
  }

  async onAddVehicle(): Promise<void> {
    try {
      const result = await firstValueFrom(this.api.logAction('add-vehicle', { source: 'vehicle-registry' }));
      window.alert(result.message);
    } catch {
      if (this.api.isAuthenticated()) {
        window.alert('Failed to run action.');
      }
    }
  }
}
