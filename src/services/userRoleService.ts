import api from './api';

export interface UserRoleResponse {
  id: number;
  userId: number;
  username: string;
  roleId: number;
  roleName: string;
  createdDate: string;
  createdBy: string;
}

export interface UserRoleRequest {
  userId: number;
  roleId: number;
}

export async function getRolesByUserId(userId: number): Promise<UserRoleResponse[]> {
  const { data } = await api.get<UserRoleResponse[]>(`/user-roles/user/${userId}`);
  return data;
}

export async function assignRoleToUser(payload: UserRoleRequest): Promise<UserRoleResponse> {
  const { data } = await api.post<UserRoleResponse>('/user-roles', payload);
  return data;
}

export async function removeUserRole(id: number): Promise<void> {
  await api.delete(`/user-roles/${id}`);
}
