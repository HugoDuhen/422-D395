import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = '7d';

export function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function publicUser(user) {
  const { passwordHash, roles, roleKeys, ...rest } = user;
  const keys = roleKeys ?? (roles ? roles.map((ur) => ur.role.key) : undefined);
  return keys ? { ...rest, roles: keys } : rest;
}
