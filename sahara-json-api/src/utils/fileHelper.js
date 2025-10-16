import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '..', '..', 'data');

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function readJson(file) {
  await ensureDataDir();
  const filePath = path.join(dataDir, file);
  try {
    const buf = await fs.readFile(filePath, 'utf8');
    return JSON.parse(buf || '[]');
  } catch (e) {
    if (e.code === 'ENOENT') {
      await fs.writeFile(filePath, '[]', 'utf8');
      return [];
    }
    throw e;
  }
}

export async function writeJson(file, data) {
  await ensureDataDir();
  const filePath = path.join(dataDir, file);
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, json, 'utf8');
}

export const files = {
  users: 'users.json',
  posts: 'posts.json'
};
