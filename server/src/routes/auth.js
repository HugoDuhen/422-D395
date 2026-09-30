import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyPassword, signToken, publicUser } from '../lib/auth.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { roles: { include: { role: true } } },
  });
  if (!user || !user.active) return res.status(401).json({ error: 'Identifiants invalides' });

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Identifiants invalides' });

  const token = signToken(user);
  res.cookie('token', token, COOKIE_OPTS);
  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTS);
  res.json({ ok: true });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
