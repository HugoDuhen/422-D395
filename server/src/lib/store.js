import fs from 'node:fs';
import path from 'node:path';

const DATA_FILE = path.resolve(process.env.DATA_FILE || './data/db.json');

function defaultData() {
  return { users: [], roles: [], sportEntries: [], photos: [] };
}

function load() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return { ...defaultData(), ...JSON.parse(raw) };
  } catch {
    return defaultData();
  }
}

export const store = load();

export function save() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}
