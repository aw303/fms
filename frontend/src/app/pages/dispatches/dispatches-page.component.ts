import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DispatchStatus, FleetApiService } from '../../services/fleet-api.service';

interface DispatchOrder {
  id: string;
  customer: string;
  pickup: string;
  dropoff: string;
  vehicle: string;
  planner: string;
  window: string;
  status: DispatchStatus;
}

interface BoardLane {
  title: string;
  count: number;
  orders: string[];
}

@Component({
  selector: 'app-dispatches-page',
  imports: [CommonModule],
  templateUrl: './dispatches-page.component.html',
  styleUrl: './dispatches-page.component.scss'
})
export class DispatchesPageComponent implements OnInit {
  orders: DispatchOrder[] = [];

  lanes: BoardLane[] = [
    { title: 'Unassigned', count: 0, orders: [] },
    { title: 'Planned', count: 0, orders: [] },
    { title: 'In Transit', count: 0, orders: [] },
    { title: 'Exceptions', count: 0, orders: [] }
  ];

  constructor(private readonly api: FleetApiService) {}

  async ngOnInit(): Promise<void> {
    await this.loadDispatches();
  }

  statusClass(status: DispatchOrder['status']): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  async onImportOrders(): Promise<void> {
    await this.runAction('import-orders', { source: 'dispatch-board' });
  }

  async onCreateDispatch(): Promise<void> {
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

    const windowLabel = window.prompt('Delivery window', '13:00 - 16:00');
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

      await this.loadDispatches();
      window.alert(`Dispatch ${result.code} created successfully.`);
    } catch {
      window.alert('Could not create dispatch.');
    }
  }

  async onFilter(): Promise<void> {
    await this.runAction('dispatch-filter', { mode: 'today' });
  }

  private async loadDispatches(): Promise<void> {
    try {
      const data = await firstValueFrom(this.api.listDispatches());
      this.orders = data.map((item) => ({
        id: item.code,
        customer: item.customer,
        pickup: item.pickup,
        dropoff: item.dropoff,
        vehicle: item.vehicle,
        planner: item.planner,
        window: item.window,
        status: item.status,
      }));
      this.updateBoardLanes();
    } catch {
      window.alert('Failed to load dispatches from backend.');
    }
  }

  private async runAction(action: string, payload: Record<string, unknown>): Promise<void> {
    try {
      const result = await firstValueFrom(this.api.logAction(action, payload));
      window.alert(result.message);
    } catch {
      window.alert('Action failed.');
    }
  }

  private updateBoardLanes(): void {
    const planned = this.orders.filter((item) => item.status === 'Scheduled');
    const loading = this.orders.filter((item) => item.status === 'Loading');
    const delayed = this.orders.filter((item) => item.status === 'Delayed');

    this.lanes = [
      { title: 'Unassigned', count: planned.length, orders: planned.slice(0, 3).map((item) => item.customer) },
      { title: 'Planned', count: planned.length + loading.length, orders: [...planned, ...loading].slice(0, 3).map((item) => item.customer) },
      { title: 'In Transit', count: loading.length, orders: loading.slice(0, 3).map((item) => item.customer) },
      { title: 'Exceptions', count: delayed.length, orders: delayed.slice(0, 3).map((item) => item.customer) },
    ];
  }
}
