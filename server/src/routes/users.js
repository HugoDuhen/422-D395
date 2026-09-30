import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { hashPassword, publicUser } from '../lib/auth.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

const USER_INCLUDE = { roles: { include: { role: true } } };

async function setUserRoles(userId, roleKeys) {
  if (!Array.isArray(roleKeys)) return;
  const roles = await prisma.role.findMany({ where: { key: { in: roleKeys } } });
  await prisma.userRole.deleteMany({ where: { userId } });
  if (roles.length > 0) {
    await prisma.userRole.createMany({
      data: roles.map((r) => ({ userId, roleId: r.id })),
    });
  }
}

router.use(authenticate);

// Read-only directory: admin + "cadre" role can see everyone's info.
router.get('/directory', requireRole('cadre'), async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { lastName: 'asc' }, include: USER_INCLUDE });
  res.json({ users: users.map(publicUser) });
});

router.use(requireRole());

router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { lastName: 'asc' }, include: USER_INCLUDE });
  res.json({ users: users.map(publicUser) });
});

router.post('/', async (req, res) => {
  const { email, password, firstName, lastName, isAdmin, roleKeys } = req.body ?? {};
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Champs manquants' });
  }
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) return res.status(409).json({ error: 'Cet email existe déjà' });

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      passwordHash: await hashPassword(password),
      firstName,
      lastName,
      isAdmin: !!isAdmin,
    },
  });
  await setUserRoles(user.id, roleKeys);
  const full = await prisma.user.findUnique({ where: { id: user.id }, include: USER_INCLUDE });
  res.status(201).json({ user: publicUser(full) });
});

router.put('/:id', async (req, res) => {
  const { firstName, lastName, isAdmin, active, password, roleKeys } = req.body ?? {};
  const data = { firstName, lastName, isAdmin, active };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  if (password) data.passwordHash = await hashPassword(password);

  try {
    await prisma.user.update({ where: { id: req.params.id }, data });
    await setUserRoles(req.params.id, roleKeys);
    const full = await prisma.user.findUnique({ where: { id: req.params.id }, include: USER_INCLUDE });
    res.json({ user: publicUser(full) });
  } catch {
    res.status(404).json({ error: 'Utilisateur introuvable' });
  }
});

router.delete('/:id', async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Impossible de te supprimer toi-même' });
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Utilisateur introuvable' });
  }
});

export default router;
