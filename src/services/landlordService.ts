import api from './api';
import type { PageResponse } from './userService';

export interface Landlord {
  id: number;
  usersId: number;
  usersFullName: string;
  status: string;
  createdDate: string;
  createdBy: string;
}

export interface LandlordRequest {
  usersId: number;
}

export interface LandlordListParams {
  page: number;
  size: number;
  sort?: string;
}

export async function getLandlords(params: LandlordListParams): Promise<PageResponse<Landlord>> {
  const { data } = await api.get<PageResponse<Landlord>>('/landlords', { params });
  return data;
}

export async function createLandlord(payload: LandlordRequest): Promise<Landlord> {
  const { data } = await api.post<Landlord>('/landlords', payload);
  return data;
}

export async function updateLandlord(id: number, payload: LandlordRequest): Promise<Landlord> {
  const { data } = await api.put<Landlord>(`/landlords/${id}`, payload);
  return data;
}

export async function deleteLandlord(id: number): Promise<void> {
  await api.delete(`/landlords/${id}`);
}
