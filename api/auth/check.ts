import { verifyToken } from '../_auth';

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts[0].trim();
    if (name) {
      cookies[name] = decodeURIComponent(parts.slice(1).join('='));
    }
  });
  return cookies;
}

export default function handler(req: any, res: any) {
  // Allow only GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const cookies = parseCookies(req.headers.cookie);
  const token = cookies['site_auth_token'];

  const isValid = verifyToken(token);
  return res.status(200).json({ authenticated: isValid });
}
