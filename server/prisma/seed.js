import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@section.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

const DEFAULT_ROLES = [
  { key: 'sport', label: 'Sport' },
  { key: 'photos', label: 'Photos' },
  { key: 'cadre', label: 'Cadre' },
];

async function main() {
  for (const role of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: {},
      create: role,
    });
  }
  console.log(`Rôles par défaut prêts : ${DEFAULT_ROLES.map((r) => r.key).join(', ')}`);

  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`Un admin existe déjà (${ADMIN_EMAIL}), rien à faire de plus.`);
    return;
  }

  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      firstName: 'Admin',
      lastName: 'Section',
      isAdmin: true,
    },
  });

  console.log(`Compte admin créé : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('Change ce mot de passe dès la première connexion.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
