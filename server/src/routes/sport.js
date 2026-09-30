import { Router } from 'express';
import crypto from 'node:crypto';
import { store, save } from '../lib/store.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

function withAuthor(entry) {
  const author = store.users.find((u) => u.id === entry.authorId);
  return { ...entry, author: author ? { firstName: author.firstName, lastName: author.lastName } : null };
}

router.get('/', (req, res) => {
  const entries = [...store.sportEntries]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(withAuthor);
  res.json({ entries });
});

router.post('/', requireRole('sport'), (req, res) => {
  const { title, content } = req.body ?? {};
  if (!title || !content) return res.status(400).json({ error: 'Titre et contenu requis' });
  const now = new Date().toISOString();
  const entry = {
    id: crypto.randomUUID(),
    title,
    content,
    authorId: req.user.id,
    createdAt: now,
    updatedAt: now,
  };
  store.sportEntries.push(entry);
  save();
  res.status(201).json({ entry: withAuthor(entry) });
});

router.put('/:id', requireRole('sport'), (req, res) => {
  const entry = store.sportEntries.find((e) => e.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'Introuvable' });
  if (entry.authorId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Tu ne peux modifier que tes propres publications' });
  }
  const { title, content } = req.body ?? {};
  if (title !== undefined) entry.title = title;
  if (content !== undefined) entry.content = content;
  entry.updatedAt = new Date().toISOString();
  save();
  res.json({ entry: withAuthor(entry) });
});

router.delete('/:id', requireRole('sport'), (req, res) => {
  const index = store.sportEntries.findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Introuvable' });
  const entry = store.sportEntries[index];
  if (entry.authorId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Tu ne peux supprimer que tes propres publications' });
  }
  store.sportEntries.splice(index, 1);
  save();
  res.json({ ok: true });
});

export default router;
