export type Provider = {
  id: string;
  type: 'establishment' | 'individual';
  name: string;
  slug: string;
  description: string;
  category: string;
  city: string;
  address: string;
  rating: number;
  reviewCount: number;
  priceLevel: number;
  minPriceCents?: number | null;
  minDurationMinutes?: number | null;
  isVerified: boolean;
  isPopular: boolean;
  photos: string[];
  staff: StaffMember[];
  services: Service[];
  businessHours: BusinessHours[];
  latitude?: number;
  longitude?: number;
};

export type StaffMember = {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  speciality: string;
  photoUrl: string;
};

export type ServiceCategory = {
  name: string;
  services: Service[];
};

export type Service = {
  id: string;
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  priceCents: number;
  bufferMinutes: number;
  isPopular: boolean;
  staffIds: string[];
};

export type BusinessHours = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

export type TimeSlot = {
  time: string;
  available: boolean;
};

export type Review = {
  id: string;
  author: string;
  avatarInitials: string;
  date: string;
  rating: number;
  comment: string;
};

export function generateSlots(date: Date, provider: Provider): TimeSlot[] {
  const day = date.getDay();
  const hours = provider.businessHours.find(h => h.dayOfWeek === day);
  if (!hours || hours.isClosed) return [];

  const slots: TimeSlot[] = [];
  const [openH, openM] = hours.openTime.split(':').map(Number);
  const [closeH, closeM] = hours.closeTime.split(':').map(Number);

  let current = openH * 60 + openM;
  const end = closeH * 60 + closeM;

  const lunchStart = provider.type === 'establishment' ? 13 * 60 : -1;
  const lunchEnd = provider.type === 'establishment' ? 14 * 60 : -1;

  while (current + 30 <= end) {
    if (current >= lunchStart && current < lunchEnd) {
      current += 30;
      continue;
    }
    const h = Math.floor(current / 60).toString().padStart(2, '0');
    const m = (current % 60).toString().padStart(2, '0');
    const seed = (date.getDate() * 7 + current) % 10;
    slots.push({ time: `${h}:${m}`, available: seed < 6 });
    current += 30;
  }
  return slots;
}

export function getNextAvailable(provider: Provider): string {
  const now = new Date();
  for (let d = 0; d < 7; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    const slots = generateSlots(date, provider).filter(s => s.available);
    if (slots.length > 0) {
      if (d === 0) return `Disponible à ${slots[0].time}`;
      const dayNames = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
      return `${dayNames[date.getDay()]} ${slots[0].time}`;
    }
  }
  return 'Vérifier les disponibilités';
}
