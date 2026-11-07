import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** One independently versioned demo workspace per authenticated ChatGPT user. */
export const demoStates = sqliteTable("demo_states", {
  userId: text("user_id").primaryKey(),
  state: text("state").notNull(),
  version: integer("version").notNull().default(1),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
