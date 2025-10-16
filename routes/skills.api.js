const express = require('express');
const mongoose = require('mongoose');
const User = require('../model/user.model');
const Service = require('../model/service.model');
const Job = require('../model/job.model');

const router = express.Router();

// Require login middleware
function requireLogin(req, res, next){
  if (req.session && req.session.user) return next();
  return res.status(401).json({ error: 'Authentication required' });
}

// -------- Jobs --------
router.get('/skills/jobs', async (req, res) => {
  try{
    const items = await Job.find({}, '-helpers').sort({ createdAt: -1 }).lean();
    return res.json(items);
  }catch(e){ return res.status(500).json({ error:'Server error' }); }
});

router.post('/skills/jobs', requireLogin, async (req, res) => {
  try{
    const { title, category, employer, location, urgency, duration, budget, requirements, description } = req.body || {};
    if(!title || !category || !employer || !location || !urgency || !duration || typeof budget==='undefined' || !description){
      return res.status(400).json({ error:'Missing required fields' });
    }
    const ownerUsername = String(req.session.user||'').toLowerCase();
    const reqs = Array.isArray(requirements) ? requirements : String(requirements||'').split(',').map(s=>s.trim()).filter(Boolean);
    const created = await Job.create({ title, category, employer, location, urgency, duration, budget, requirements: reqs, description, ownerUsername });
    return res.status(201).json(created);
  }catch(e){
    if(e && e.name==='ValidationError') return res.status(400).json({ error:e.message });
    return res.status(500).json({ error:'Server error' });
  }
});

router.get('/skills/jobs/:id', async (req, res) => {
  try{
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error:'Invalid id' });
    const job = await Job.findById(id).lean();
    if(!job) return res.status(404).json({ error:'Not found' });
    const owner = await User.findOne({ username: job.ownerUsername }).lean();
    const ownerProfile = owner ? {
      name: owner.name,
      email: owner.username,
      phone: owner.phone || '',
      bio: owner.bio || '',
      resume: owner.resume || '',
      profile_pic: owner.profile_pic || ''
    } : null;
    return res.json({ job, owner: ownerProfile });
  }catch(e){ return res.status(500).json({ error:'Server error' }); }
});

router.post('/skills/jobs/:id/help', requireLogin, async (req, res) => {
  try{
    const { id } = req.params;
    const { contact } = req.body || {};
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error:'Invalid id' });
    if(!contact) return res.status(400).json({ error:'Contact is required' });
    const job = await Job.findById(id).lean();
    if(!job) return res.status(404).json({ error:'Not found' });
    const me = String(req.session.user||'').toLowerCase();
    if(job.ownerUsername === me) return res.status(400).json({ error:'Owner cannot volunteer on own post' });
    const already = (job.helpers||[]).some(h=>h.username===me);
    if(already) return res.status(409).json({ error:'Already volunteered' });
    await Job.updateOne({ _id:id }, { $push: { helpers: { username: me, contact } } });
    return res.status(201).json({ ok:true });
  }catch(e){ return res.status(500).json({ error:'Server error' }); }
});

router.delete('/skills/jobs/:id', requireLogin, async (req, res) => {
  try{
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error:'Invalid id' });
    const job = await Job.findById(id);
    if(!job) return res.status(404).json({ error:'Not found' });
    const me = String(req.session.user||'').toLowerCase();
    if(job.ownerUsername !== me) return res.status(403).json({ error:'Not allowed' });
    await Job.deleteOne({ _id:id });
    return res.status(204).send();
  }catch(e){ return res.status(500).json({ error:'Server error' }); }
});

// -------- Services --------
router.get('/skills/services', async (req, res) => {
  try{
    const items = await Service.find({}, '-helpers').sort({ createdAt: -1 }).lean();
    return res.json(items);
  }catch(e){ return res.status(500).json({ error:'Server error' }); }
});

router.post('/skills/services', requireLogin, async (req, res) => {
  try{
    const { workerName, category, location, experience, rate, skills, description } = req.body || {};
    if(!workerName || !category || !location || typeof experience==='undefined' || typeof rate==='undefined' || !description){
      return res.status(400).json({ error:'Missing required fields' });
    }
    const ownerUsername = String(req.session.user||'').toLowerCase();
    const skillsArr = Array.isArray(skills) ? skills : String(skills||'').split(',').map(s=>s.trim()).filter(Boolean);
    const created = await Service.create({ workerName, category, location, experience:Number(experience)||0, rate:Number(rate)||0, skills: skillsArr, description, ownerUsername });
    return res.status(201).json(created);
  }catch(e){
    if(e && e.name==='ValidationError') return res.status(400).json({ error:e.message });
    return res.status(500).json({ error:'Server error' });
  }
});

router.get('/skills/services/:id', async (req, res) => {
  try{
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error:'Invalid id' });
    const service = await Service.findById(id).lean();
    if(!service) return res.status(404).json({ error:'Not found' });
    const owner = await User.findOne({ username: service.ownerUsername }).lean();
    const ownerProfile = owner ? {
      name: owner.name,
      email: owner.username,
      phone: owner.phone || '',
      bio: owner.bio || '',
      resume: owner.resume || '',
      profile_pic: owner.profile_pic || ''
    } : null;
    return res.json({ service, owner: ownerProfile });
  }catch(e){ return res.status(500).json({ error:'Server error' }); }
});

router.post('/skills/services/:id/help', requireLogin, async (req, res) => {
  try{
    const { id } = req.params; const { contact } = req.body || {};
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error:'Invalid id' });
    if(!contact) return res.status(400).json({ error:'Contact is required' });
    const service = await Service.findById(id).lean();
    if(!service) return res.status(404).json({ error:'Not found' });
    const me = String(req.session.user||'').toLowerCase();
    if(service.ownerUsername === me) return res.status(400).json({ error:'Owner cannot volunteer on own post' });
    const already = (service.helpers||[]).some(h=>h.username===me);
    if(already) return res.status(409).json({ error:'Already volunteered' });
    await Service.updateOne({ _id:id }, { $push: { helpers: { username: me, contact } } });
    return res.status(201).json({ ok:true });
  }catch(e){ return res.status(500).json({ error:'Server error' }); }
});

router.delete('/skills/services/:id', requireLogin, async (req, res) => {
  try{
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error:'Invalid id' });
    const service = await Service.findById(id);
    if(!service) return res.status(404).json({ error:'Not found' });
    const me = String(req.session.user||'').toLowerCase();
    if(service.ownerUsername !== me) return res.status(403).json({ error:'Not allowed' });
    await Service.deleteOne({ _id:id });
    return res.status(204).send();
  }catch(e){ return res.status(500).json({ error:'Server error' }); }
});

// -------- Stats (Skills) --------
router.get('/skills/stats', async (req, res) => {
  try{
    const [jobs, services] = await Promise.all([
      Job.find({}, 'createdAt helpers location').lean(),
      Service.find({}, 'createdAt helpers ownerUsername location category').lean()
    ]);

    const workerUsers = new Set((services||[]).map(s=>String(s.ownerUsername||'').toLowerCase()).filter(Boolean));
    const activeSkilledWorkers = workerUsers.size;

    const totalCompleted = (jobs||[]).reduce((a,j)=>a + (Array.isArray(j.helpers)? j.helpers.length:0),0)
      + (services||[]).reduce((a,s)=>a + (Array.isArray(s.helpers)? s.helpers.length:0),0);

    let responseAccum = 0; let responseCount = 0;
    const computeFirstDelta = (doc)=>{
      const helpers = Array.isArray(doc.helpers)? doc.helpers : [];
      if(helpers.length===0) return;
      const first = helpers.reduce((m,h)=>{
        const t = h && h.createdAt ? new Date(h.createdAt).getTime() : Infinity;
        return Math.min(m,t);
      }, Infinity);
      const postTs = doc.createdAt ? new Date(doc.createdAt).getTime() : null;
      if(isFinite(first) && postTs){
        responseAccum += Math.max(0,(first-postTs)/60000);
        responseCount += 1;
      }
    };
    (jobs||[]).forEach(computeFirstDelta);
    (services||[]).forEach(computeFirstDelta);
    const avgResponseMinutes = responseCount>0 ? Number((responseAccum/responseCount).toFixed(1)) : 0;

    const cities = new Set();
    (jobs||[]).forEach(j=>{ if(j.location) cities.add(String(j.location).trim().toLowerCase()); });
    (services||[]).forEach(s=>{ if(s.location) cities.add(String(s.location).trim().toLowerCase()); });
    const citiesCovered = cities.size;

    return res.json({
      activeSkilledWorkers,
      jobsCompleted: totalCompleted,
      avgResponseMinutes,
      citiesCovered
    });
  }catch(e){ return res.status(500).json({ error:'Server error' }); }
});

module.exports = router;
