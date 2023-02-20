// views.js
const crypto = require('crypto');
const express = require('express');
const User = require('../models/userModel');
const router = express.Router();

router.get('/signup', (req, res) => {
  res.render('signup');
});
router.get('/login', (req, res) => {
  res.render('login');
});
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password');
});
router.get('/api/reset-password/:token', async (req, res) => {
  //
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.redirect('/forgot-password');
  }
  res.render('reset-password', { token: req.params.token });
});

module.exports = router;
