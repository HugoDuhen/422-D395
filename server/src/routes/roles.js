import { Router } from 'express';
import crypto from 'node:crypto';
import { query } from '../lib/db.js';
import { mapRole } from '../lib/mappers.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Any authenticated user can read the role list (needed to render badges, filters, etc.)
router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM roles ORDER BY label ASC');
  res.json({ roles: rows.map(mapRole) });
});

router.use(requireRole());

router.post('/', async (req, res) => {
  const { key, label } = req.body ?? {};
  if (!key || !label) return res.status(400).json({ error: 'Clé et libellé requis' });
  const normalizedKey = key.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');

  const existing = await query('SELECT id FROM roles WHERE key = $1', [normalizedKey]);
  if (existing.rows.length > 0) return res.status(409).json({ error: 'Ce rôle existe déjà' });

  const { rows } = await query('INSERT INTO roles (id, key, label) VALUES ($1, $2, $3) RETURNING *', [
    crypto.randomUUID(),
    normalizedKey,
    label,
  ]);
  res.status(201).json({ role: mapRole(rows[0]) });
});

router.delete('/:id', async (req, res) => {
  const { rows } = await query('DELETE FROM roles WHERE id = $1 RETURNING key', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Rôle introuvable' });
  await query('UPDATE users SET roles = array_remove(roles, $1)', [rows[0].key]);
  res.json({ ok: true });
});

export default router;
