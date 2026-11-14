import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import roleRoutes from './routes/roles.js';
import sportRoutes from './routes/sport.js';
import albumRoutes from './routes/albums.js';

export const app = express();

app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
}

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/sport', sportRoutes);
app.use('/api/albums', albumRoutes);

// Chaque point d'entrée (index.js, api/index.mjs) ajoute cette middleware en tout dernier,
// une fois ses propres routes/middlewares supplémentaires enregistrés.
export function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur' });
}
