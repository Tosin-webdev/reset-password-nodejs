const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mailGun = require('nodemailer-mailgun-transport');
const nodemailer = require('nodemailer');

const User = require('../models/userModel');

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // creates a user and saves it to the database
    const user = await User.create({ name, email, password });
    res.status(201).send({ user });
  } catch (error) {
    res.status(400).send(error);
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // checks if email exists in the database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send('Incorrect email or password');
    }

    // checks if user password is correct with the one saved in the database
    const passwordCorrect = await bcrypt.compare(password, user.password);
    if (!passwordCorrect) {
      return res.status(400).send('Incorrect email or password');
    }

    // send response
    res.status(200).json({
      status: 'success',
      user,
    });
  } catch (error) {
    res.status.send(error);
  }
};

exports.forgotPassword = async (req, res) => {
  // find the user, if present in the database
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(400).send('There is no user with that email');
  }

  // Generate the reset token
  const resetToken = user.createPasswordResetToken();
  await user.save();
  const resetUrl = `${req.protocol}://${req.get('host')}/api/reset-password/${resetToken}`;

  try {
    const message = `Forgot your password? Submit this link: ${resetUrl}.\n If you did not request this, please ignore this email and your password will remain unchanged.`;

    // Step 1
    const auth = {
      auth: {
        api_key: process.env.API_KEY,
        domain: process.env.DOMAIN,
      },
    };

    // Step 2
    let transporter = nodemailer.createTransport(mailGun(auth));

    // Step 3
    let mailOptions = {
      from: process.env.EMAIL_FROM, // email sender
      to: req.body.email, // email receiver
      subject: 'Reset Your password',
      text: message,
    };

    // Step 4
    const mail = await transporter.sendMail(mailOptions);

    if (!mail) {
      return console.log('There is an error');
    }

    res.status(200).json({
      status: 'success',
      message: 'messsage sent to mail',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.send(error);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    // Finds user based on the token
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

    if (!user) {
      return res.status(400).send('Token is invalid or has expired');
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.status(200).json({
      status: 'success',
    });
  } catch (error) {
    res.send(error);
  }
};
