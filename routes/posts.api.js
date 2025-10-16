const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../model/post.model');

// Require login for mutating routes
let checkLogin = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
};

// GET /posts - public list
router.get('/posts', async (req, res) => {
  try {
    // Optional category filter via query string
    const { category } = req.query;
    const filter = {};
    if (category && typeof category === 'string' && category.trim()) {
      filter.category = category.trim();
    }
    // Do not expose helper contacts publicly
    const posts = await Post.find(filter, '-helpers').sort({ createdAt: -1 });
    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /posts - create (requires login)
router.post('/posts', checkLogin, async (req, res) => {
  try {
    const { category, title, description, name, location, urgency, time } = req.body;
    if (!category || !title || !description || !name || !location || !urgency || !time) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const ownerUsername = String(req.session.user || '').toLowerCase();
    const created = await Post.create({ category, title, description, name, location, urgency, time, ownerUsername });
    return res.status(201).json(created);
  } catch (err) {
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /posts/:id/helpers - owner-only view of helpers for a post
router.get('/posts/:id/helpers', checkLogin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }
    const post = await Post.findById(id).select('ownerUsername helpers').lean();
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const sessionUser = String(req.session.user || '').toLowerCase();
    if (post.ownerUsername !== sessionUser) {
      return res.status(403).json({ error: 'Not allowed' });
    }
    return res.json({ helpers: post.helpers || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /posts/:id - delete (requires login)
router.delete('/posts/:id', checkLogin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const sessionUser = String(req.session.user || '').toLowerCase();
    if (post.ownerUsername !== sessionUser) {
      return res.status(403).json({ error: 'Not allowed to delete this post' });
    }
    await Post.findByIdAndDelete(id);
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /posts/:id/help - add a helper contact (requires login, not owner)
router.post('/posts/:id/help', checkLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const { contact } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }
    if (!contact) {
      return res.status(400).json({ error: 'Contact is required' });
    }
    const post = await Post.findById(id).lean();
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const sessionUser = String(req.session.user || '').toLowerCase();
    if (post.ownerUsername === sessionUser) {
      return res.status(400).json({ error: 'Owner cannot volunteer on own post' });
    }
    const already = (post.helpers || []).some(h => h.username === sessionUser);
    if (already) {
      return res.status(409).json({ error: 'You already volunteered for this post' });
    }
    // Use atomic update to avoid re-validating entire doc (older docs may miss new required fields)
    await Post.updateOne(
      { _id: id },
      { $push: { helpers: { username: sessionUser, contact, createdAt: new Date() } } }
    );
    return res.status(201).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats - live stats for home dashboard
router.get('/api/stats', async (req, res) => {
  try{
    // Only fetch the fields we need
    const posts = await Post.find({}, 'category helpers createdAt date').lean();

    const categories = ['Medical','Food','Jobs','Shelter','Transport','Education'];
    const categoryCounts = Object.fromEntries(categories.map(c=>[c,0]));

    let totalHelpers = 0;
    const helperUsers = new Set();

    let responseAccumMinutes = 0;
    let responseCount = 0;

    for(const p of posts){
      const cat = p.category || '';
      if(typeof categoryCounts[cat] === 'number') categoryCounts[cat]++;

      const helpers = Array.isArray(p.helpers) ? p.helpers : [];
      totalHelpers += helpers.length;
      helpers.forEach(h => { if(h && h.username) helperUsers.add(String(h.username).toLowerCase()); });

      if(helpers.length > 0){
        const first = helpers.reduce((m, h) => {
          const t = (h && h.createdAt) ? new Date(h.createdAt).getTime() : Infinity;
          return Math.min(m, t);
        }, Infinity);
        const postTs = p.createdAt ? new Date(p.createdAt).getTime() : (p.date ? new Date(p.date).getTime() : null);
        if(isFinite(first) && postTs){
          const mins = Math.max(0, (first - postTs) / 60000);
          responseAccumMinutes += mins;
          responseCount += 1;
        }
      }
    }

    const uniqueHelpers = helperUsers.size;
    const livesSaved = totalHelpers; // simple proxy as requested
    const avgResponseMinutes = responseCount > 0 ? Number((responseAccumMinutes/responseCount).toFixed(1)) : 0;

    return res.json({
      categories: categoryCounts,
      totals: {
        activeHelpers: uniqueHelpers,
        livesSaved,
        avgResponseMinutes
      }
    });
  }catch(e){
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


