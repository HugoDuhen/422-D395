import { Router } from 'express';
import crypto from 'node:crypto';
import { query } from '../lib/db.js';
import { mapAlbum } from '../lib/mappers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

const SELECT_WITH_AUTHOR = `
  SELECT a.*, u.first_name AS added_by_first_name, u.last_name AS added_by_last_name
  FROM albums a
  JOIN users u ON u.id = a.added_by_id
`;

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

router.use(authenticate);

router.get('/', async (req, res) => {
  const { rows } = await query(`${SELECT_WITH_AUTHOR} ORDER BY a.created_at DESC`);
  res.json({ albums: rows.map(mapAlbum) });
});

router.post('/', requireRole('photos'), async (req, res) => {
  const { title, url, description } = req.body ?? {};
  if (!title || !url) return res.status(400).json({ error: 'Titre et lien requis' });
  if (!isValidUrl(url)) return res.status(400).json({ error: 'Le lien doit être une URL valide (https://...)' });

  const { rows } = await query(
    'INSERT INTO albums (id, title, url, description, added_by_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [crypto.randomUUID(), title, url, description || '', req.user.id]
  );
  const { rows: full } = await query(`${SELECT_WITH_AUTHOR} WHERE a.id = $1`, [rows[0].id]);
  res.status(201).json({ album: mapAlbum(full[0]) });
});

router.put('/:id', requireRole('photos'), async (req, res) => {
  const { rows: existingRows } = await query('SELECT * FROM albums WHERE id = $1', [req.params.id]);
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: 'Introuvable' });
  if (existing.added_by_id !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Tu ne peux modifier que tes propres albums' });
  }

  const { title, url, description } = req.body ?? {};
  if (url !== undefined && !isValidUrl(url)) {
    return res.status(400).json({ error: 'Le lien doit être une URL valide (https://...)' });
  }
  await query(
    `UPDATE albums SET title = COALESCE($1, title), url = COALESCE($2, url),
     description = COALESCE($3, description), updated_at = now() WHERE id = $4`,
    [title, url, description, req.params.id]
  );
  const { rows: full } = await query(`${SELECT_WITH_AUTHOR} WHERE a.id = $1`, [req.params.id]);
  res.json({ album: mapAlbum(full[0]) });
});

router.delete('/:id', requireRole('photos'), async (req, res) => {
  const { rows: existingRows } = await query('SELECT * FROM albums WHERE id = $1', [req.params.id]);
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: 'Introuvable' });
  if (existing.added_by_id !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Tu ne peux supprimer que tes propres albums' });
  }
  await query('DELETE FROM albums WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

export default router;
