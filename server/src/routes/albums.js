import { Router } from 'express';
import crypto from 'node:crypto';
import { store, save } from '../lib/store.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

function withAuthor(album) {
  const author = store.users.find((u) => u.id === album.addedById);
  return { ...album, addedBy: author ? { firstName: author.firstName, lastName: author.lastName } : null };
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

router.get('/', (req, res) => {
  const albums = [...store.albums]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(withAuthor);
  res.json({ albums });
});

router.post('/', requireRole('photos'), (req, res) => {
  const { title, url, description } = req.body ?? {};
  if (!title || !url) return res.status(400).json({ error: 'Titre et lien requis' });
  if (!isValidUrl(url)) return res.status(400).json({ error: 'Le lien doit être une URL valide (https://...)' });

  const now = new Date().toISOString();
  const album = {
    id: crypto.randomUUID(),
    title,
    url,
    description: description || '',
    addedById: req.user.id,
    createdAt: now,
    updatedAt: now,
  };
  store.albums.push(album);
  save();
  res.status(201).json({ album: withAuthor(album) });
});

router.put('/:id', requireRole('photos'), (req, res) => {
  const album = store.albums.find((a) => a.id === req.params.id);
  if (!album) return res.status(404).json({ error: 'Introuvable' });
  if (album.addedById !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Tu ne peux modifier que tes propres albums' });
  }
  const { title, url, description } = req.body ?? {};
  if (url !== undefined && !isValidUrl(url)) {
    return res.status(400).json({ error: 'Le lien doit être une URL valide (https://...)' });
  }
  if (title !== undefined) album.title = title;
  if (url !== undefined) album.url = url;
  if (description !== undefined) album.description = description;
  album.updatedAt = new Date().toISOString();
  save();
  res.json({ album: withAuthor(album) });
});

router.delete('/:id', requireRole('photos'), (req, res) => {
  const index = store.albums.findIndex((a) => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Introuvable' });
  const album = store.albums[index];
  if (album.addedById !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Tu ne peux supprimer que tes propres albums' });
  }
  store.albums.splice(index, 1);
  save();
  res.json({ ok: true });
});

export default router;
