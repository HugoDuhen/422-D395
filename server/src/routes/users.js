import { Router } from 'express';
import crypto from 'node:crypto';
import { store, save } from '../lib/store.js';
import { hashPassword, publicUser } from '../lib/auth.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Read-only directory: admin + "cadre" role can see everyone's info.
router.get('/directory', requireRole('cadre'), (req, res) => {
  res.json({ users: store.users.map(publicUser) });
});

router.use(requireRole());

router.get('/', (req, res) => {
  res.json({ users: store.users.map(publicUser) });
});

router.post('/', async (req, res) => {
  const { email, password, firstName, lastName, isAdmin, roleKeys } = req.body ?? {};
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Champs manquants' });
  }
  const normalizedEmail = email.toLowerCase().trim();
  if (store.users.some((u) => u.email === normalizedEmail)) {
    return res.status(409).json({ error: 'Cet email existe déjà' });
  }
  const validKeys = new Set(store.roles.map((r) => r.key));

  const user = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    firstName,
    lastName,
    isAdmin: !!isAdmin,
    active: true,
    roles: Array.isArray(roleKeys) ? roleKeys.filter((k) => validKeys.has(k)) : [],
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  save();
  res.status(201).json({ user: publicUser(user) });
});

router.put('/:id', async (req, res) => {
  const user = store.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  const { firstName, lastName, isAdmin, active, password, roleKeys } = req.body ?? {};
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (isAdmin !== undefined) user.isAdmin = !!isAdmin;
  if (active !== undefined) user.active = !!active;
  if (password) user.passwordHash = await hashPassword(password);
  if (Array.isArray(roleKeys)) {
    const validKeys = new Set(store.roles.map((r) => r.key));
    user.roles = roleKeys.filter((k) => validKeys.has(k));
  }
  save();
  res.json({ user: publicUser(user) });
});

router.delete('/:id', (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Impossible de te supprimer toi-même' });
  const index = store.users.findIndex((u) => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Utilisateur introuvable' });
  store.users.splice(index, 1);
  save();
  res.json({ ok: true });
});

export default router;
