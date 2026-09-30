import { Router } from 'express';
import crypto from 'node:crypto';
import { store, save } from '../lib/store.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Any authenticated user can read the role list (needed to render badges, filters, etc.)
router.get('/', (req, res) => {
  res.json({ roles: store.roles });
});

router.use(requireRole());

router.post('/', (req, res) => {
  const { key, label } = req.body ?? {};
  if (!key || !label) return res.status(400).json({ error: 'Clé et libellé requis' });
  const normalizedKey = key.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
  if (store.roles.some((r) => r.key === normalizedKey)) {
    return res.status(409).json({ error: 'Ce rôle existe déjà' });
  }
  const role = { id: crypto.randomUUID(), key: normalizedKey, label, createdAt: new Date().toISOString() };
  store.roles.push(role);
  save();
  res.status(201).json({ role });
});

router.delete('/:id', (req, res) => {
  const index = store.roles.findIndex((r) => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Rôle introuvable' });
  const [role] = store.roles.splice(index, 1);
  store.users.forEach((u) => {
    u.roles = u.roles.filter((k) => k !== role.key);
  });
  save();
  res.json({ ok: true });
});

export default router;
