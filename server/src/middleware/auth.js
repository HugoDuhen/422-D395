import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../lib/auth.js';

export async function authenticate(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: { include: { role: true } } },
    });
    if (!user || !user.active) return res.status(401).json({ error: 'Non authentifié' });
    user.roleKeys = user.roles.map((ur) => ur.role.key);
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
    const allowed = roleKeys.some((key) => user.roleKeys.includes(key));
    if (!allowed) return res.status(403).json({ error: 'Accès refusé' });
    next();
  };
}
