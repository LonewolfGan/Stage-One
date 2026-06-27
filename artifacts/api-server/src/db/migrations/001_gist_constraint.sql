-- Anti-double-booking — troisième couche de protection (filet de sécurité ultime)
-- Layer 1 : Redis distributed lock (TTL 30s)
-- Layer 2 : PostgreSQL SELECT FOR UPDATE dans la transaction
-- Layer 3 : EXCLUDE USING GIST (ce fichier)

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  ADD CONSTRAINT no_overlapping_bookings
  EXCLUDE USING GIST (
    staff_id WITH =,
    tstzrange(start_datetime, end_datetime) WITH &&
  )
  WHERE (status NOT IN ('CANCELLED', 'EXPIRED'));
