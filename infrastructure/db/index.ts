import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL no está definida");

// Client para migraciones (1 conexión)
export const migrationClient = postgres(connectionString, { max: 1 });

// Client para queries (pool)
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

export type DB = typeof db;
export * from "./schema";
