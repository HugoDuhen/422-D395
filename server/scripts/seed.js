import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { store, save } from '../src/lib/store.js';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@section.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

const DEFAULT_ROLES = [
  { key: 'sport', label: 'Sport' },
  { key: 'photos', label: 'Photos' },
  { key: 'cadre', label: 'Cadre' },
];

for (const role of DEFAULT_ROLES) {
  if (!store.roles.some((r) => r.key === role.key)) {
    store.roles.push({ id: crypto.randomUUID(), ...role, createdAt: new Date().toISOString() });
  }
}
console.log(`Rôles par défaut prêts : ${DEFAULT_ROLES.map((r) => r.key).join(', ')}`);

if (store.users.some((u) => u.email === ADMIN_EMAIL)) {
  console.log(`Un admin existe déjà (${ADMIN_EMAIL}), rien à faire de plus.`);
} else {
  store.users.push({
    id: crypto.randomUUID(),
    email: ADMIN_EMAIL,
    passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
    firstName: 'Admin',
    lastName: 'Section',
    isAdmin: true,
    active: true,
    roles: [],
    createdAt: new Date().toISOString(),
  });
  console.log(`Compte admin créé : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('Change ce mot de passe dès la première connexion.');
}

save();
