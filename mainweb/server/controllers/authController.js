const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    mobile: user.mobile,
    city: user.city,
    ngoStatus: user.ngoStatus,
    ngoDetails: user.ngoDetails,
    createdAt: user.createdAt,
  };
}

async function register(req, res) {
  try {
    const { name, mobile, password, confirmPassword, city } = req.body;

    if (!name || !mobile || !password || !confirmPassword || !city) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ mobile: String(mobile).trim() });
    if (existing) {
      return res.status(409).json({ message: 'Mobile number is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      mobile: String(mobile).trim(),
      passwordHash,
      city: city.trim(),
    });

    return res.status(201).json({
      message: 'Account created successfully. Please sign in.',
      user: sanitizeUser(user),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Mobile number is already registered' });
    }
    return res.status(500).json({ message: 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ message: 'Mobile number and password are required' });
    }

    const user = await User.findOne({ mobile: String(mobile).trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid mobile number or password' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid mobile number or password' });
    }

    const token = jwt.sign({ type: 'user', id: user._id }, process.env.USER_JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed' });
  }
}

module.exports = { register, login, sanitizeUser };
