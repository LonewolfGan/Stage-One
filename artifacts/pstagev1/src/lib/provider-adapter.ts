import type { Provider, StaffMember, Service, BusinessHours } from "./types";
import type { ApiProvider } from "./api";


function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const CATEGORY_BY_SLUG: Record<string, string> = {
  "salon-atlas": "coiffeur",
  "institut-elegance": "beaute",
  "sara-domicile": "coiffeur",
};

const CATEGORY_FALLBACK_BY_TYPE: Record<string, string> = {
  ESTABLISHMENT: "coiffeur",
  INDIVIDUAL: "coiffeur",
};

export function adaptProvider(api: ApiProvider): Provider {
  const staff: StaffMember[] = (api.staff ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    firstName: s.name.split(" ")[0],
    initials: initials(s.name),
    speciality: s.bio ?? "Professionnel",
    photoUrl: s.photoUrl ?? "",
  }));

  const services: Service[] = (api.services ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description ?? "",
    category: "Prestation",
    durationMinutes: s.durationMinutes,
    priceCents: s.priceCents,
    bufferMinutes: s.bufferMinutes,
    isPopular: false,
    staffIds: s.staffIds ?? [],
  }));

  const businessHours: BusinessHours[] = (api.businessHours ?? []).map((h) => ({
    dayOfWeek: h.dayOfWeek,
    openTime: h.openTime,
    closeTime: h.closeTime,
    isClosed: h.isClosed,
  }));

  return {
    id: api.id,
    type: api.type.toLowerCase() as "establishment" | "individual",
    name: api.name,
    slug: api.slug,
    description: api.description ?? "",
    category: CATEGORY_BY_SLUG[api.slug] ?? CATEGORY_FALLBACK_BY_TYPE[api.type] ?? "coiffeur",
    city: api.city,
    address: api.address ?? api.city,
    rating: api.avgRating ?? 4.5,
    reviewCount: api.reviewCount ?? 0,
    priceLevel: api.minPriceCents != null ? (api.minPriceCents < 15000 ? 1 : api.minPriceCents < 40000 ? 2 : 3) : 2,
    minPriceCents: api.minPriceCents ?? null,
    minDurationMinutes: api.minDurationMinutes ?? null,
    isVerified: true,
    isPopular: (api.reviewCount ?? 0) > 5,
    photos: api.logoUrl ? [api.logoUrl] : [],
    latitude: api.latitude ?? undefined,
    longitude: api.longitude ?? undefined,
    distanceKm: api.distanceKm ?? undefined,
    staff,
    services,
    businessHours,
  };
}

export function adaptProviderList(apis: ApiProvider[]): Provider[] {
  return apis.map((a) => adaptProvider({ ...a, staff: [], services: [], businessHours: [] }));
}
