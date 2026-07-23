import type { VercelRequest, VercelResponse } from '@vercel/node';
import cronHandler from './cron/reminders';

export default async function handler(req: any, res: any) {
  // Direct calls to cron
  if (req.url && req.url.includes('/cron/reminders')) {
    return cronHandler(req, res);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Fallback forward to cronHandler if called at /api
  return cronHandler(req, res);
}
