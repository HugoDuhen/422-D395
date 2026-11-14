import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/lib/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf-8');

await pool.query(sql);
console.log('Schéma appliqué (tables créées si absentes).');
await pool.end();
