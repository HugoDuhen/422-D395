import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Any authenticated user can read the role list (needed to render badges, filters, etc.)
router.get('/', async (req, res) => {
  const roles = await prisma.role.findMany({ orderBy: { label: 'asc' } });
  res.json({ roles });
});

router.use(requireRole());

router.post('/', async (req, res) => {
  const { key, label } = req.body ?? {};
  if (!key || !label) return res.status(400).json({ error: 'Clé et libellé requis' });
  const normalizedKey = key.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
  const existing = await prisma.role.findUnique({ where: { key: normalizedKey } });
  if (existing) return res.status(409).json({ error: 'Ce rôle existe déjà' });
  const role = await prisma.role.create({ data: { key: normalizedKey, label } });
  res.status(201).json({ role });
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.role.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Rôle introuvable' });
  }
});

export default router;
