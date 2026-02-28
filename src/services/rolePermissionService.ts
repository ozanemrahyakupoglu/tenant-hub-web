import api from './api';

export interface RolePermissionResponse {
  id: number;
  roleId: number;
  roleName: string;
  permissionId: number;
  permissionName: string;
  createdDate: string;
  createdBy: string;
}

export interface RolePermissionRequest {
  roleId: number;
  permissionId: number;
}

export async function getPermissionsByRoleId(roleId: number): Promise<RolePermissionResponse[]> {
  const { data } = await api.get<RolePermissionResponse[]>(`/role-permissions/role/${roleId}`);
  return data;
}

export async function assignPermissionToRole(payload: RolePermissionRequest): Promise<RolePermissionResponse> {
  const { data } = await api.post<RolePermissionResponse>('/role-permissions', payload);
  return data;
}

export async function removeRolePermission(id: number): Promise<void> {
  await api.delete(`/role-permissions/${id}`);
}
