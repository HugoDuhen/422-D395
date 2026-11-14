import { query } from '../lib/db.js';
import { mapUser } from '../lib/mappers.js';
import { verifyToken } from '../lib/auth.js';

export async function authenticate(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });

  try {
    const payload = verifyToken(token);
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [payload.sub]);
    const user = mapUser(rows[0]);
    if (!user || !user.active) return res.status(401).json({ error: 'Non authentifié' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Session invalide' });
  }
}

export function requireRole(...roleKeys) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Non authentifié' });
    if (user.isAdmin) return next();
    const allowed = roleKeys.some((key) => user.roles.includes(key));
    if (!allowed) return res.status(403).json({ error: 'Accès refusé' });
    next();
  };
}
