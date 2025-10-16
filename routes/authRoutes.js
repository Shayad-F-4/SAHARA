const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../model/user.model');

// Middleware to check if user is logged in
let checkLogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.render('login', { error: null });
  }
};

router.get('/home', (req, res) => {
  res.render('home0');
});

// Routes
router.get('/', (req, res) => {
  res.render('home', {
    error: null,
    user: req.session.user || '',
    name: req.session.name || ''
  });
});

router.get('/skills_connect', checkLogin, (req, res) => {
  res.render('skills', { user: req.session.user || '' });
});

// Category-specific help page
router.get('/help/:category', checkLogin, (req, res) => {
  const category = req.params.category;
  res.render('help_category', { category, user: req.session.user, name: req.session.name });
});

router.get('/profile', checkLogin, (req, res) => {
  res.send(`
    <h1>Profile Page</h1>
    <p>Hello, ${req.session.user}</p>
    <a href="/logout">Logout</a>
  `);
});

router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/');
  } else {
    res.render('login', { error: null });
  }
});

router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

router.post('/register', async (req, res) => {
  const { username, userpassword, name } = req.body;

  const user = await User.findOne({ username });
  if (user) return res.render('login', { error: 'User Already Exist Login here' });

  const hashedPassword = await bcrypt.hash(userpassword, 10);

  await User.create({ username, userpassword: hashedPassword, name });
  res.redirect('/login');
});

router.post('/login', async (req, res) => {
  const { username, userpassword } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.render('login', { error: 'User not found' });

  const isMatch = await bcrypt.compare(userpassword, user.userpassword);
  if (!isMatch) return res.render('login', { error: 'Invalid Password' });

  req.session.user = username;
  req.session.name = user.name;
  res.redirect('/');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
