
import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  telegramToken: text("telegram_token").notNull().default(""),
  telegramChatId: text("telegram_chat_id").notNull().default(""),
  gmailEmail: text("gmail_email").notNull().default(""),
  gmailAppPassword: text("gmail_app_password").notNull().default(""),
  filterSubject: text("filter_subject").default(""),
  isRunning: boolean("is_running").notNull().default(false),
});

export const foundCodes = pgTable("found_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  source: text("source").notNull(),
  content: text("content"), 
  foundAt: timestamp("found_at").defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settings);
export const insertFoundCodeSchema = createInsertSchema(foundCodes).omit({ id: true, foundAt: true });

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type FoundCode = typeof foundCodes.$inferSelect;
export type InsertFoundCode = z.infer<typeof insertFoundCodeSchema>;
