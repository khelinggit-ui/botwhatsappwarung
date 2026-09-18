export const config = {
  apiUrl: process.env.BOT_API_URL || 'http://localhost:8000',
  apiKey: process.env.API_KEY || 'bot-secret-key-2024',
  webhookPath: process.env.BOT_WEBHOOK_PATH || '/bot/webhook',
  sessionPath: process.env.SESSION_PATH || './session',
  port: parseInt(process.env.PORT || '3000'),
};
