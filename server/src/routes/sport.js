import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  const entries = await prisma.sportEntry.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { firstName: true, lastName: true } } },
  });
  res.json({ entries });
});

router.post('/', requireRole('sport'), async (req, res) => {
  const { title, content } = req.body ?? {};
  if (!title || !content) return res.status(400).json({ error: 'Titre et contenu requis' });
  const entry = await prisma.sportEntry.create({
    data: { title, content, authorId: req.user.id },
  });
  res.status(201).json({ entry });
});

router.put('/:id', requireRole('sport'), async (req, res) => {
  const existing = await prisma.sportEntry.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Introuvable' });
  if (existing.authorId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Tu ne peux modifier que tes propres publications' });
  }
  const { title, content } = req.body ?? {};
  const entry = await prisma.sportEntry.update({
    where: { id: req.params.id },
    data: { title, content },
  });
  res.json({ entry });
});

router.delete('/:id', requireRole('sport'), async (req, res) => {
  const existing = await prisma.sportEntry.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Introuvable' });
  if (existing.authorId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Tu ne peux supprimer que tes propres publications' });
  }
  await prisma.sportEntry.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
