import { defineConfig } from "drizzle-kit";
import path from "path";

const connectionString = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("NEON_DATABASE_URL (ou DATABASE_URL) doit être défini.");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
  tablesFilter: [
    "!spatial_ref_sys",
    "!geography_columns",
    "!geometry_columns",
    "!raster_columns",
    "!raster_overviews",
  ],
});
