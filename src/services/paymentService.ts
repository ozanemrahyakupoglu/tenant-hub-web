import api from './api';
import type { PageResponse } from './userService';

export interface Payment {
  id: number;
  rentId: number;
  amount: number;
  currency: string;
  paymentDate: string;
  status: string;
  createdDate: string;
  createdBy: string;
  note?: string;
}

export interface PaymentRequest {
  rentId: number;
  amount: number;
  currency: string;
  paymentDate: string;
  note?: string;
}

export interface PaymentListParams {
  page: number;
  size: number;
  sort?: string;
  status?: string;
  rentId?: number;
}

export async function getPayments(params: PaymentListParams): Promise<PageResponse<Payment>> {
  const { data } = await api.get<PageResponse<Payment>>('/payments', { params });
  return data;
}

export async function createPayment(payload: PaymentRequest): Promise<Payment> {
  const { data } = await api.post<Payment>('/payments', payload);
  return data;
}

export async function updatePayment(id: number, payload: PaymentRequest): Promise<Payment> {
  const { data } = await api.put<Payment>(`/payments/${id}`, payload);
  return data;
}

export async function updatePaymentStatus(id: number, status: string): Promise<void> {
  await api.patch(`/payments/${id}/status/${status}`);
}

export async function deletePayment(id: number): Promise<void> {
  await api.delete(`/payments/${id}`);
}
