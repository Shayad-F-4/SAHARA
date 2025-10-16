const express = require('express');
const router = express.Router();
const Helper = require('../model/helper.model');

// In-memory data for demo (replace with DB later if needed)
const categories = [
  { name: 'Medical', color: 'red', requests: 23 },
  { name: 'Food', color: 'orange', requests: 15 },
  { name: 'Jobs', color: 'purple', requests: 42 },
  { name: 'Shelter', color: 'teal', requests: 8 },
  { name: 'Transport', color: 'pink', requests: 12 },
  { name: 'Education', color: 'indigo', requests: 19 },
];

let emergencyRequests = [
  {
    id: 1,
    category: 'Medical Emergency',
    priority: 'Critical',
    time: '2 min ago',
    title: 'Need O+ blood urgently for surgery',
    location: 'AIIMS, Delhi',
    priorityColor: 'critical',
    ownerUsername: null,
    helpers: [],
  },
  {
    id: 2,
    category: 'Food Emergency',
    priority: 'High',
    time: '15 min ago',
    title: 'Family of 4 needs food for 3 days',
    location: 'Sector 15, Noida',
    priorityColor: 'warning',
    ownerUsername: null,
    helpers: [],
  },
];

// Helpers persisted in MongoDB via Helper model

router.get('/help-hub/categories', (req, res) => {
  res.json(categories);
});

router.get('/help-hub/emergencies', (req, res) => {
  res.json(emergencyRequests);
});

router.get('/help-hub/helpers', async (req, res) => {
  try{
    const items = await Helper.find({}).sort({ createdAt: -1 }).lean();
    const list = items.map(h => ({
      id: String(h._id),
      name: h.name,
      provider: h.provider,
      description: h.description,
      contact: h.contact,
      likes: h.likes || 0,
      stars: h.stars || 0,
      ownerUsername: h.ownerUsername,
    }));
    res.json(list);
  }catch(e){ res.status(500).json({ error:'Server error' }); }
});

// Add a new helper entry
router.post('/help-hub/helpers', async (req, res) => {
  try{
    const user = String(req.session?.user || '').toLowerCase();
    if(!user) return res.status(401).json({ error:'Authentication required' });
    const { name, provider, description, contact } = req.body || {};
    if (!name || !provider || !description || !contact) {
      return res.status(400).json({ error: 'name, provider, description, contact are required' });
    }
    const created = await Helper.create({ name, provider, description, contact, likes:0, stars:0, likedBy:[], ownerUsername: user });
    return res.status(201).json({
      id: String(created._id),
      name: created.name,
      provider: created.provider,
      description: created.description,
      contact: created.contact,
      likes: created.likes,
      stars: created.stars,
      ownerUsername: created.ownerUsername,
    });
  }catch(e){
    if(e && e.name==='ValidationError') return res.status(400).json({ error: e.message });
    return res.status(500).json({ error:'Server error' });
  }
});

// Like a helper; every 20 likes -> +1 star
router.post('/help-hub/helpers/:id/like', async (req, res) => {
  try{
    const id = req.params.id;
    const item = await Helper.findById(id);
    if (!item) return res.status(404).json({ error: 'Helper not found' });
    const user = String(req.session?.user || '').toLowerCase();
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    item.likedBy = Array.isArray(item.likedBy) ? item.likedBy : [];
    if (item.likedBy.includes(user)) {
      return res.status(409).json({ error: 'Already liked' });
    }
    item.likedBy.push(user);
    item.likes = item.likedBy.length;
    item.stars = Math.min(Math.floor(item.likes / 10), 10);
    await item.save();
    return res.json({ id: String(item._id), likes: item.likes, stars: item.stars });
  }catch(e){ return res.status(500).json({ error:'Server error' }); }
});

// Delete a helper (owner or admin only)
router.delete('/help-hub/helpers/:id', async (req, res) => {
  try{
    const id = req.params.id;
    const user = String(req.session?.user || '').toLowerCase();
    if (!user) return res.status(401).json({ error:'Authentication required' });
    const item = await Helper.findById(id);
    if(!item) return res.status(404).json({ error:'Not found' });
    const isOwner = item.ownerUsername === user;
    const isAdmin = user === 'admin';
    if(!isOwner && !isAdmin) return res.status(403).json({ error:'Not allowed' });
    await Helper.deleteOne({ _id: id });
    return res.status(204).send();
  }catch(e){ return res.status(500).json({ error:'Server error' }); }
});

// Create a new emergency request (basic demo)
router.post('/help-hub/requests', (req, res) => {
  const { category, priority, title, location } = req.body || {};
  if (!category || !priority || !title || !location) {
    return res.status(400).json({ error: 'category, priority, title, location are required' });
  }
  const id = emergencyRequests.length ? emergencyRequests[emergencyRequests.length - 1].id + 1 : 1;
  const newItem = {
    id,
    category,
    priority,
    time: 'just now',
    title,
    location,
    priorityColor: priority.toLowerCase() === 'critical' ? 'critical' : priority.toLowerCase() === 'high' ? 'warning' : 'default',
    ownerUsername: String(req.session?.user || '').toLowerCase() || null,
    helpers: [],
  };
  emergencyRequests.unshift(newItem);
  res.status(201).json(newItem);
});

// Delete an emergency request (only by owner)
router.delete('/help-hub/requests/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  const idx = emergencyRequests.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const owner = String(req.session?.user || '').toLowerCase();
  const item = emergencyRequests[idx];
  if (!item.ownerUsername || item.ownerUsername !== owner) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  emergencyRequests.splice(idx, 1);
  return res.status(204).send();
});

// Volunteer to help (not owner)
router.post('/help-hub/requests/:id/help', (req, res) => {
  const id = Number(req.params.id);
  const { contact } = req.body || {};
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  if (!contact) return res.status(400).json({ error: 'Contact is required' });
  const user = String(req.session?.user || '').toLowerCase();
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  const item = emergencyRequests.find(r => r.id === id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (item.ownerUsername && item.ownerUsername === user) {
    return res.status(400).json({ error: 'Owner cannot volunteer on own request' });
  }
  const exists = (item.helpers || []).some(h => h.username === user);
  if (exists) return res.status(409).json({ error: 'Already volunteered' });
  item.helpers = item.helpers || [];
  item.helpers.push({ username: user, contact, createdAt: new Date() });
  return res.status(201).json({ ok: true });
});

// Owner view helpers
router.get('/help-hub/requests/:id/helpers', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  const owner = String(req.session?.user || '').toLowerCase();
  const item = emergencyRequests.find(r => r.id === id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (!item.ownerUsername || item.ownerUsername !== owner) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  return res.json({ helpers: item.helpers || [] });
});

module.exports = router;
