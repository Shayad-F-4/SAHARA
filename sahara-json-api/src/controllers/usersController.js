import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { readJson, writeJson, files } from '../utils/fileHelper.js';

function sanitizeUser(u) {
  const { password, ...rest } = u;
  return rest;
}

export async function register(req, res) {
  const { email, password, full_name = '', phone = '', location = '', bio = '' } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  const users = await readJson(files.users);
  const exists = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) return res.status(409).json({ error: 'User already exists' });
  const id = nanoid();
  const hash = await bcrypt.hash(password, 10);
  const profile = { id, email, password: hash, full_name, phone, location, bio, profile_pic: '', resume: '', settings: { emergency_alerts: false, email_notifications: false, sms_notifications: false } };
  users.push(profile);
  await writeJson(files.users, users);
  return res.status(201).json(sanitizeUser(profile));
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  const users = await readJson(files.users);
  const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return res.json({ token, user: sanitizeUser(user) });
}

export async function getSettings(req, res) {
  const users = await readJson(files.users);
  const me = users.find(u => u.id === req.user.id);
  if (!me) return res.status(404).json({ error: 'User not found' });
  return res.json({ profile: sanitizeUser(me), settings: me.settings || {} });
}

export async function updateSettings(req, res) {
  const { full_name, phone, location, bio, profile_pic, resume, emergency_alerts, email_notifications, sms_notifications } = req.body || {};
  const users = await readJson(files.users);
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  const me = users[idx];
  // Update profile fields if provided
  if (typeof full_name !== 'undefined') me.full_name = full_name;
  if (typeof phone !== 'undefined') me.phone = phone;
  if (typeof location !== 'undefined') me.location = location;
  if (typeof bio !== 'undefined') me.bio = bio;
  if (typeof profile_pic !== 'undefined') me.profile_pic = profile_pic;
  if (typeof resume !== 'undefined') me.resume = resume;
  // Settings
  me.settings = me.settings || {};
  if (typeof emergency_alerts !== 'undefined') me.settings.emergency_alerts = !!emergency_alerts;
  if (typeof email_notifications !== 'undefined') me.settings.email_notifications = !!email_notifications;
  if (typeof sms_notifications !== 'undefined') me.settings.sms_notifications = !!sms_notifications;
  users[idx] = me;
  await writeJson(files.users, users);
  return res.json({ profile: sanitizeUser(me), settings: me.settings });
}
