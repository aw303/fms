import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CustomerRisk, FleetApiService } from '../../services/fleet-api.service';

interface CustomerAccount {
  name: string;
  tier: string;
  lanes: number;
  monthlySpend: string;
  sla: string;
  owner: string;
  status: CustomerRisk;
}

interface CustomerFormModel {
  name: string;
  tier: string;
  lanes: number;
  monthlySpend: number;
  sla: number;
  owner: string;
  risk: CustomerRisk;
}

@Component({
  selector: 'app-customers-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './customers-page.component.html',
  styleUrl: './customers-page.component.scss'
})
export class CustomersPageComponent implements OnInit {
  customers: CustomerAccount[] = [];
  isAddCustomerModalOpen = false;
  isSubmitting = false;

  customerForm: CustomerFormModel = {
    name: '',
    tier: 'Standard',
    lanes: 1,
    monthlySpend: 10000,
    sla: 95,
    owner: '',
    risk: 'Low',
  };

  constructor(private readonly api: FleetApiService) {}

  async ngOnInit(): Promise<void> {
    await this.loadCustomers();
  }

  riskClass(status: CustomerAccount['status']): string {
    return status.toLowerCase();
  }

  onAddCustomer(): void {
    this.customerForm = {
      name: '',
      tier: 'Standard',
      lanes: 1,
      monthlySpend: 10000,
      sla: 95,
      owner: '',
      risk: 'Low',
    };
    this.isAddCustomerModalOpen = true;
  }

  onCloseAddCustomerModal(): void {
    this.isAddCustomerModalOpen = false;
    this.isSubmitting = false;
  }

  async onSubmitAddCustomer(): Promise<void> {
    if (!this.customerForm.name.trim() || !this.customerForm.owner.trim()) {
      window.alert('Customer name and owner are required.');
      return;
    }

    this.isSubmitting = true;

    try {
      await firstValueFrom(
        this.api.createCustomer({
          name: this.customerForm.name.trim(),
          tier: this.customerForm.tier,
          owner: this.customerForm.owner.trim(),
          lanes: Math.max(0, this.customerForm.lanes),
          monthly_spend: Math.max(0, this.customerForm.monthlySpend),
          sla: Math.max(0, Math.min(100, this.customerForm.sla)),
          risk: this.customerForm.risk,
        }),
      );
      await this.loadCustomers();
      this.onCloseAddCustomerModal();
      window.alert('Customer added successfully.');
    } catch {
      this.isSubmitting = false;
      if (this.api.isAuthenticated()) {
        window.alert('Failed to add customer. Name might already exist or you may not have permission.');
      }
    }
  }

  private async loadCustomers(): Promise<void> {
    try {
      const data = await firstValueFrom(this.api.listCustomers());
      this.customers = data.map((item) => ({
        name: item.name,
        tier: item.tier,
        lanes: item.lanes,
        monthlySpend: `$${(item.monthly_spend / 1000).toFixed(1)}K`,
        sla: `${item.sla.toFixed(1)}%`,
        owner: item.owner,
        status: item.risk,
      }));
    } catch {
      if (this.api.isAuthenticated()) {
        window.alert('Failed to load customers from backend.');
      }
    }
  }
}
