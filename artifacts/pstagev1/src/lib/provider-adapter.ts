import type { Provider, StaffMember, Service, BusinessHours } from "./types";
import type { ApiProvider } from "./api";
import { initials } from "./utils";

const CATEGORY_BY_SLUG: Record<string, string> = {
  "salon-atlas": "coiffeur",
  "salon-atlas-casablanca": "coiffeur",
  "institut-elegance": "beaute",
  "sara-domicile": "coiffeur",
  "hammam-zitoun": "bien-etre",
};

const PHOTOS_BY_SLUG: Record<string, string[]> = {
  "salon-atlas-casablanca": [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&auto=format&fit=crop&q=80",
  ],
  "salon-atlas": [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&auto=format&fit=crop&q=80",
  ],
  "institut-elegance": [
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=80",
  ],
  "sara-domicile": [
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop&q=80",
  ],
  "hammam-zitoun": [
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80",
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
