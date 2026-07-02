import { getToken, getRefreshToken, setTokens, clearTokens } from "./auth-store";

const BASE = "/api";

// ── JWT auto-refresh ─────────────────────────────────────────────────────────
let _refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (_refreshing) return _refreshing;
  _refreshing = (async () => {
    const rt = getRefreshToken();
    if (!rt) return false;
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.token && data.refreshToken && data.user) {
        setTokens(data.token, data.refreshToken, data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      _refreshing = null;
    }
  })();
  return _refreshing;
}

async function apiFetch<T>(path: string, init?: RequestInit, _retry = true): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 401 && _retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return apiFetch<T>(path, init, false);
    clearTokens();
    throw Object.assign(new Error("Session expirée. Veuillez vous reconnecter."), { status: 401, data: { message: "Session expirée" } });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message ?? "API error"), { status: res.status, data: err });
  }
  return res.json() as Promise<T>;
}

// ── Auth types
export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: "CLIENT" | "OWNER" | "ADMIN";
  phoneVerified: boolean;
  emailVerified: boolean;
  photoUrl?: string | null;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RegisterResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
  devEmailLink?: string;
}

// ── Provider types (API shape)
export interface ApiStaff {
  id: string;
  providerId: string;
  name: string;
  photoUrl: string | null;
  bio: string | null;
  isActive: boolean;
}

export interface ApiService {
  id: string;
  providerId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  bufferMinutes: number;
  isActive: boolean;
  staffIds?: string[];
}

export interface ApiBusinessHours {
  id: string;
  providerId: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface ApiReview {
  id: string;
  providerId: string;
  clientId: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  createdAt: string;
}

export interface ApiProvider {
  id: string;
  type: "ESTABLISHMENT" | "INDIVIDUAL";
  name: string;
  slug: string;
  description: string | null;
  phone: string;
  city: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  logoUrl: string | null;
  status: string;
  staffCount?: number;
  serviceCount?: number;
  avgRating?: number | null;
  reviewCount?: number;
  minPriceCents?: number | null;
  minDurationMinutes?: number | null;
  distanceKm?: number | null;
  // full profile fields
  staff?: ApiStaff[];
  services?: ApiService[];
  businessHours?: ApiBusinessHours[];
  reviews?: ApiReview[];
}

export interface ApiSlot {
  startTime: string;
  endTime: string;
  startDatetime: string;
  endDatetime: string;
  staffId: string;
  staffName: string;
}

export interface BookingResult {
  bookingId: string;
  status: string;
  paymentIntentSecret: string;
  expiresAt: string;
  amountCents: number;
}

export interface MyBooking {
  id: string;
  status: string;
  paymentStatus: string;
  startDatetime: string;
  endDatetime: string;
  amountCents: number;
  serviceName: string | null;
  serviceDuration: number | null;
  staffName: string | null;
  providerName: string | null;
  providerSlug: string | null;
  providerLogoUrl: string | null;
  providerCity: string | null;
  hasReview: boolean;
}

export interface ReviewResult {
  id: string;
  bookingId: string;
  providerId: string;
  clientId: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  createdAt: string;
}

export interface DashboardReview {
  id: string;
  bookingId: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  createdAt: string;
  clientName: string | null;
}

export interface BookingDetail {
  id: string;
  status: string;
  paymentStatus: string;
  startDatetime: string;
  endDatetime: string;
  amountCents: number;
  clientId: string;
  staffId: string;
  providerId: string;
  serviceName: string | null;
  serviceDuration: number | null;
  staffName: string | null;
  providerName: string | null;
  providerSlug: string | null;
  providerLogoUrl: string | null;
  providerCity: string | null;
  providerAddress: string | null;
}

// ── API functions
export const api = {
  // Generic methods (used by pages that need ad-hoc calls)
  get: <T = any>(path: string) => apiFetch<T>(path),
  post: <T = any>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T = any>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  del: <T = any>(path: string) => apiFetch<T>(path, { method: "DELETE" }),


  // Auth
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  register: (data: { email: string; phone: string; password: string; name: string; role?: "CLIENT" | "OWNER"; phoneToken: string; tokenType?: "firebase" | "internal" }) =>
    apiFetch<RegisterResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  preRegisterSendOtp: (phone: string) =>
    apiFetch<{ message: string; devCode?: string }>("/auth/pre-register/send-otp", { method: "POST", body: JSON.stringify({ phone }) }),

  preRegisterVerifyOtp: (phone: string, code: string) =>
    apiFetch<{ phoneToken: string }>("/auth/pre-register/verify-otp", { method: "POST", body: JSON.stringify({ phone, code }) }),

  sendPhoneOtp: () =>
    apiFetch<{ message: string; devCode?: string }>("/auth/send-phone-otp", { method: "POST" }),

  // Dashboard blocks
  getBlocks: () => apiFetch<any[]>("/dashboard/blocks"),

  verifyPhone: (code: string) =>
    apiFetch<{ message: string }>("/auth/verify-phone", { method: "POST", body: JSON.stringify({ code }) }),

  sendEmailCode: () =>
    apiFetch<{ message: string; devCode?: string }>("/auth/send-email-code", { method: "POST" }),

  verifyEmailCode: (code: string) =>
    apiFetch<{ message: string }>("/auth/verify-email-code", { method: "POST", body: JSON.stringify({ code }) }),

  me: () => apiFetch<AuthUser>("/auth/me"),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Providers
  searchProviders: (params: { city?: string; type?: string; q?: string; lat?: number; lng?: number; radius?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.city) qs.set("city", params.city);
    if (params.type) qs.set("type", params.type);
    if (params.q) qs.set("q", params.q);
    if (params.lat != null) qs.set("lat", String(params.lat));
    if (params.lng != null) qs.set("lng", String(params.lng));
    if (params.radius != null) qs.set("radius", String(params.radius));
    return apiFetch<ApiProvider[]>(`/providers?${qs}`);
  },

  getProvider: (slug: string) => apiFetch<ApiProvider>(`/providers/${slug}`),

  registerProvider: (data: {
    type: "ESTABLISHMENT" | "INDIVIDUAL";
    name: string;
    city: string;
    phone: string;
    email: string;
    description?: string;
  }) => apiFetch<ApiProvider>("/providers/register", { method: "POST", body: JSON.stringify(data) }),

  // Slots
  getSlots: (slug: string, params: { serviceId: string; date: string; staffId?: string }) => {
    const qs = new URLSearchParams({ serviceId: params.serviceId, date: params.date });
    if (params.staffId) qs.set("staffId", params.staffId);
    return apiFetch<ApiSlot[]>(`/providers/${slug}/slots?${qs}`);
  },

  // Bookings
  createBooking: (data: {
    providerSlug: string;
    serviceId: string;
    staffId?: string;
    startDatetime: string;
  }) => apiFetch<BookingResult>("/bookings", { method: "POST", body: JSON.stringify(data) }),

  cancelBooking: (bookingId: string) =>
    apiFetch<{ message: string }>(`/bookings/${bookingId}/cancel`, { method: "POST" }),

  getMyBookings: () => apiFetch<MyBooking[]>("/bookings/me"),

  getBooking: (bookingId: string) => apiFetch<BookingDetail>(`/bookings/${bookingId}`),

  confirmBooking: (bookingId: string) =>
    apiFetch<{ message: string }>(`/bookings/${bookingId}/confirm`, { method: "POST" }),

  // Dashboard — provider-side booking actions
  confirmDashboardBooking: (bookingId: string) =>
    apiFetch<{ message: string; bookingId: string; status: string }>(
      `/dashboard/bookings/${bookingId}/confirm`,
      { method: "POST" },
    ),

  cancelDashboardBooking: (bookingId: string) =>
    apiFetch<{ message: string; bookingId: string; status: string }>(
      `/dashboard/bookings/${bookingId}/cancel`,
      { method: "POST" },
    ),

  // Dashboard
  getDashboardProvider: () => apiFetch<any>("/dashboard/provider"),

  getDashboardBookings: (params: { date: string; staffId?: string }) => {
    const qs = new URLSearchParams({ date: params.date });
    if (params.staffId) qs.set("staffId", params.staffId);
    return apiFetch<any[]>(`/dashboard/bookings?${qs}`);
  },

  getAnalytics: (period: "7d" | "30d" | "3m" | "1y" = "30d") =>
    apiFetch<any>(`/dashboard/analytics?period=${period}`),

  createBlock: (data: { staffId?: string; startDatetime: string; endDatetime: string; title?: string; type?: "MANUAL_BLOCK" | "VACATION" | "BREAK" }) =>
    apiFetch<any>("/dashboard/blocks", { method: "POST", body: JSON.stringify(data) }),

  deleteBlock: (blockId: string) =>
    apiFetch<void>(`/dashboard/blocks/${blockId}`, { method: "DELETE" }),

  // Staff CRUD
  getStaff: (slug: string) => apiFetch<ApiStaff[]>(`/providers/${slug}/staff`),
  createStaff: (slug: string, data: { name: string; bio?: string; photoUrl?: string }) =>
    apiFetch<ApiStaff>(`/providers/${slug}/staff`, { method: "POST", body: JSON.stringify(data) }),
  updateStaff: (slug: string, staffId: string, data: Partial<ApiStaff>) =>
    apiFetch<ApiStaff>(`/providers/${slug}/staff/${staffId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteStaff: (slug: string, staffId: string) =>
    apiFetch<void>(`/providers/${slug}/staff/${staffId}`, { method: "DELETE" }),

  // Services CRUD
  getServices: (slug: string) => apiFetch<ApiService[]>(`/providers/${slug}/services`),
  createService: (slug: string, data: Partial<ApiService> & { staffIds?: string[] }) =>
    apiFetch<ApiService>(`/providers/${slug}/services`, { method: "POST", body: JSON.stringify(data) }),
  updateService: (slug: string, serviceId: string, data: Partial<ApiService> & { staffIds?: string[] }) =>
    apiFetch<ApiService>(`/providers/${slug}/services/${serviceId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteService: (slug: string, serviceId: string) =>
    apiFetch<void>(`/providers/${slug}/services/${serviceId}`, { method: "DELETE" }),

  // Hours
  updateHours: (slug: string, hours: { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }[]) =>
    apiFetch<ApiBusinessHours[]>(`/providers/${slug}/hours`, { method: "PUT", body: JSON.stringify({ hours }) }),

  // Public discovery
  getCategories: () => apiFetch<{ id: string; label: string }[]>("/providers/categories"),
  getCities: () => apiFetch<{ name: string; count: number }[]>("/providers/cities"),
  getFeaturedReviews: (limit = 6) =>
    apiFetch<{ id: string; rating: number; comment: string | null; clientName: string; providerName: string; providerSlug: string; createdAt: string }[]>(
      `/reviews/featured?limit=${limit}`,
    ),

  // Reviews
  createReview: (data: { bookingId: string; rating: number; comment?: string }) =>
    apiFetch<ReviewResult>("/reviews", { method: "POST", body: JSON.stringify(data) }),

  replyToReview: (reviewId: string, reply: string) =>
    apiFetch<ReviewResult>(`/reviews/${reviewId}/reply`, { method: "POST", body: JSON.stringify({ reply }) }),

  getDashboardReviews: () => apiFetch<DashboardReview[]>("/reviews"),

  // Photo upload (base64 body)
  uploadProviderLogo: (dataUri: string) =>
    apiFetch<{ logoUrl: string }>("/dashboard/provider/upload-logo", {
      method: "POST",
      body: JSON.stringify({ dataUri }),
    }),

  uploadProviderPhoto: (dataUri: string) =>
    apiFetch<{ photoUrl: string; photos: string[] }>("/dashboard/provider/upload-photo", {
      method: "POST",
      body: JSON.stringify({ dataUri }),
    }),

  deleteProviderPhoto: (photoUrl: string) =>
    apiFetch<{ photos: string[] }>("/dashboard/provider/delete-photo", {
      method: "POST",
      body: JSON.stringify({ photoUrl }),
    }),
};
