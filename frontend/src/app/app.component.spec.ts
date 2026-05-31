import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { FleetApiService } from './services/fleet-api.service';

const fleetApiStub: Pick<FleetApiService, 'ensureDemoSession' | 'hasPermission'> = {
  ensureDemoSession: () =>
    of({
      access_token: 'test-token',
      token_type: 'bearer',
      user: { id: 1, email: 'admin@fleet.local', full_name: 'Fleet Admin', status: 'active' },
      roles: ['admin'],
      permissions: ['report:export', 'dispatch:create', 'action:log'],
    }),
  hasPermission: () => true,
};

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: FleetApiService, useValue: fleetApiStub },
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the shell brand', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand h1')?.textContent).toContain('Fleet Pulse');
  });
});
