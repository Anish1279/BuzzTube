import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// 🛑 FIX: Use a fallback string so the build doesn't crash if env var is missing
const connectionString = process.env.NEXT_PUBLIC_NEON_DB_CONNECTION_STRING || "postgres://placeholder:placeholder@placeholder/placeholder";

const sql = neon(connectionString);
export const db = drizzle(sql);