import { nanoid } from 'nanoid';
import { readJson, writeJson, files } from '../utils/fileHelper.js';

export async function listHelp(req, res) {
  const posts = await readJson(files.posts);
  return res.json(posts);
}

export async function createHelp(req, res) {
  const { category = '', title = '', description = '', location = '' } = req.body || {};
  if (!category || !title || !description) return res.status(400).json({ error: 'category, title, description are required' });
  const posts = await readJson(files.posts);
  const post = {
    id: nanoid(),
    userId: req.user.id,
    userEmail: req.user.email,
    category,
    title,
    description,
    location,
    createdAt: new Date().toISOString()
  };
  posts.unshift(post);
  await writeJson(files.posts, posts);
  return res.status(201).json(post);
}
