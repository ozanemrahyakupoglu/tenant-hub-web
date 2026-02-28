import api from './api';
import type { PageResponse } from './userService';

export interface Role {
  id: number;
  name: string;
  description: string;
  status: string;
  createdDate: string;
  createdBy: string;
}

export interface RoleRequest {
  name: string;
  description: string;
}

export interface RoleListParams {
  page: number;
  size: number;
  sort?: string;
  name?: string;
  status?: string;
}

export async function getRoles(params: RoleListParams): Promise<PageResponse<Role>> {
  const { data } = await api.get<PageResponse<Role>>('/roles', { params });
  return data;
}

export async function createRole(payload: RoleRequest): Promise<Role> {
  const { data } = await api.post<Role>('/roles', payload);
  return data;
}

export async function updateRole(id: number, payload: RoleRequest): Promise<Role> {
  const { data } = await api.put<Role>(`/roles/${id}`, payload);
  return data;
}

export async function deleteRole(id: number): Promise<void> {
  await api.delete(`/roles/${id}`);
}
