import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FleetApiService } from '../../services/fleet-api.service';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  email = 'admin@fleet.local';
  password = 'admin123';
  error = '';
  isSubmitting = false;

  constructor(
    private readonly api: FleetApiService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  async onSubmit(): Promise<void> {
    this.error = '';
    this.isSubmitting = true;

    try {
      await firstValueFrom(this.api.login(this.email.trim(), this.password));

      const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/overview';
      await this.router.navigateByUrl(redirect);
    } catch {
      this.error = 'Invalid credentials or backend not reachable.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
