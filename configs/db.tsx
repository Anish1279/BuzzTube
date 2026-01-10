import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Safety check: ensure the env var exists, otherwise use a dummy string for build
const connectionString = process.env.NEXT_PUBLIC_NEON_DB_CONNECTION_STRING || "postgres://dummy:dummy@dummy/dummy";

const sql = neon(connectionString);
export const db = drizzle(sql);