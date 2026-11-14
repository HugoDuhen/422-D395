import { Router } from 'express';
import crypto from 'node:crypto';
import { query } from '../lib/db.js';
import { mapSportEntry } from '../lib/mappers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

const SELECT_WITH_AUTHOR = `
  SELECT se.*, u.first_name AS author_first_name, u.last_name AS author_last_name
  FROM sport_entries se
  JOIN users u ON u.id = se.author_id
`;

router.use(authenticate);

router.get('/', async (req, res) => {
  const { rows } = await query(`${SELECT_WITH_AUTHOR} ORDER BY se.created_at DESC`);
  res.json({ entries: rows.map(mapSportEntry) });
});

router.post('/', requireRole('sport'), async (req, res) => {
  const { title, content } = req.body ?? {};
  if (!title || !content) return res.status(400).json({ error: 'Titre et contenu requis' });

  const { rows } = await query(
    'INSERT INTO sport_entries (id, title, content, author_id) VALUES ($1, $2, $3, $4) RETURNING id',
    [crypto.randomUUID(), title, content, req.user.id]
  );
  const { rows: full } = await query(`${SELECT_WITH_AUTHOR} WHERE se.id = $1`, [rows[0].id]);
  res.status(201).json({ entry: mapSportEntry(full[0]) });
});

router.put('/:id', requireRole('sport'), async (req, res) => {
  const { rows: existingRows } = await query('SELECT * FROM sport_entries WHERE id = $1', [req.params.id]);
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: 'Introuvable' });
  if (existing.author_id !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Tu ne peux modifier que tes propres publications' });
  }

  const { title, content } = req.body ?? {};
  await query(
    'UPDATE sport_entries SET title = COALESCE($1, title), content = COALESCE($2, content), updated_at = now() WHERE id = $3',
    [title, content, req.params.id]
  );
  const { rows: full } = await query(`${SELECT_WITH_AUTHOR} WHERE se.id = $1`, [req.params.id]);
  res.json({ entry: mapSportEntry(full[0]) });
});

router.delete('/:id', requireRole('sport'), async (req, res) => {
  const { rows: existingRows } = await query('SELECT * FROM sport_entries WHERE id = $1', [req.params.id]);
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: 'Introuvable' });
  if (existing.author_id !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Tu ne peux supprimer que tes propres publications' });
  }
  await query('DELETE FROM sport_entries WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

export default router;
