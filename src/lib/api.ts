import { Platform } from 'react-native';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;

// Android emulator는 호스트 PC를 10.0.2.2로 접근합니다.
// 실기기에서는 EXPO_PUBLIC_API_URL을 PC의 LAN IP로 지정하세요.
export const API_BASE_URL = configuredApiUrl
  ?? (Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api');

export type AuthResponse = {
  accessToken: string;
  userId: number;
  email: string;
  nickname: string;
};

type ApiError = {
  code?: string;
  message?: string;
};

async function request<T>(path: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('백엔드에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
  }

  const payload = await response.json().catch(() => ({} as ApiError));
  if (!response.ok) {
    throw new Error((payload as ApiError).message ?? '요청을 처리하지 못했습니다.');
  }
  return payload as T;
}

export function signup(email: string, password: string, nickname: string) {
  return request<AuthResponse>('/auth/signup', { email, password, nickname });
}

export function login(email: string, password: string) {
  return request<AuthResponse>('/auth/login', { email, password });
}
