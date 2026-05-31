import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, switchMap, tap, throwError } from 'rxjs';

export type DispatchStatus = 'Scheduled' | 'Loading' | 'Delayed' | 'Completed';
export type CustomerRisk = 'Low' | 'Medium' | 'High';

export interface DispatchDto {
  id: number;
  code: string;
  customer: string;
  pickup: string;
  dropoff: string;
  vehicle: string;
  planner: string;
  window: string;
  status: DispatchStatus;
}

export interface CreateDispatchPayload {
  customer: string;
  pickup: string;
  dropoff: string;
  vehicle: string;
  planner: string;
  window: string;
  status: DispatchStatus;
}

export interface CustomerDto {
  id: number;
  name: string;
  tier: string;
  lanes: number;
  monthly_spend: number;
  sla: number;
  owner: string;
  risk: CustomerRisk;
}

export interface CreateCustomerPayload {
  name: string;
  tier: string;
  lanes: number;
  monthly_spend: number;
  sla: number;
  owner: string;
  risk: CustomerRisk;
}

export interface ActionResponse {
  status: string;
  action: string;
  message: string;
}

export interface RouteDto {
  id: string;
  origin: string;
  destination: string;
  progress: number;
  risk: CustomerRisk;
  vehicle: string;
  driver: string;
  eta: string;
  temperature: string;
}

export interface OptimizeRoutesResponse {
  status: string;
  projected_delay_reduction_minutes: number;
  routes: RouteDto[];
}

export interface AuthUserDto {
  id: number;
  email: string;
  full_name: string;
  status: string;
}

export interface AuthSessionDto {
  access_token: string;
  token_type: 'bearer';
  user: AuthUserDto;
  roles: string[];
  permissions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class FleetApiService {
  private readonly tokenStorageKey = 'fleet_access_token';
  private readonly permissionsStorageKey = 'fleet_permissions';
  private readonly apiBaseOverrideStorageKey = 'fleet_api_base';
  private accessToken: string | null = this.readStorage(this.tokenStorageKey);
  private permissionSet: Set<string> = new Set(this.readPermissions());

  constructor(private readonly http: HttpClient) {}

  ensureDemoSession(): Observable<AuthSessionDto> {
    const restore$: Observable<AuthSessionDto | null> = this.accessToken ? this.me() : of(null);

    return restore$.pipe(
      catchError(() => of(null)),
      switchMap((session) => {
        if (session) {
          return of(session);
        }

        return this.login('admin@fleet.local', 'admin123');
      }),
    );
  }

  login(email: string, password: string): Observable<AuthSessionDto> {
    return this.http
      .post<AuthSessionDto>(`${this.apiBase}/auth/login`, { email, password })
      .pipe(tap((session) => this.storeSession(session)));
  }

  me(): Observable<AuthSessionDto> {
    return this.http
      .get<AuthSessionDto>(`${this.apiBase}/auth/me`, this.authOptions())
      .pipe(tap((session) => this.storeSession(session)));
  }

  hasPermission(permission: string): boolean {
    return this.permissionSet.has(permission);
  }

  listDispatches(): Observable<DispatchDto[]> {
    return this.requestWithSession(() => this.http.get<DispatchDto[]>(`${this.apiBase}/dispatches`, this.authOptions()));
  }

  createDispatch(payload: CreateDispatchPayload): Observable<DispatchDto> {
    return this.requestWithSession(() => this.http.post<DispatchDto>(`${this.apiBase}/dispatches`, payload, this.authOptions()));
  }

  listCustomers(): Observable<CustomerDto[]> {
    return this.requestWithSession(() => this.http.get<CustomerDto[]>(`${this.apiBase}/customers`, this.authOptions()));
  }

  createCustomer(payload: CreateCustomerPayload): Observable<CustomerDto> {
    return this.requestWithSession(() => this.http.post<CustomerDto>(`${this.apiBase}/customers`, payload, this.authOptions()));
  }

  optimizeRoutes(routes: RouteDto[]): Observable<OptimizeRoutesResponse> {
    return this.requestWithSession(() => this.http.post<OptimizeRoutesResponse>(`${this.apiBase}/routes/optimize`, { routes }, this.authOptions()));
  }

  logAction(action: string, payload: Record<string, unknown> = {}): Observable<ActionResponse> {
    return this.requestWithSession(() => this.http.post<ActionResponse>(`${this.apiBase}/actions`, { action, payload }, this.authOptions()));
  }

  export(scope: 'all' | 'dispatches' | 'customers' | 'actions'): Observable<Blob> {
    return this.requestWithSession(() => {
      const options = this.authOptions();
      return this.http.get(`${this.apiBase}/exports/${scope}`, {
        ...options,
        responseType: 'blob',
      });
    });
  }

  private requestWithSession<T>(request: () => Observable<T>): Observable<T> {
    const executeRequest = (): Observable<T> =>
      request().pipe(
        catchError((error: { status?: number }) => {
          if (error?.status === 401) {
            this.clearSession();
            return this.ensureDemoSession().pipe(switchMap(() => request()));
          }

          return throwError(() => error);
        }),
      );

    if (this.accessToken) {
      return executeRequest();
    }

    return this.ensureDemoSession().pipe(switchMap(() => executeRequest()));
  }

  private storeSession(session: AuthSessionDto): void {
    this.accessToken = session.access_token;
    this.permissionSet = new Set(session.permissions);

    this.writeStorage(this.tokenStorageKey, session.access_token);
    this.writeStorage(this.permissionsStorageKey, JSON.stringify(session.permissions));
  }

  private authOptions(): { headers?: HttpHeaders } {
    if (!this.accessToken) {
      return {};
    }

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.accessToken}`,
      }),
    };
  }

  private readPermissions(): string[] {
    const raw = this.readStorage(this.permissionsStorageKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      return [];
    }

    return [];
  }

  private readStorage(key: string): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem(key);
  }

  private writeStorage(key: string, value: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(key, value);
  }

  private clearSession(): void {
    this.accessToken = null;
    this.permissionSet = new Set<string>();

    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(this.tokenStorageKey);
    window.localStorage.removeItem(this.permissionsStorageKey);
  }

  private get apiBase(): string {
    if (typeof window === 'undefined') {
      return '/api';
    }

    const { hostname, port, protocol } = window.location;
    const override = this.readStorage(this.apiBaseOverrideStorageKey);

    if (override) {
      return override.replace(/\/$/, '');
    }

    if (port === '4200') {
      return `${protocol}//${hostname}:8080/api`;
    }

    return '/api';
  }
}
