import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool, query } from '../src/lib/db.js';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@section.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

const DEFAULT_ROLES = [
  { key: 'sport', label: 'Sport' },
  { key: 'photos', label: 'Photos' },
  { key: 'cadre', label: 'Cadre' },
];

for (const role of DEFAULT_ROLES) {
  await query(
    'INSERT INTO roles (id, key, label) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING',
    [crypto.randomUUID(), role.key, role.label]
  );
}
console.log(`Rôles par défaut prêts : ${DEFAULT_ROLES.map((r) => r.key).join(', ')}`);

const { rows } = await query('SELECT id FROM users WHERE email = $1', [ADMIN_EMAIL]);
if (rows.length > 0) {
  console.log(`Un admin existe déjà (${ADMIN_EMAIL}), rien à faire de plus.`);
} else {
  await query(
    `INSERT INTO users (id, email, password_hash, first_name, last_name, is_admin, active, roles)
     VALUES ($1, $2, $3, 'Admin', 'Section', true, true, '{}')`,
    [crypto.randomUUID(), ADMIN_EMAIL, await bcrypt.hash(ADMIN_PASSWORD, 10)]
  );
  console.log(`Compte admin créé : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('Change ce mot de passe dès la première connexion.');
}

await pool.end();
