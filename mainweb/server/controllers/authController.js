const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BlockedPhone = require('../models/BlockedPhone');

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
    const {
      name,
      mobile,
      password,
      confirmPassword,
      city,
      accountType,
      ngoName,
      ngoAddress,
      address,
      ngoContactNum,
      contactNum,
      coordinatorName,
      coordinatorPhone,
    } = req.body;

    const isNgo = accountType === 'ngo';

    if (isNgo) {
      const finalNgoName = String(ngoName || name || '').trim();
      const finalAddress = String(address || ngoAddress || '').trim();
      const finalCity = String(city || '').trim();
      const finalContactNum = String(contactNum || mobile || ngoContactNum || coordinatorPhone || '').trim();
      const finalCoordinatorName = String(coordinatorName || '').trim();

      if (!finalNgoName || !finalAddress || !finalCity || !finalCoordinatorName || !password || !confirmPassword) {
        return res.status(400).json({ message: 'All NGO fields are required' });
      }

      if (!finalContactNum) {
        return res.status(400).json({ message: 'Contact mobile number is required' });
      }

      if (!/^\d{10}$/.test(finalContactNum)) {
        return res.status(400).json({ message: 'Contact number must be exactly 10 digits (0-9 only)' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      if (password.length > 30) {
        return res.status(400).json({ message: 'Password must be no more than 30 characters' });
      }
      if (/[^a-zA-Z0-9@]/.test(password)) {
        return res.status(400).json({ message: 'Password can only contain letters, numbers, and @' });
      }

      const isBlocked = await BlockedPhone.findOne({ phone: finalContactNum });
      if (isBlocked) {
        return res.status(403).json({ message: 'This phone number has been blocked from registration.' });
      }

      const existing = await User.findOne({ mobile: finalContactNum });
      if (existing) {
        return res.status(409).json({ message: 'Contact mobile number is already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        name: finalNgoName,
        mobile: finalContactNum,
        passwordHash,
        city: finalCity,
        ngoStatus: 'pending',
        ngoDetails: {
          ngoName: finalNgoName,
          address: finalAddress,
          city: finalCity,
          contactNum: finalContactNum,
          coordinatorName: finalCoordinatorName,
          coordinatorPhone: finalContactNum,
        },
      });

      return res.status(201).json({
        message: 'Account created successfully. Please sign in.',
        user: sanitizeUser(user),
      });
    }

    // Donator registration
    if (!name || !mobile || !password || !confirmPassword || !city) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const trimmedMobile = String(mobile).trim();
    if (!/^\d{10}$/.test(trimmedMobile)) {
      return res.status(400).json({ message: 'Mobile number must be exactly 10 digits (0-9 only)' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (password.length > 30) {
      return res.status(400).json({ message: 'Password must be no more than 30 characters' });
    }
    if (/[^a-zA-Z0-9@]/.test(password)) {
      return res.status(400).json({ message: 'Password can only contain letters, numbers, and @' });
    }

    const isBlocked = await BlockedPhone.findOne({ phone: trimmedMobile });
    if (isBlocked) {
      return res.status(403).json({ message: 'This phone number has been blocked from registration.' });
    }

    const existing = await User.findOne({ mobile: trimmedMobile });
    if (existing) {
      return res.status(409).json({ message: 'Mobile number is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      mobile: trimmedMobile,
      passwordHash,
      city: city.trim(),
      ngoStatus: 'none',
      ngoDetails: {},
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

    const cleanInput = String(mobile).trim();
    let user;

    if (/^\d{10}$/.test(cleanInput)) {
      user = await User.findOne({ mobile: cleanInput });
    } else {
      user = await User.findOne({
        $or: [
          { mobile: cleanInput },
          { name: cleanInput },
          { 'ngoDetails.ngoName': cleanInput },
          { 'ngoDetails.coordinatorName': cleanInput },
        ],
      });
    }

    if (!user) {
      return res.status(401).json({ message: 'Incorrect mobile number or password' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect mobile number or password' });
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
