import { db, pool } from "@workspace/db";
import {
  usersTable,
  providersTable,
  staffTable,
  businessHoursTable,
  servicesTable,
  serviceStaffTable,
  bookingsTable,
  reviewsTable,
  subscriptionsTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  console.log("🌱 Seeding database...");

  await db.delete(reviewsTable);
  await db.delete(bookingsTable);
  await db.delete(serviceStaffTable);
  await db.delete(servicesTable);
  await db.delete(businessHoursTable);
  await db.delete(staffTable);
  await db.delete(subscriptionsTable);
  await db.delete(providersTable);
  await db.delete(usersTable);

  const passwordHash = await bcrypt.hash("password123", 12);

  // ── CLIENTS
  const clientId1 = uuidv4();
  const clientId2 = uuidv4();
  await db.insert(usersTable).values([
    { id: clientId1, email: "yasmine@client.ma", phone: "+212600000001", name: "Yasmine Alami", passwordHash, role: "CLIENT", phoneVerified: true, emailVerified: true },
    { id: clientId2, email: "mehdi@client.ma", phone: "+212600000002", name: "Mehdi Tazi", passwordHash, role: "CLIENT", phoneVerified: true, emailVerified: true },
  ]);

  // ── OWNERS
  const owner1Id = uuidv4();
  const owner2Id = uuidv4();
  const owner3Id = uuidv4();
  await db.insert(usersTable).values([
    { id: owner1Id, email: "atlas@salon.ma", phone: "+212600100001", name: "Karim Bensalem", passwordHash, role: "OWNER", phoneVerified: true, emailVerified: true },
    { id: owner2Id, email: "elegance@salon.ma", phone: "+212600100002", name: "Nadia Chraibi", passwordHash, role: "OWNER", phoneVerified: true, emailVerified: true },
    { id: owner3Id, email: "sara@domicile.ma", phone: "+212600100003", name: "Sara Idrissi", passwordHash, role: "OWNER", phoneVerified: true, emailVerified: true },
  ]);

  // ── PROVIDER 1: Salon Atlas (ESTABLISHMENT, Marrakech)
  const p1Id = uuidv4();
  await db.insert(providersTable).values({
    id: p1Id, type: "ESTABLISHMENT", name: "Salon Atlas", slug: "salon-atlas",
    description: "Salon de coiffure premium au coeur de Guéliz. Équipe expérimentée, produits haut de gamme.",
    phone: "+212524431200", email: "atlas@salon.ma", address: "47 Rue de la Liberté, Guéliz",
    city: "Marrakech", latitude: 31.6295, longitude: -7.9811, status: "ACTIVE", ownerId: owner1Id,
    logoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
  });
  await db.insert(subscriptionsTable).values({ id: uuidv4(), providerId: p1Id, plan: "PRO", status: "active" });

  const s1_f = uuidv4(), s1_h = uuidv4(), s1_c = uuidv4();
  await db.insert(staffTable).values([
    { id: s1_f, providerId: p1Id, name: "Fatima Benali", bio: "Spécialiste coiffure femme, 8 ans d'expérience", isActive: true },
    { id: s1_h, providerId: p1Id, name: "Youssef Amrani", bio: "Expert coiffure homme et barbe", isActive: true },
    { id: s1_c, providerId: p1Id, name: "Sara Mouttaki", bio: "Coloriste certifiée, formations Paris", isActive: true },
  ]);

  const p1Svc1 = uuidv4(), p1Svc2 = uuidv4(), p1Svc3 = uuidv4(), p1Svc4 = uuidv4();
  await db.insert(servicesTable).values([
    { id: p1Svc1, providerId: p1Id, name: "Coupe femme", description: "Coupe + brushing inclus", durationMinutes: 45, priceCents: 18000, bufferMinutes: 10 },
    { id: p1Svc2, providerId: p1Id, name: "Coupe homme", description: "Coupe + finition", durationMinutes: 30, priceCents: 8000, bufferMinutes: 5 },
    { id: p1Svc3, providerId: p1Id, name: "Coloration complète", description: "Coloration + soin + brushing", durationMinutes: 120, priceCents: 45000, bufferMinutes: 15 },
    { id: p1Svc4, providerId: p1Id, name: "Soin kératine", description: "Traitement lissant longue durée", durationMinutes: 90, priceCents: 35000, bufferMinutes: 10 },
  ]);
  await db.insert(serviceStaffTable).values([
    { serviceId: p1Svc1, staffId: s1_f },
    { serviceId: p1Svc1, staffId: s1_c },
    { serviceId: p1Svc2, staffId: s1_h },
    { serviceId: p1Svc3, staffId: s1_c },
    { serviceId: p1Svc4, staffId: s1_f },
    { serviceId: p1Svc4, staffId: s1_c },
  ]);

  // Lun-Sam 9h-19h, fermé Dim
  for (let day = 1; day <= 6; day++) {
    await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p1Id, dayOfWeek: day, openTime: "09:00", closeTime: "19:00", isClosed: false });
  }
  await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p1Id, dayOfWeek: 0, openTime: "09:00", closeTime: "19:00", isClosed: true });

  // ── PROVIDER 2: Institut Élégance (ESTABLISHMENT, Casablanca)
  const p2Id = uuidv4();
  await db.insert(providersTable).values({
    id: p2Id, type: "ESTABLISHMENT", name: "Institut Élégance", slug: "institut-elegance",
    description: "Institut de beauté haut de gamme au Maarif. Soins visage, manucure et épilation par des expertes.",
    phone: "+212522271800", email: "elegance@salon.ma", address: "23 Rue Al Aaïoun, Maarif",
    city: "Casablanca", latitude: 33.5731, longitude: -7.5898, status: "ACTIVE", ownerId: owner2Id,
    logoUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
  });
  await db.insert(subscriptionsTable).values({ id: uuidv4(), providerId: p2Id, plan: "PRO", status: "active" });

  const s2_n = uuidv4(), s2_k = uuidv4(), s2_ho = uuidv4();
  await db.insert(staffTable).values([
    { id: s2_n, providerId: p2Id, name: "Nadia Chraibi", bio: "Esthéticienne, spécialiste soins visage anti-âge", isActive: true },
    { id: s2_k, providerId: p2Id, name: "Karima Filali", bio: "Manucure et nail art, 5 ans d'expérience", isActive: true },
    { id: s2_ho, providerId: p2Id, name: "Houda Essalhi", bio: "Épilation experte, cire orientale et brésilienne", isActive: true },
  ]);

  const p2Svc1 = uuidv4(), p2Svc2 = uuidv4(), p2Svc3 = uuidv4();
  await db.insert(servicesTable).values([
    { id: p2Svc1, providerId: p2Id, name: "Soin visage hydratant", description: "Nettoyage + soin + masque hydratant", durationMinutes: 60, priceCents: 28000, bufferMinutes: 10 },
    { id: p2Svc2, providerId: p2Id, name: "Manucure classique", description: "Lime + soin + vernis couleur", durationMinutes: 45, priceCents: 15000, bufferMinutes: 5 },
    { id: p2Svc3, providerId: p2Id, name: "Épilation sourcils", description: "Mise en forme + épilation", durationMinutes: 15, priceCents: 4000, bufferMinutes: 5 },
  ]);
  await db.insert(serviceStaffTable).values([
    { serviceId: p2Svc1, staffId: s2_n },
    { serviceId: p2Svc2, staffId: s2_k },
    { serviceId: p2Svc3, staffId: s2_ho },
  ]);

  // Mar-Sam 10h-20h, fermé Dim-Lun
  for (let day = 2; day <= 6; day++) {
    await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p2Id, dayOfWeek: day, openTime: "10:00", closeTime: "20:00", isClosed: false });
  }
  await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p2Id, dayOfWeek: 0, openTime: "10:00", closeTime: "20:00", isClosed: true });
  await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p2Id, dayOfWeek: 1, openTime: "10:00", closeTime: "20:00", isClosed: true });

  // ── PROVIDER 3: Sara à domicile (INDIVIDUAL, Rabat)
  const p3Id = uuidv4();
  await db.insert(providersTable).values({
    id: p3Id, type: "INDIVIDUAL", name: "Sara à domicile", slug: "sara-domicile",
    description: "Coiffeuse professionnelle à domicile sur Rabat et alentours. Flexibilité et confort chez vous.",
    phone: "+212537123456", email: "sara@domicile.ma", address: "Rabat",
    city: "Rabat", latitude: 34.0209, longitude: -6.8416, status: "ACTIVE", ownerId: owner3Id,
    logoUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80",
  });
  await db.insert(subscriptionsTable).values({ id: uuidv4(), providerId: p3Id, plan: "FREE", status: "active" });

  const s3_self = uuidv4();
  await db.insert(staffTable).values([
    { id: s3_self, providerId: p3Id, name: "Sara Idrissi", bio: "Coiffeuse diplômée, 6 ans d'expérience. Déplacement inclus sur Rabat.", isActive: true },
  ]);

  const p3Svc1 = uuidv4(), p3Svc2 = uuidv4();
  await db.insert(servicesTable).values([
    { id: p3Svc1, providerId: p3Id, name: "Coupe à domicile", description: "Coupe + finition, déplacement inclus", durationMinutes: 60, priceCents: 20000, bufferMinutes: 30 },
    { id: p3Svc2, providerId: p3Id, name: "Brushing à domicile", description: "Brushing professionnel + déplacement", durationMinutes: 45, priceCents: 15000, bufferMinutes: 30 },
  ]);
  await db.insert(serviceStaffTable).values([
    { serviceId: p3Svc1, staffId: s3_self },
    { serviceId: p3Svc2, staffId: s3_self },
  ]);

  // Lun-Ven 9h-18h
  for (let day = 1; day <= 5; day++) {
    await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p3Id, dayOfWeek: day, openTime: "09:00", closeTime: "18:00", isClosed: false });
  }
  await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p3Id, dayOfWeek: 0, openTime: "09:00", closeTime: "18:00", isClosed: true });
  await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p3Id, dayOfWeek: 6, openTime: "09:00", closeTime: "18:00", isClosed: true });

  // ── PROVIDER 4: Hammam Zitoun (ESTABLISHMENT, Fès)
  const owner4Id = uuidv4();
  await db.insert(usersTable).values({
    id: owner4Id, email: "zitoun@hammam.ma", phone: "+212535621800", name: "Omar Bennani",
    passwordHash, role: "OWNER", phoneVerified: true, emailVerified: true,
  });

  const p4Id = uuidv4();
  await db.insert(providersTable).values({
    id: p4Id, type: "ESTABLISHMENT", name: "Hammam Zitoun", slug: "hammam-zitoun",
    description: "Hammam traditionnel marocain et spa moderne en plein cœur de la Médina de Fès. Soins du corps, gommage, massage et enveloppements au ghassoul. Une parenthèse de bien-être authentique.",
    phone: "+212535621800", email: "zitoun@hammam.ma", address: "12 Derb Zitoun, Médina",
    city: "Fès", latitude: 34.0633, longitude: -4.9794, status: "ACTIVE", ownerId: owner4Id,
    logoUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80",
  });
  await db.insert(subscriptionsTable).values({ id: uuidv4(), providerId: p4Id, plan: "PRO", status: "active" });

  const s4_l = uuidv4(), s4_k = uuidv4(), s4_m = uuidv4(), s4_r = uuidv4();
  await db.insert(staffTable).values([
    {
      id: s4_l, providerId: p4Id, name: "Leila Bennani",
      bio: "Masseuse certifiée, spécialiste hammam traditionnel et soins au ghassoul. 10 ans d'expérience.",
      photoUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      id: s4_k, providerId: p4Id, name: "Kenza Filali",
      bio: "Esthéticienne spécialisée soins visage et enveloppements au khôl et argan.",
      photoUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      id: s4_m, providerId: p4Id, name: "Mohammed Alaoui",
      bio: "Maître kessala, gommage traditionnel et massage aux huiles essentielles du Maroc.",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      id: s4_r, providerId: p4Id, name: "Rania Ouazzani",
      bio: "Spécialiste modelage corps, réflexologie et soins anti-stress. Formation en Thaïlande.",
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&auto=format&fit=crop&q=80",
      isActive: true,
    },
  ]);

  const p4Svc1 = uuidv4(), p4Svc2 = uuidv4(), p4Svc3 = uuidv4(), p4Svc4 = uuidv4(), p4Svc5 = uuidv4();
  await db.insert(servicesTable).values([
    { id: p4Svc1, providerId: p4Id, name: "Hammam traditionnel", description: "Bain de vapeur + gommage kessa + savon beldi", durationMinutes: 60, priceCents: 22000, bufferMinutes: 15 },
    { id: p4Svc2, providerId: p4Id, name: "Massage aux huiles d'argan", description: "Massage corps complet aux huiles essentielles d'argan du Maroc", durationMinutes: 60, priceCents: 35000, bufferMinutes: 10 },
    { id: p4Svc3, providerId: p4Id, name: "Soin visage au ghassoul", description: "Nettoyage + masque ghassoul + soin hydratant à la rose", durationMinutes: 45, priceCents: 28000, bufferMinutes: 10 },
    { id: p4Svc4, providerId: p4Id, name: "Pack Hammam + Massage", description: "Hammam traditionnel complet suivi d'un massage relaxant 30min", durationMinutes: 90, priceCents: 50000, bufferMinutes: 15 },
    { id: p4Svc5, providerId: p4Id, name: "Enveloppement au rhassoul", description: "Masque corps complet au ghassoul de l'Atlas, rinçage inclus", durationMinutes: 45, priceCents: 25000, bufferMinutes: 10 },
  ]);
  await db.insert(serviceStaffTable).values([
    { serviceId: p4Svc1, staffId: s4_l },
    { serviceId: p4Svc1, staffId: s4_m },
    { serviceId: p4Svc2, staffId: s4_m },
    { serviceId: p4Svc2, staffId: s4_r },
    { serviceId: p4Svc3, staffId: s4_k },
    { serviceId: p4Svc3, staffId: s4_l },
    { serviceId: p4Svc4, staffId: s4_l },
    { serviceId: p4Svc4, staffId: s4_m },
    { serviceId: p4Svc4, staffId: s4_r },
    { serviceId: p4Svc5, staffId: s4_k },
    { serviceId: p4Svc5, staffId: s4_l },
  ]);

  // Tous les jours 9h-21h
  for (let day = 0; day <= 6; day++) {
    await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p4Id, dayOfWeek: day, openTime: "09:00", closeTime: "21:00", isClosed: false });
  }

  // ── BOOKINGS (~60% fill on the next 7 days)
  const staffWithServices = [
    { providerId: p1Id, staffId: s1_f, serviceId: p1Svc1, priceCents: 18000 },
    { providerId: p1Id, staffId: s1_h, serviceId: p1Svc2, priceCents: 8000 },
    { providerId: p1Id, staffId: s1_c, serviceId: p1Svc3, priceCents: 45000 },
    { providerId: p2Id, staffId: s2_n, serviceId: p2Svc1, priceCents: 28000 },
    { providerId: p2Id, staffId: s2_k, serviceId: p2Svc2, priceCents: 15000 },
    { providerId: p3Id, staffId: s3_self, serviceId: p3Svc1, priceCents: 20000 },
    { providerId: p4Id, staffId: s4_l, serviceId: p4Svc1, priceCents: 22000 },
    { providerId: p4Id, staffId: s4_m, serviceId: p4Svc2, priceCents: 35000 },
    { providerId: p4Id, staffId: s4_r, serviceId: p4Svc4, priceCents: 50000 },
  ];

  const bookingRows = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const clients = [clientId1, clientId2];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today.getTime() + dayOffset * 86400_000);
    const dayOfWeek = date.getUTCDay();

    for (const combo of staffWithServices) {
      const slots = [9, 10, 11, 14, 15, 16, 17];
      for (const hour of slots) {
        if (Math.random() > 0.6) continue;
        const start = new Date(date);
        start.setUTCHours(hour, 0, 0, 0);
        const end = new Date(start.getTime() + 60 * 60_000);

        bookingRows.push({
          id: uuidv4(),
          providerId: combo.providerId,
          serviceId: combo.serviceId,
          staffId: combo.staffId,
          clientId: clients[Math.floor(Math.random() * clients.length)],
          startDatetime: start,
          endDatetime: end,
          status: "CONFIRMED" as const,
          amountCents: combo.priceCents,
          paymentStatus: "paid",
          paymentIntentId: `pi_seed_${uuidv4()}`,
          lockedUntil: null,
        });
      }
    }
  }

  if (bookingRows.length > 0) {
    for (let i = 0; i < bookingRows.length; i += 20) {
      await db.insert(bookingsTable).values(bookingRows.slice(i, i + 20)).onConflictDoNothing();
    }
  }

  // ── REVIEWS
  await db.insert(reviewsTable).values([
    { id: uuidv4(), providerId: p1Id, bookingId: bookingRows[0]?.id ?? uuidv4(), clientId: clientId1, rating: 5, comment: "Excellente prestation, Fatima est vraiment professionnelle !" },
    { id: uuidv4(), providerId: p1Id, bookingId: bookingRows[1]?.id ?? uuidv4(), clientId: clientId2, rating: 5, comment: "Youssef est top, coupe parfaite. Je recommande vivement." },
    { id: uuidv4(), providerId: p2Id, bookingId: bookingRows[3]?.id ?? uuidv4(), clientId: clientId2, rating: 4, comment: "Très bon soin, je reviendrai." },
    { id: uuidv4(), providerId: p2Id, bookingId: bookingRows[4]?.id ?? uuidv4(), clientId: clientId1, rating: 5, comment: "Karima est une artiste du nail art, résultat magnifique !" },
    { id: uuidv4(), providerId: p4Id, bookingId: bookingRows[6]?.id ?? uuidv4(), clientId: clientId1, rating: 5, comment: "Une expérience hors du temps. Le hammam Zitoun est authentique et le personnel aux petits soins. On repart ressourcé." },
    { id: uuidv4(), providerId: p4Id, bookingId: bookingRows[7]?.id ?? uuidv4(), clientId: clientId2, rating: 5, comment: "Le massage aux huiles d'argan de Mohammed est exceptionnel. L'endroit est magnifique, au cœur de la médina." },
    { id: uuidv4(), providerId: p4Id, bookingId: bookingRows[8]?.id ?? uuidv4(), clientId: clientId1, rating: 4, comment: "Très belle découverte. Leila est professionnelle et douce. Le soin ghassoul est incroyable." },
  ]).onConflictDoNothing();

  console.log(`✅ Seed complete!`);
  console.log(`   Providers: 4`);
  console.log(`   Staff: 11`);
  console.log(`   Services: 14`);
  console.log(`   Bookings: ${bookingRows.length}`);
  console.log(`\n📧 Test accounts:`);
  console.log(`   Client:     yasmine@client.ma   / password123`);
  console.log(`   Owner 1:    atlas@salon.ma       / password123 (Salon Atlas)`);
  console.log(`   Owner 2:    elegance@salon.ma    / password123 (Institut Elegance)`);
  console.log(`   Owner 3:    sara@domicile.ma     / password123 (Sara a domicile)`);
  console.log(`   Owner 4:    zitoun@hammam.ma     / password123 (Hammam Zitoun)`);

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
