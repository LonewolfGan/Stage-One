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

export async function runSeed() {
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

  // ── PROVIDER 5: Coiffure Wafa (INDIVIDUAL, Casablanca)
  const owner5Id = uuidv4();
  await db.insert(usersTable).values({
    id: owner5Id, email: "wafa@coiffure.ma", phone: "+212661234501", name: "Wafa El Alaoui",
    passwordHash, role: "OWNER", phoneVerified: true, emailVerified: true,
  });
  const p5Id = uuidv4();
  await db.insert(providersTable).values({
    id: p5Id, type: "INDIVIDUAL", name: "Coiffure Wafa", slug: "coiffure-wafa",
    description: "Coiffeuse professionnelle à domicile sur Casablanca. Diplômée de l'OFPPT, formations Paris et Dubaï. Produits L'Oréal Professionnel exclusivement.",
    phone: "+212661234501", email: "wafa@coiffure.ma", address: "Hay Hassani, Casablanca",
    city: "Casablanca", latitude: 33.5568, longitude: -7.6572, status: "ACTIVE", ownerId: owner5Id,
    logoUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80",
  });
  await db.insert(subscriptionsTable).values({ id: uuidv4(), providerId: p5Id, plan: "FREE", status: "active" });

  const s5_self = uuidv4();
  await db.insert(staffTable).values({
    id: s5_self, providerId: p5Id, name: "Wafa El Alaoui",
    bio: "Coiffeuse diplômée, 9 ans d'expérience. Spécialiste balayage, kératine et coupe femme. Déplacement inclus sur tout Casablanca.",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&auto=format&fit=crop&q=80",
    isActive: true,
  });
  const p5Svc1 = uuidv4(), p5Svc2 = uuidv4(), p5Svc3 = uuidv4(), p5Svc4 = uuidv4();
  await db.insert(servicesTable).values([
    { id: p5Svc1, providerId: p5Id, name: "Coupe femme à domicile", description: "Coupe + finition + déplacement inclus sur Casablanca", durationMinutes: 60, priceCents: 22000, bufferMinutes: 30 },
    { id: p5Svc2, providerId: p5Id, name: "Balayage californien", description: "Balayage complet + soin + brushing, produits L'Oréal", durationMinutes: 150, priceCents: 65000, bufferMinutes: 15 },
    { id: p5Svc3, providerId: p5Id, name: "Brushing à domicile", description: "Brushing professionnel, déplacement inclus", durationMinutes: 45, priceCents: 16000, bufferMinutes: 30 },
    { id: p5Svc4, providerId: p5Id, name: "Soin kératine brésilien", description: "Lissage longue durée + soin restructurant, 3h", durationMinutes: 180, priceCents: 80000, bufferMinutes: 15 },
  ]);
  await db.insert(serviceStaffTable).values([
    { serviceId: p5Svc1, staffId: s5_self },
    { serviceId: p5Svc2, staffId: s5_self },
    { serviceId: p5Svc3, staffId: s5_self },
    { serviceId: p5Svc4, staffId: s5_self },
  ]);
  for (let day = 1; day <= 6; day++) {
    await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p5Id, dayOfWeek: day, openTime: "09:00", closeTime: "18:30", isClosed: false });
  }
  await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p5Id, dayOfWeek: 0, openTime: "09:00", closeTime: "18:30", isClosed: true });

  // ── PROVIDER 6: Barbershop Le Sultan (ESTABLISHMENT, Rabat – Agdal)
  const owner6Id = uuidv4();
  await db.insert(usersTable).values({
    id: owner6Id, email: "sultan@barbershop.ma", phone: "+212537781200", name: "Khalid Regragui",
    passwordHash, role: "OWNER", phoneVerified: true, emailVerified: true,
  });
  const p6Id = uuidv4();
  await db.insert(providersTable).values({
    id: p6Id, type: "ESTABLISHMENT", name: "Barbershop Le Sultan", slug: "barbershop-sultan",
    description: "Barbershop moderne au cœur d'Agdal. Coupe homme, rasage rasoir droit, barbe design et soins visage. Ambiance soignée, café offert. Le barbier de référence à Rabat depuis 2019.",
    phone: "+212537781200", email: "sultan@barbershop.ma", address: "15 Avenue Fal Ould Oumeir, Agdal",
    city: "Rabat", latitude: 33.9716, longitude: -6.8498, status: "ACTIVE", ownerId: owner6Id,
    logoUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80",
  });
  await db.insert(subscriptionsTable).values({ id: uuidv4(), providerId: p6Id, plan: "PRO", status: "active" });

  const s6_k = uuidv4(), s6_a = uuidv4();
  await db.insert(staffTable).values([
    {
      id: s6_k, providerId: p6Id, name: "Khalid Regragui",
      bio: "Maître barbier, 12 ans d'expérience. Spécialiste rasage rasoir droit et barbe de créateur.",
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      id: s6_a, providerId: p6Id, name: "Adam Tazi",
      bio: "Barbier certifié, expert coupe homme et dégradé américain.",
      photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&auto=format&fit=crop&q=80",
      isActive: true,
    },
  ]);
  const p6Svc1 = uuidv4(), p6Svc2 = uuidv4(), p6Svc3 = uuidv4(), p6Svc4 = uuidv4();
  await db.insert(servicesTable).values([
    { id: p6Svc1, providerId: p6Id, name: "Coupe homme", description: "Coupe + dégradé + finition styling", durationMinutes: 30, priceCents: 9000, bufferMinutes: 5 },
    { id: p6Svc2, providerId: p6Id, name: "Rasage rasoir droit", description: "Rasage traditionnel + serviette chaude + soin après-rasage", durationMinutes: 30, priceCents: 12000, bufferMinutes: 10 },
    { id: p6Svc3, providerId: p6Id, name: "Barbe design", description: "Taille + mise en forme + contour précis", durationMinutes: 20, priceCents: 8000, bufferMinutes: 5 },
    { id: p6Svc4, providerId: p6Id, name: "Forfait Sultan complet", description: "Coupe + barbe design + rasage rasoir + soin visage", durationMinutes: 75, priceCents: 25000, bufferMinutes: 10 },
  ]);
  await db.insert(serviceStaffTable).values([
    { serviceId: p6Svc1, staffId: s6_k },
    { serviceId: p6Svc1, staffId: s6_a },
    { serviceId: p6Svc2, staffId: s6_k },
    { serviceId: p6Svc3, staffId: s6_k },
    { serviceId: p6Svc3, staffId: s6_a },
    { serviceId: p6Svc4, staffId: s6_k },
  ]);
  // Mar-Dim 10h-20h, fermé Lun
  for (let day = 2; day <= 6; day++) {
    await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p6Id, dayOfWeek: day, openTime: "10:00", closeTime: "20:00", isClosed: false });
  }
  await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p6Id, dayOfWeek: 0, openTime: "10:00", closeTime: "20:00", isClosed: false });
  await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p6Id, dayOfWeek: 1, openTime: "10:00", closeTime: "20:00", isClosed: true });

  // ── PROVIDER 7: Spa & Institut Palmeraie (ESTABLISHMENT, Marrakech)
  const owner7Id = uuidv4();
  await db.insert(usersTable).values({
    id: owner7Id, email: "palmeraie@spa.ma", phone: "+212524368800", name: "Salima Bensouda",
    passwordHash, role: "OWNER", phoneVerified: true, emailVerified: true,
  });
  const p7Id = uuidv4();
  await db.insert(providersTable).values({
    id: p7Id, type: "ESTABLISHMENT", name: "Spa & Institut Palmeraie", slug: "spa-palmeraie",
    description: "Havre de paix au cœur de la Palmeraie de Marrakech. Massages signature, soins visage à l'argan et au ghassoul, bains flottants et rituels corps inspirés de la tradition marocaine.",
    phone: "+212524368800", email: "palmeraie@spa.ma", address: "Route de la Palmeraie, Km 5, Marrakech",
    city: "Marrakech", latitude: 31.6829, longitude: -7.9459, status: "ACTIVE", ownerId: owner7Id,
    logoUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
  });
  await db.insert(subscriptionsTable).values({ id: uuidv4(), providerId: p7Id, plan: "PRO", status: "active" });

  const s7_s = uuidv4(), s7_n = uuidv4(), s7_h = uuidv4();
  await db.insert(staffTable).values([
    {
      id: s7_s, providerId: p7Id, name: "Salima Bensouda",
      bio: "Directrice et masseuse certifiée, spécialiste soins argan et rituels marocains. Formation en Thaïlande et à Paris.",
      photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      id: s7_n, providerId: p7Id, name: "Nour Kadiri",
      bio: "Esthéticienne haut de gamme, experte soins visage anti-âge et enveloppements corps.",
      photoUrl: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=400&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      id: s7_h, providerId: p7Id, name: "Hassan Elbacha",
      bio: "Kinésithérapeute et masseur, spécialiste décontraction musculaire et massage sportif.",
      photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&auto=format&fit=crop&q=80",
      isActive: true,
    },
  ]);
  const p7Svc1 = uuidv4(), p7Svc2 = uuidv4(), p7Svc3 = uuidv4(), p7Svc4 = uuidv4();
  await db.insert(servicesTable).values([
    { id: p7Svc1, providerId: p7Id, name: "Massage relaxant aux pierres chaudes", description: "Massage corps complet + pierres volcaniques + huiles essentielles Maroc", durationMinutes: 75, priceCents: 55000, bufferMinutes: 15 },
    { id: p7Svc2, providerId: p7Id, name: "Soin visage à l'argan royal", description: "Nettoyage profond + masque argan + sérum + modelage visage", durationMinutes: 60, priceCents: 42000, bufferMinutes: 10 },
    { id: p7Svc3, providerId: p7Id, name: "Rituel corps complet", description: "Hammam privatif 30min + gommage kessa + enveloppement ghassoul + massage 45min", durationMinutes: 120, priceCents: 85000, bufferMinutes: 20 },
    { id: p7Svc4, providerId: p7Id, name: "Massage signature Palmeraie", description: "Massage signature exclusif aux huiles de rose de Dadès et argan, 90 minutes", durationMinutes: 90, priceCents: 70000, bufferMinutes: 15 },
  ]);
  await db.insert(serviceStaffTable).values([
    { serviceId: p7Svc1, staffId: s7_s },
    { serviceId: p7Svc1, staffId: s7_h },
    { serviceId: p7Svc2, staffId: s7_n },
    { serviceId: p7Svc2, staffId: s7_s },
    { serviceId: p7Svc3, staffId: s7_s },
    { serviceId: p7Svc3, staffId: s7_h },
    { serviceId: p7Svc4, staffId: s7_s },
    { serviceId: p7Svc4, staffId: s7_h },
  ]);
  for (let day = 0; day <= 6; day++) {
    await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p7Id, dayOfWeek: day, openTime: "09:00", closeTime: "21:00", isClosed: false });
  }

  // ── PROVIDER 8: Nails Factory Tanger (ESTABLISHMENT, Tanger)
  const owner8Id = uuidv4();
  await db.insert(usersTable).values({
    id: owner8Id, email: "nails@tanger.ma", phone: "+212539942211", name: "Imane Boudra",
    passwordHash, role: "OWNER", phoneVerified: true, emailVerified: true,
  });
  const p8Id = uuidv4();
  await db.insert(providersTable).values({
    id: p8Id, type: "ESTABLISHMENT", name: "Nails Factory Tanger", slug: "nails-factory-tanger",
    description: "Studio beauté ongles haut de gamme au centre de Tanger. Manucure, pédicure, nail art, pose gel et semi-permanent. Matériel stérilisé entre chaque cliente. Réservation en ligne disponible.",
    phone: "+212539942211", email: "nails@tanger.ma", address: "8 Rue de Fès, Centre-ville",
    city: "Tanger", latitude: 35.7672, longitude: -5.7995, status: "ACTIVE", ownerId: owner8Id,
    logoUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80",
  });
  await db.insert(subscriptionsTable).values({ id: uuidv4(), providerId: p8Id, plan: "PRO", status: "active" });

  const s8_i = uuidv4(), s8_m = uuidv4();
  await db.insert(staffTable).values([
    {
      id: s8_i, providerId: p8Id, name: "Imane Boudra",
      bio: "Nail artist certifiée, 7 ans d'expérience. Spécialiste nail art géométrique et dégradé aquarelle.",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&auto=format&fit=crop&q=80",
      isActive: true,
    },
    {
      id: s8_m, providerId: p8Id, name: "Malak Chraibi",
      bio: "Prothésiste ongulaire, spécialiste pose gel et capsules. Résultats longue durée garantis.",
      photoUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&auto=format&fit=crop&q=80",
      isActive: true,
    },
  ]);
  const p8Svc1 = uuidv4(), p8Svc2 = uuidv4(), p8Svc3 = uuidv4(), p8Svc4 = uuidv4();
  await db.insert(servicesTable).values([
    { id: p8Svc1, providerId: p8Id, name: "Manucure classique", description: "Lime + soin + base + vernis couleur", durationMinutes: 45, priceCents: 14000, bufferMinutes: 5 },
    { id: p8Svc2, providerId: p8Id, name: "Pose semi-permanent", description: "Préparation + pose + finition UV, dure 3 semaines", durationMinutes: 60, priceCents: 22000, bufferMinutes: 10 },
    { id: p8Svc3, providerId: p8Id, name: "Nail art créatif", description: "Design personnalisé sur 10 ongles, motifs au choix", durationMinutes: 90, priceCents: 35000, bufferMinutes: 10 },
    { id: p8Svc4, providerId: p8Id, name: "Pédicure complète", description: "Soin pieds + lime + vernis gel + massage jambes", durationMinutes: 60, priceCents: 18000, bufferMinutes: 10 },
  ]);
  await db.insert(serviceStaffTable).values([
    { serviceId: p8Svc1, staffId: s8_i },
    { serviceId: p8Svc1, staffId: s8_m },
    { serviceId: p8Svc2, staffId: s8_m },
    { serviceId: p8Svc3, staffId: s8_i },
    { serviceId: p8Svc4, staffId: s8_i },
    { serviceId: p8Svc4, staffId: s8_m },
  ]);
  // Mer-Lun 10h-20h, fermé Mar
  for (let day = 3; day <= 6; day++) {
    await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p8Id, dayOfWeek: day, openTime: "10:00", closeTime: "20:00", isClosed: false });
  }
  await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p8Id, dayOfWeek: 0, openTime: "10:00", closeTime: "20:00", isClosed: false });
  await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p8Id, dayOfWeek: 1, openTime: "10:00", closeTime: "20:00", isClosed: false });
  await db.insert(businessHoursTable).values({ id: uuidv4(), providerId: p8Id, dayOfWeek: 2, openTime: "10:00", closeTime: "20:00", isClosed: true });

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
    { providerId: p5Id, staffId: s5_self, serviceId: p5Svc1, priceCents: 22000 },
    { providerId: p6Id, staffId: s6_k, serviceId: p6Svc1, priceCents: 9000 },
    { providerId: p6Id, staffId: s6_a, serviceId: p6Svc4, priceCents: 25000 },
    { providerId: p7Id, staffId: s7_s, serviceId: p7Svc1, priceCents: 55000 },
    { providerId: p7Id, staffId: s7_h, serviceId: p7Svc3, priceCents: 85000 },
    { providerId: p8Id, staffId: s8_i, serviceId: p8Svc3, priceCents: 35000 },
    { providerId: p8Id, staffId: s8_m, serviceId: p8Svc2, priceCents: 22000 },
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

  // ── BOOKINGS FIXES pour Salon Atlas (tous statuts, aujourd'hui) ──────────
  // Ces réservations garantissent que le dashboard Agenda affiche les 4 statuts
  // dès la première connexion, peu importe le jour du seed.
  const fixedAtlasBookings = [
    { hour: 9,  service: p1Svc1, staff: s1_f, client: clientId1, status: "CONFIRMED"  as const, price: 18000 },
    { hour: 11, service: p1Svc4, staff: s1_c, client: clientId2, status: "CONFIRMED"  as const, price: 35000 },
    { hour: 14, service: p1Svc3, staff: s1_c, client: clientId1, status: "PENDING"    as const, price: 45000 },
    { hour: 15, service: p1Svc2, staff: s1_h, client: clientId2, status: "CANCELLED"  as const, price: 8000  },
    { hour: 17, service: p1Svc1, staff: s1_f, client: clientId1, status: "COMPLETED"  as const, price: 18000 },
  ].map(({ hour, service, staff, client, status, price }) => {
    const start = new Date(today);
    start.setUTCHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60_000);
    return {
      id: uuidv4(),
      providerId: p1Id,
      serviceId: service,
      staffId: staff,
      clientId: client,
      startDatetime: start,
      endDatetime: end,
      status,
      amountCents: price,
      paymentStatus: status === "CONFIRMED" || status === "COMPLETED" ? "paid" : "unpaid",
      paymentIntentId: `pi_seed_${uuidv4()}`,
      lockedUntil: null,
    };
  });

  await db.insert(bookingsTable).values(fixedAtlasBookings).onConflictDoNothing();

  console.log(`✅ Seed complete!`);
  console.log(`   Providers: 8`);
  console.log(`   Staff: 20`);
  console.log(`   Services: 30`);
  console.log(`   Bookings: ${bookingRows.length + fixedAtlasBookings.length} (${fixedAtlasBookings.length} fixes + ${bookingRows.length} aléatoires)`);
  console.log(`\n📧 Test accounts:`);
  console.log(`   Client:     yasmine@client.ma      / password123`);
  console.log(`   Owner 1:    atlas@salon.ma          / password123 (Salon Atlas, Marrakech)`);
  console.log(`   Owner 2:    elegance@salon.ma       / password123 (Institut Elegance, Casablanca)`);
  console.log(`   Owner 3:    sara@domicile.ma        / password123 (Sara à domicile, Rabat)`);
  console.log(`   Owner 4:    zitoun@hammam.ma        / password123 (Hammam Zitoun, Fès)`);
  console.log(`   Owner 5:    wafa@coiffure.ma        / password123 (Coiffure Wafa, Casablanca)`);
  console.log(`   Owner 6:    sultan@barbershop.ma    / password123 (Barbershop Le Sultan, Rabat)`);
  console.log(`   Owner 7:    palmeraie@spa.ma        / password123 (Spa Palmeraie, Marrakech)`);
  console.log(`   Owner 8:    nails@tanger.ma         / password123 (Nails Factory, Tanger)`);
}

async function seed() {
  await runSeed();
  await pool.end();
  process.exit(0);
}

const isMain = process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js");
if (isMain) {
  seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
