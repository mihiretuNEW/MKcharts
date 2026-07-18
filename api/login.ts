import { createToken } from './_auth';

export default function handler(req: any, res: any) {
  // Allow only POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { password } = req.body || {};
  const actualPassword = process.env.SITE_PASSWORD;

  if (!actualPassword) {
    return res.status(500).json({ error: 'SITE_PASSWORD environment variable is not configured on the server' });
  }

  if (password === actualPassword) {
    const token = createToken();
    const isProd = process.env.NODE_ENV === 'production';
    
    // Set cookie: HttpOnly, SameSite=Lax, Max-Age=30 days (2592000 seconds)
    let cookie = `site_auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
    if (isProd) {
      cookie += '; Secure';
    }
    
    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ error: 'Incorrect password' });
  }
}
