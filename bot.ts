
import { IStorage } from "../storage";
import TelegramBot from "node-telegram-bot-api";
import { getGmailService } from "./google_auth";
import { google } from "googleapis";

export class BotService {
  private storage: IStorage;
  private bot: TelegramBot | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async start() {
    console.log("Starting Bot Service (Gmail API)...");
    const settings = await this.storage.getSettings();
    if (!settings || !settings.telegramToken) {
      console.log("Missing settings, cannot start bot.");
      return;
    }

    if (this.bot) {
        try {
             await this.bot.stopPolling();
        } catch (e) {
            // ignore
        }
    }

    try {
        this.bot = new TelegramBot(settings.telegramToken, { polling: false }); 
    } catch (error) {
        console.error("Failed to initialize Telegram Bot:", error);
    }

    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(() => this.checkEmails(), 60 * 1000); 
    this.checkEmails(); 
  }

  async stop() {
    console.log("Stopping Bot Service...");
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = null;
    this.bot = null;
  }

  async restart() {
    await this.stop();
    await this.start();
  }

  async testConnection(): Promise<boolean> {
      try {
          const gmail = await getGmailService();
          await gmail.users.getProfile({ userId: 'me' });
          
          const settings = await this.storage.getSettings();
          if (settings?.telegramToken) {
              const tempBot = new TelegramBot(settings.telegramToken, { polling: false });
              await tempBot.getMe();
          }
          return true;
      } catch (error: any) {
          throw new Error("Connection Failed: " + error.message);
      }
  }

  private async checkEmails() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const gmail = await getGmailService();
      const settings = await this.storage.getSettings();
      
      const query = `newer_than:1d "verification" OR "code" OR "код" OR "подтверждение" ${settings?.filterSubject ? `subject:(${settings.filterSubject})` : ''}`;
      
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 10
      });

      const messages = res.data.messages || [];

      for (const msgInfo of messages) {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: msgInfo.id!,
          format: 'full'
        });

        // Check if we already processed this message ID by checking content or ID? 
        // For simplicity, let's assume we filter by "UNREAD" if we want to mark seen, 
        // but the Python script used "newer_than". 
        // Let's add a label check or just mark as read.

        const payload = msg.data.payload;
        const headers = payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || "No Subject";
        
        let body = "";
        if (payload?.parts) {
            body = payload.parts[0].body?.data || "";
        } else {
            body = payload?.body?.data || "";
        }

        if (body) {
            const decodedBody = Buffer.from(body, 'base64').toString('utf-8');
            const codeRegex = /\b\d{6}\b|[A-Z0-9]{6,8}\b/g;
            const matches = decodedBody.match(codeRegex);

            if (matches && matches.length > 0) {
                const code = matches[0];
                
                // Save to DB
                await this.storage.createCode({
                    code,
                    source: subject,
                    content: decodedBody.substring(0, 200)
                });

                // Send to Telegram
                if (this.bot && settings?.telegramChatId) {
                    await this.bot.sendMessage(settings.telegramChatId, `🔐 **New Code Found (API)**\n\nCode: \`${code}\`\nSource: ${subject}`, { parse_mode: 'Markdown' });
                }
                
                // Mark as read to avoid duplicate processing in next run
                await gmail.users.messages.batchModify({
                    userId: 'me',
                    requestBody: {
                        ids: [msgInfo.id!],
                        removeLabelIds: ['UNREAD']
                    }
                });
            }
        }
      }
    } catch (error) {
      console.error("Error checking emails (Gmail API):", error);
    } finally {
      this.isProcessing = false;
    }
  }
}
