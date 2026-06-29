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
  "salon-atlas-casablanca": "coiffeur",
  "institut-elegance": "beaute",
  "sara-domicile": "coiffeur",
};

const PHOTOS_BY_SLUG: Record<string, string[]> = {
  "salon-atlas-casablanca": [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&auto=format&fit=crop&q=80",
  ],
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
    rating: api.avgRating ?? 0,
    reviewCount: api.reviewCount ?? 0,
    priceLevel: api.minPriceCents != null ? (api.minPriceCents < 15000 ? 1 : api.minPriceCents < 40000 ? 2 : 3) : 2,
    minPriceCents: api.minPriceCents ?? null,
    minDurationMinutes: api.minDurationMinutes ?? null,
    isVerified: true,
    isPopular: (api.reviewCount ?? 0) > 5,
    photos: PHOTOS_BY_SLUG[api.slug] ?? (api.logoUrl ? [api.logoUrl] : []),
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
