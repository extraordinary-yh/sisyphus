import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  state: text("state").notNull(),
  version: integer("version").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});
