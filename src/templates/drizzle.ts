export const drizzleConfig = `
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
`;

export const drizzleClient = `
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@/db/schema";

const client = createClient({
  url: process.env.DATABASE_URL!,
});

export const db = drizzle(client, { schema });
`;

export const drizzleSchema = `
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const posts = sqliteTable("post", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content"),
  createdAt: text("created_at")
    .default(sql\`CURRENT_TIMESTAMP\`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql\`CURRENT_TIMESTAMP\`)
    .notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;
`;
