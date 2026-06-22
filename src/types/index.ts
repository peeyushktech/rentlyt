export interface Tenant {
  id: number;
  name: string;
  phone: string;
  building: string;
  room: string;
  monthly_rent: number;
  move_in_date: string;
  contract_months: number;
  vacated_at: string | null;
  created_at: string;
}

export interface TenantDocument {
  id: number;
  tenant_id: number;
  type: 'id_card' | 'agreement' | 'other';
  uri: string;
  name: string;
  created_at: string;
}

export interface RentRecord {
  id: number;
  tenant_id: number;
  tenant_name?: string;
  room?: string;
  move_in_date?: string;
  month: number;
  year: number;
  amount_due: number;
  amount_paid: number;
  status: 'pending' | 'paid' | 'partial';
  paid_at: string | null;
  notes: string | null;
}
