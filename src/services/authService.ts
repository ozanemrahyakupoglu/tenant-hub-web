import api, { setAccessToken, clearAccessToken } from './api';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export async function loginApi(credentials: LoginRequest): Promise<LoginResponse> {
  // refreshToken backend tarafından httpOnly cookie olarak set edilir
  const { data } = await api.post<LoginResponse>('/auth/login', credentials);
  setAccessToken(data.accessToken);
  return data;
}

export async function logoutApi(): Promise<void> {
  try {
    // backend httpOnly cookie'yi temizler
    await api.post('/auth/logout');
  } catch {
    // logout endpoint yoksa sessizce devam et
  } finally {
    clearAccessToken();
  }
}
