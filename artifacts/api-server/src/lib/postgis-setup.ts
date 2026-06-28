import { pool } from "@workspace/db";
import { logger } from "./logger";

export async function setupPostgis(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query("CREATE EXTENSION IF NOT EXISTS postgis");

    await client.query(`
      ALTER TABLE providers
      ADD COLUMN IF NOT EXISTS location geography(Point, 4326)
    `);

    await client.query(`
      UPDATE providers
      SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NULL
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS providers_location_gist
      ON providers USING GIST (location)
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION sync_provider_location()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
          NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
        ELSE
          NEW.location := NULL;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await client.query("DROP TRIGGER IF EXISTS providers_location_sync ON providers");

    await client.query(`
      CREATE TRIGGER providers_location_sync
      BEFORE INSERT OR UPDATE OF latitude, longitude ON providers
      FOR EACH ROW EXECUTE FUNCTION sync_provider_location()
    `);

    await client.query("COMMIT");
    logger.info("PostGIS setup complete");
  } catch (err) {
    await client.query("ROLLBACK");
    logger.warn({ err }, "PostGIS setup failed — geospatial search unavailable");
  } finally {
    client.release();
  }
}
