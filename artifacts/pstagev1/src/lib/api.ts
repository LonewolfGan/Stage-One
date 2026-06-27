const BASE = "/api";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
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
  requiresPhoneVerification: boolean;
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

// ── API functions
export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  register: (data: { email: string; phone: string; password: string; name: string; role?: "CLIENT" | "OWNER" }) =>
    apiFetch<RegisterResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  me: () => apiFetch<AuthUser>("/auth/me"),

  // Providers
  searchProviders: (params: { city?: string; type?: string; q?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.city) qs.set("city", params.city);
    if (params.type) qs.set("type", params.type);
    if (params.q) qs.set("q", params.q);
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

  // Dashboard
  getDashboardProvider: () => apiFetch<any>("/dashboard/provider"),

  getDashboardBookings: (params: { date: string; staffId?: string }) => {
    const qs = new URLSearchParams({ date: params.date });
    if (params.staffId) qs.set("staffId", params.staffId);
    return apiFetch<any[]>(`/dashboard/bookings?${qs}`);
  },

  getAnalytics: () => apiFetch<any>("/dashboard/analytics"),

  createBlock: (data: { staffId?: string; startDatetime: string; endDatetime: string; title?: string }) =>
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
};
