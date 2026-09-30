import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || './uploads');
const ORIGINALS_DIR = path.join(UPLOADS_DIR, 'originals');
const PREVIEWS_DIR = path.join(UPLOADS_DIR, 'previews');
fs.mkdirSync(ORIGINALS_DIR, { recursive: true });
fs.mkdirSync(PREVIEWS_DIR, { recursive: true });

const PREVIEW_MAX_WIDTH = 1600;
const PREVIEW_QUALITY = 70;

const storage = multer.diskStorage({
  destination: ORIGINALS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']);

const upload = multer({
  storage,
  limits: { fileSize: 40 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) return cb(new Error('Type de fichier non autorisé'));
    cb(null, true);
  },
});

router.use(authenticate);

router.get('/', async (req, res) => {
  const photos = await prisma.photo.findMany({
    orderBy: { createdAt: 'desc' },
    include: { uploader: { select: { firstName: true, lastName: true } } },
  });
  res.json({ photos });
});

router.post('/upload', requireRole('photos'), upload.array('files', 20), async (req, res) => {
  const folder = (req.body?.folder || 'General').trim() || 'General';
  const files = req.files ?? [];
  if (files.length === 0) return res.status(400).json({ error: 'Aucun fichier reçu' });

  const created = [];
  for (const file of files) {
    let previewFilename = null;
    let width = null;
    let height = null;
    try {
      const image = sharp(file.path, { failOn: 'none' }).rotate();
      const metadata = await image.metadata();
      width = metadata.width ?? null;
      height = metadata.height ?? null;
      previewFilename = `${path.parse(file.filename).name}.webp`;
      await image
        .resize({ width: PREVIEW_MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: PREVIEW_QUALITY })
        .toFile(path.join(PREVIEWS_DIR, previewFilename));
    } catch (err) {
      // Format non supporté par libvips (ex: HEIC selon build) : pas d'aperçu, le téléchargement
      // renverra toujours l'original en qualité max.
      console.warn(`Aperçu impossible pour ${file.originalname}:`, err.message);
      previewFilename = null;
    }

    const photo = await prisma.photo.create({
      data: {
        filename: file.filename,
        previewFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        width,
        height,
        folder,
        uploaderId: req.user.id,
      },
    });
    created.push(photo);
  }

  res.status(201).json({ photos: created });
});

router.get('/:id/preview', async (req, res) => {
  const photo = await prisma.photo.findUnique({ where: { id: req.params.id } });
  if (!photo) return res.status(404).json({ error: 'Introuvable' });
  const filePath = photo.previewFilename
    ? path.join(PREVIEWS_DIR, photo.previewFilename)
    : path.join(ORIGINALS_DIR, photo.filename);
  res.set('Cache-Control', 'private, max-age=31536000, immutable');
  res.sendFile(filePath);
});

router.get('/:id/download', async (req, res) => {
  const photo = await prisma.photo.findUnique({ where: { id: req.params.id } });
  if (!photo) return res.status(404).json({ error: 'Introuvable' });
  const filePath = path.join(ORIGINALS_DIR, photo.filename);
  res.download(filePath, photo.originalName);
});

router.delete('/:id', requireRole('photos'), async (req, res) => {
  const photo = await prisma.photo.findUnique({ where: { id: req.params.id } });
  if (!photo) return res.status(404).json({ error: 'Introuvable' });
  if (photo.uploaderId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Tu ne peux supprimer que tes propres photos' });
  }
  await prisma.photo.delete({ where: { id: req.params.id } });
  fs.unlink(path.join(ORIGINALS_DIR, photo.filename), () => {});
  if (photo.previewFilename) fs.unlink(path.join(PREVIEWS_DIR, photo.previewFilename), () => {});
  res.json({ ok: true });
});

export default router;
