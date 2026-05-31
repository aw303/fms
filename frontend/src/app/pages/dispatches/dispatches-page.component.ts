import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface DispatchOrder {
  id: string;
  customer: string;
  pickup: string;
  dropoff: string;
  vehicle: string;
  planner: string;
  window: string;
  status: 'Scheduled' | 'Loading' | 'Delayed' | 'Completed';
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
export class DispatchesPageComponent {
  readonly orders: DispatchOrder[] = [
    { id: 'DSP-4182', customer: 'Orbit Pharma', pickup: 'Karachi Port', dropoff: 'Multan Yard', vehicle: 'TRK-118', planner: 'Imran', window: '13:00 - 16:00', status: 'Delayed' },
    { id: 'DSP-4179', customer: 'Nexus Retail', pickup: 'Lahore Hub', dropoff: 'Islamabad DC', vehicle: 'TRK-219', planner: 'Sana', window: '12:30 - 15:30', status: 'Loading' },
    { id: 'DSP-4176', customer: 'Metro Mart', pickup: 'Faisalabad Node', dropoff: 'City Core', vehicle: 'VAN-302', planner: 'Adeel', window: '15:00 - 17:30', status: 'Scheduled' },
    { id: 'DSP-4171', customer: 'Delta Foods', pickup: 'Cold Store 04', dropoff: 'North Hub', vehicle: 'TRK-221', planner: 'Hira', window: '10:00 - 14:00', status: 'Completed' }
  ];

  readonly lanes: BoardLane[] = [
    { title: 'Unassigned', count: 8, orders: ['Retail replenishment', 'Spare parts', 'Vendor returns'] },
    { title: 'Planned', count: 21, orders: ['Cold chain route', 'Airport belt run', 'North hub shuttle'] },
    { title: 'In Transit', count: 67, orders: ['Port to yard', 'City core express', 'Pharma priority'] },
    { title: 'Exceptions', count: 4, orders: ['Missing POD', 'Late pickup', 'Temp probe offline'] }
  ];

  statusClass(status: DispatchOrder['status']): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }
}
