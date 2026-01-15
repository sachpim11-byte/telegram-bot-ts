
import { db } from "./db";
import { settings, foundCodes, type Settings, type InsertSettings, type InsertFoundCode, type FoundCode } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  
  getCodes(): Promise<FoundCode[]>;
  createCode(code: InsertFoundCode): Promise<FoundCode>;
}

export class DatabaseStorage implements IStorage {
  async getSettings(): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings).limit(1);
    return setting;
  }

  async createSettings(insertSettings: InsertSettings): Promise<Settings> {
    const [setting] = await db.insert(settings).values(insertSettings).returning();
    return setting;
  }

  async updateSettings(partialSettings: Partial<InsertSettings>): Promise<Settings> {
    const existing = await this.getSettings();
    if (!existing) {
       // Create default if not exists
       return this.createSettings({
           telegramToken: "",
           telegramChatId: "",
           gmailEmail: "",
           gmailAppPassword: "",
           filterSubject: "",
           isRunning: false,
           ...partialSettings
       } as InsertSettings);
    }
    
    const [updated] = await db
      .update(settings)
      .set(partialSettings)
      .where(eq(settings.id, existing.id))
      .returning();
    return updated;
  }

  async getCodes(): Promise<FoundCode[]> {
    return db.select().from(foundCodes).orderBy(desc(foundCodes.foundAt)).limit(50);
  }

  async createCode(code: InsertFoundCode): Promise<FoundCode> {
    const [newCode] = await db.insert(foundCodes).values(code).returning();
    return newCode;
  }
}

export const storage = new DatabaseStorage();
