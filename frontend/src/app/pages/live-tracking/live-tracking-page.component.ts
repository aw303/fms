import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ActiveRoute {
  id: string;
  origin: string;
  destination: string;
  progress: number;
  risk: 'Low' | 'Medium' | 'High';
  vehicle: string;
  driver: string;
  eta: string;
  temperature: string;
}

interface TrackingAlert {
  vehicle: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-live-tracking-page',
  imports: [CommonModule],
  templateUrl: './live-tracking-page.component.html',
  styleUrl: './live-tracking-page.component.scss'
})
export class LiveTrackingPageComponent {
  readonly routes: ActiveRoute[] = [
    { id: 'R-102', origin: 'Lahore Hub', destination: 'Islamabad DC', progress: 72, risk: 'Low', vehicle: 'TRK-219', driver: 'Adeel Khan', eta: '13:40', temperature: '6.1 C' },
    { id: 'R-237', origin: 'Karachi Port', destination: 'Multan Yard', progress: 48, risk: 'Medium', vehicle: 'TRK-118', driver: 'Mubashir Ali', eta: '18:15', temperature: '5.4 C' },
    { id: 'R-391', origin: 'Peshawar Depot', destination: 'Faisalabad Node', progress: 31, risk: 'High', vehicle: 'VAN-044', driver: 'Sana Tariq', eta: '20:05', temperature: 'Ambient' },
    { id: 'R-418', origin: 'Islamabad DC', destination: 'City Core', progress: 86, risk: 'Low', vehicle: 'VAN-302', driver: 'Hira Noman', eta: '12:25', temperature: 'Ambient' }
  ];

  readonly alerts: TrackingAlert[] = [
    { vehicle: 'TRK-118', message: 'Route moved into congestion zone. Reroute suggested.', severity: 'high' },
    { vehicle: 'VAN-044', message: 'Driver break window opens in 28 minutes.', severity: 'medium' },
    { vehicle: 'TRK-219', message: 'ETA confidence improved after checkpoint scan.', severity: 'low' }
  ];

  riskClass(risk: ActiveRoute['risk'] | TrackingAlert['severity']): string {
    return risk.toLowerCase();
  }
}
