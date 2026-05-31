import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-customers-page',
  imports: [CommonModule],
  templateUrl: './customers-page.component.html',
  styleUrl: './customers-page.component.scss'
})
export class CustomersPageComponent implements OnInit {
  customers: CustomerAccount[] = [];

  constructor(private readonly api: FleetApiService) {}

  async ngOnInit(): Promise<void> {
    await this.loadCustomers();
  }

  riskClass(status: CustomerAccount['status']): string {
    return status.toLowerCase();
  }

  async onAddCustomer(): Promise<void> {
    const name = window.prompt('Customer name', 'Acme Logistics');
    if (!name) {
      return;
    }

    const tier = window.prompt('Tier (Enterprise/Growth/Standard)', 'Standard');
    if (!tier) {
      return;
    }

    const owner = window.prompt('Account owner', 'Nadia');
    if (!owner) {
      return;
    }

    const lanes = Number(window.prompt('Contracted lanes', '8') ?? '0');
    const monthlySpend = Number(window.prompt('Monthly spend in USD', '24000') ?? '0');
    const sla = Number(window.prompt('SLA %', '95.5') ?? '95');
    const riskInput = (window.prompt('Risk (Low/Medium/High)', 'Low') ?? 'Low').toLowerCase();

    const risk: CustomerRisk = riskInput === 'high' ? 'High' : riskInput === 'medium' ? 'Medium' : 'Low';

    try {
      await firstValueFrom(this.api.createCustomer({ name, tier, owner, lanes, monthly_spend: monthlySpend, sla, risk }));
      await this.loadCustomers();
      window.alert('Customer added successfully.');
    } catch {
      window.alert('Failed to add customer. Name might already exist.');
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
      window.alert('Failed to load customers from backend.');
    }
  }
}
