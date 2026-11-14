import { Router } from 'express';
import crypto from 'node:crypto';
import { query } from '../lib/db.js';
import { mapUser } from '../lib/mappers.js';
import { hashPassword, publicUser } from '../lib/auth.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

async function validRoleKeys(roleKeys) {
  if (!Array.isArray(roleKeys) || roleKeys.length === 0) return [];
  const { rows } = await query('SELECT key FROM roles WHERE key = ANY($1)', [roleKeys]);
  return rows.map((r) => r.key);
}

// Read-only directory: admin + "cadre" role can see everyone's info.
router.get('/directory', requireRole('cadre'), async (req, res) => {
  const { rows } = await query('SELECT * FROM users ORDER BY last_name ASC');
  res.json({ users: rows.map(mapUser).map(publicUser) });
});

router.use(requireRole());

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM users ORDER BY last_name ASC');
  res.json({ users: rows.map(mapUser).map(publicUser) });
});

router.post('/', async (req, res) => {
  const { email, password, firstName, lastName, isAdmin, roleKeys } = req.body ?? {};
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Champs manquants' });
  }
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existing.rows.length > 0) return res.status(409).json({ error: 'Cet email existe déjà' });

  const roles = await validRoleKeys(roleKeys);
  const { rows } = await query(
    `INSERT INTO users (id, email, password_hash, first_name, last_name, is_admin, active, roles)
     VALUES ($1, $2, $3, $4, $5, $6, true, $7) RETURNING *`,
    [crypto.randomUUID(), normalizedEmail, await hashPassword(password), firstName, lastName, !!isAdmin, roles]
  );
  res.status(201).json({ user: publicUser(mapUser(rows[0])) });
});

router.put('/:id', async (req, res) => {
  const { firstName, lastName, isAdmin, active, password, roleKeys } = req.body ?? {};
  const sets = [];
  const values = [];
  let i = 1;

  if (firstName !== undefined) { sets.push(`first_name = $${i++}`); values.push(firstName); }
  if (lastName !== undefined) { sets.push(`last_name = $${i++}`); values.push(lastName); }
  if (isAdmin !== undefined) { sets.push(`is_admin = $${i++}`); values.push(!!isAdmin); }
  if (active !== undefined) { sets.push(`active = $${i++}`); values.push(!!active); }
  if (password) { sets.push(`password_hash = $${i++}`); values.push(await hashPassword(password)); }
  if (Array.isArray(roleKeys)) { sets.push(`roles = $${i++}`); values.push(await validRoleKeys(roleKeys)); }

  if (sets.length === 0) {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    return res.json({ user: publicUser(mapUser(rows[0])) });
  }

  values.push(req.params.id);
  const { rows } = await query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, values);
  if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json({ user: publicUser(mapUser(rows[0])) });
});

router.delete('/:id', async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Impossible de te supprimer toi-même' });
  const { rowCount } = await query('DELETE FROM users WHERE id = $1', [req.params.id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json({ ok: true });
});

export default router;
