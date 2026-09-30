import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import roleRoutes from './routes/roles.js';
import sportRoutes from './routes/sport.js';
import photoRoutes from './routes/photos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');

const app = express();

app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
}

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/sport', sportRoutes);
app.use('/api/photos', photoRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur' });
});

app.use(express.static(CLIENT_DIST));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(CLIENT_DIST, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
