const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../model/user.model');

const router = express.Router();

// Store uploads under /uploads and serve statically from index.js
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const upload = multer({ dest: uploadsDir });

// Require login
function requireLogin(req, res, next){
  if (req.session && req.session.user) return next();
  return res.redirect('/login');
}

// Render settings with data from DB
router.get('/settings', requireLogin, async (req, res) => {
  try{
    const user = await User.findOne({ username: req.session.user }).lean();
    const viewUser = {
      profile_pic: user?.profile_pic || '',
      full_name: user?.name || '',
      email: user?.username || '',
      phone: user?.phone || '',
      location: user?.location || '',
      bio: user?.bio || '',
      resume: user?.resume || '',
      emergency_alerts: !!user?.emergency_alerts,
      email_notifications: !!user?.email_notifications,
      sms_notifications: !!user?.sms_notifications,
      emergency_number: user?.emergency_number || ''
    };
    return res.render('settings', { user: viewUser });
  }catch(e){
    return res.render('settings', { user: { full_name: req.session.name || '', email: req.session.user || '' } });
  }
});

router.post(
  '/update-profile',
  upload.fields([
    { name: 'profile_pic', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
  ]),
  requireLogin,
  async (req, res) => {
    try {
      const { full_name, phone, location, bio, emergency_number } = req.body || {};
      const user = await User.findOne({ username: req.session.user });
      if (!user) return res.redirect('/settings');

      const profilePic = req.files?.profile_pic?.[0]?.filename
        ? `/uploads/${req.files.profile_pic[0].filename}`
        : (user.profile_pic || '');
      const resumeFile = req.files?.resume?.[0]?.filename
        ? `/uploads/${req.files.resume[0].filename}`
        : (user.resume || '');

      if (typeof full_name !== 'undefined' && full_name) user.name = full_name;
      if (typeof phone !== 'undefined') user.phone = phone;
      if (typeof location !== 'undefined') user.location = location;
      if (typeof bio !== 'undefined') user.bio = bio;
      if (typeof emergency_number !== 'undefined') user.emergency_number = emergency_number;
      user.profile_pic = profilePic;
      user.resume = resumeFile;

      await user.save();
      if (full_name) req.session.name = full_name; // keep Home name in sync
      return res.redirect('/settings');
    } catch (e) {
      return res.redirect('/settings');
    }
  }
);

router.post('/update-notifications', requireLogin, async (req, res) => {
  try{
    const user = await User.findOne({ username: req.session.user });
    if (user){
      user.emergency_alerts = !!req.body.emergency_alerts;
      user.email_notifications = !!req.body.email_notifications;
      user.sms_notifications = !!req.body.sms_notifications;
      await user.save();
    }
  }catch(e){ /* ignore errors, still redirect */ }
  return res.redirect('/settings');
});

// Current user's emergency number (requires login)
router.get('/api/me/emergency', requireLogin, async (req, res) => {
  try{
    const user = await User.findOne({ username: req.session.user }).lean();
    return res.json({ emergency_number: user?.emergency_number || '' });
  }catch(e){ return res.json({ emergency_number: '' }); }
});

router.post('/change-password', (req, res) => {
  // Stub: implement with real user auth if needed
  return res.redirect('/settings');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
