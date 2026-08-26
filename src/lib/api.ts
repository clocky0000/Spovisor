import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;
export const API_BASE_URL = configuredApiUrl
  ?? (Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api');

const AUTH_STORAGE_KEY = 'spovisor.auth';

export type AuthResponse = {
  accessToken: string;
  userId: number;
  email: string;
  nickname: string;
  mascot?: string;
  themeColor?: string;
};

export type UserProfile = AuthResponse & { createdAt: string };

export type SavedCourse = {
  id: number;
  title: string;
  stadium?: string;
  courseType?: string;
  course: unknown;
  savedAt: string;
};

export type Trip = {
  id: number;
  stadium: string;
  matchName?: string;
  tripDate?: string;
  courseTitle?: string;
  rating?: number;
  visitedSpotIds: number[];
  createdAt: string;
};

export type SpotSearchResult = {
  contentId: string;
  name: string;
  category?: string;
  areaCode?: string;
  sigunguCode?: string;
  longitude?: number;
  latitude?: number;
};

type ApiError = { code?: string; message?: string };
type RequestOptions = { method?: string; body?: unknown; auth?: boolean };

async function readStoredValue(): Promise<string | null> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') return localStorage.getItem(AUTH_STORAGE_KEY);
  return SecureStore.getItemAsync(AUTH_STORAGE_KEY);
}

async function writeStoredValue(value: string | null) {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    if (value === null) localStorage.removeItem(AUTH_STORAGE_KEY);
    else localStorage.setItem(AUTH_STORAGE_KEY, value);
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
  else await SecureStore.setItemAsync(AUTH_STORAGE_KEY, value);
}

export async function saveAuthSession(auth: AuthResponse) { await writeStoredValue(JSON.stringify(auth)); }

export async function loadAuthSession(): Promise<AuthResponse | null> {
  const raw = await readStoredValue();
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthResponse; }
  catch { await clearAuthSession(); return null; }
}

export function clearAuthSession() { return writeStoredValue(null); }

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = options.auth ?? true;
  const session = auth ? await loadAuthSession() : null;
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
  } catch { throw new Error('백엔드에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'); }

  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    const error = payload as ApiError | undefined;
    throw new Error(error?.message ?? '요청을 처리하지 못했습니다.');
  }
  return payload as T;
}

export function signup(email: string, password: string, nickname: string) {
  return request<AuthResponse>('/auth/signup', { method: 'POST', body: { email, password, nickname }, auth: false });
}

export function login(email: string, password: string) {
  return request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false });
}

export function getMyProfile() { return request<UserProfile>('/users/me'); }
export function updateMyProfile(body: { nickname?: string; mascot?: string; themeColor?: string }) { return request<UserProfile>('/users/me', { method: 'PATCH', body }); }
export function changePassword(currentPassword: string, newPassword: string) { return request<void>('/users/me/password', { method: 'PATCH', body: { currentPassword, newPassword } }); }
export function deleteMyAccount() { return request<void>('/users/me', { method: 'DELETE' }); }
export function saveUserSurvey(survey: unknown) { return request('/user/survey', { method: 'PUT', body: { survey } }); }
export function getUserSurvey() { return request<{ survey: unknown | null; updatedAt: string | null }>('/user/survey'); }
export function listSavedCourses() { return request<SavedCourse[]>('/courses/saved'); }
export function saveCourse(body: { title: string; stadium?: string; courseType?: string; course: unknown }) { return request<SavedCourse>('/courses/saved', { method: 'POST', body }); }
export function deleteSavedCourse(id: number) { return request<void>(`/courses/saved/${id}`, { method: 'DELETE' }); }
export function listTrips() { return request<Trip[]>('/trips'); }
export function createTrip(body: { stadium: string; matchName?: string; tripDate?: string; courseTitle?: string }) { return request<Trip>('/trips', { method: 'POST', body }); }
export function submitTripFeedback(id: number, rating: number, visitedSpotIds: number[]) { return request<Trip>(`/trips/${id}/feedback`, { method: 'PATCH', body: { rating, visitedSpotIds } }); }
export function createRecommendationRequest(survey: unknown) { return request<{ requestId: number; status: string }>('/recommendations/requests', { method: 'POST', body: { survey } }); }
export function searchSpots(query: string) {
  return request<SpotSearchResult[]>(`/spots/search?q=${encodeURIComponent(query.trim())}`);
}
