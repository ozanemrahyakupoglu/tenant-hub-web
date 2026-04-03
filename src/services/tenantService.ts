import api from './api';
import type { PageResponse } from './userService';

export interface Tenant {
  id: number;
  usersId: number;
  userName: string;
  firstName: string;
  lastName: string;
  status: string;
  createdDate: string;
  createdBy: string;
}

export interface TenantRequest {
  usersId: number;
}

export interface TenantListParams {
  page: number;
  size: number;
  sort?: string;
  userName?: string;
}

export async function getTenants(params: TenantListParams): Promise<PageResponse<Tenant>> {
  const { data } = await api.get<PageResponse<Tenant>>('/tenants', { params });
  return data;
}

export async function createTenant(payload: TenantRequest): Promise<Tenant> {
  const { data } = await api.post<Tenant>('/tenants', payload);
  return data;
}

export async function updateTenant(id: number, payload: TenantRequest): Promise<Tenant> {
  const { data } = await api.put<Tenant>(`/tenants/${id}`, payload);
  return data;
}

export async function deleteTenant(id: number): Promise<void> {
  await api.delete(`/tenants/${id}`);
}
