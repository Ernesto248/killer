import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;
const connection = postgres(connectionString, {
  max: 1,
  connect_timeout: 30,
  idle_timeout: 5,
});
export const db = drizzle(connection, { schema });
