import api from './api';
import type { PageResponse } from './userService';

export interface Permission {
  id: number;
  name: string;
  description: string;
  module: string;
  action: string;
  status: string;
  createdDate: string;
  createdBy: string;
}

export interface PermissionRequest {
  name: string;
  description: string;
  module: string;
  action: string;
  status: string;
}

export interface PermissionListParams {
  page: number;
  size: number;
  sort?: string;
  name?: string;
  module?: string;
  action?: string;
  status?: string;
}

export async function getPermissions(params: PermissionListParams): Promise<PageResponse<Permission>> {
  const { data } = await api.get<PageResponse<Permission>>('/permissions', { params });
  return data;
}

export async function createPermission(payload: PermissionRequest): Promise<Permission> {
  const { data } = await api.post<Permission>('/permissions', payload);
  return data;
}

export async function updatePermission(id: number, payload: PermissionRequest): Promise<Permission> {
  const { data } = await api.put<Permission>(`/permissions/${id}`, payload);
  return data;
}

export async function deletePermission(id: number): Promise<void> {
  await api.delete(`/permissions/${id}`);
}
