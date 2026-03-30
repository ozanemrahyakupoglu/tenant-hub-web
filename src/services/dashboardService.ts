import api from './api';

export interface DashboardStats {
  totalUsers: number;
  totalRealEstates: number;
  totalRents: number;
  totalPayments: number;
  rentedRealEstates: number;
  vacantRealEstates: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/dashboard/stats');
  return data;
}
