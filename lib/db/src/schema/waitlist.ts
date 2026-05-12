import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const waitlistEntries = pgTable("waitlist_entries", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WaitlistEntry = typeof waitlistEntries.$inferSelect;
