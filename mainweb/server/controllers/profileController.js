const bcrypt = require('bcryptjs');
const User = require('../models/User');
const BlockedPhone = require('../models/BlockedPhone');
const { sanitizeUser } = require('./authController');

async function getProfile(req, res) {
  return res.json(sanitizeUser(req.user));
}

async function updateProfile(req, res) {
  try {
    const { name, mobile, city, coordinatorName, address, ngoName } = req.body;
    const finalName = (ngoName || name || '').trim();
    if (!finalName) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!mobile || !String(mobile).trim()) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ message: 'City is required' });
    }

    const trimmedMobile = String(mobile).trim();
    if (!/^\d{10}$/.test(trimmedMobile)) {
      return res.status(400).json({ message: 'Mobile number must be exactly 10 digits (0-9 only)' });
    }
    if (trimmedMobile !== req.user.mobile) {
      const isBlocked = await BlockedPhone.findOne({ phone: trimmedMobile });
      if (isBlocked) {
        return res.status(403).json({ message: 'This phone number has been blocked.' });
      }

      const taken = await User.findOne({ mobile: trimmedMobile, _id: { $ne: req.user._id } });
      if (taken) {
        return res.status(409).json({ message: 'Mobile number is already registered to another account' });
      }
      req.user.mobile = trimmedMobile;
    }

    req.user.name = finalName;
    req.user.city = city.trim();

    // If NGO user, update ngoDetails fields
    if (req.user.ngoStatus && req.user.ngoStatus !== 'none') {
      req.user.ngoDetails = req.user.ngoDetails || {};
      req.user.ngoDetails.ngoName = finalName;
      req.user.ngoDetails.city = city.trim();
      req.user.ngoDetails.contactNum = trimmedMobile;
      if (coordinatorName !== undefined) {
        req.user.ngoDetails.coordinatorName = String(coordinatorName || '').trim();
      }
      if (address !== undefined) {
        req.user.ngoDetails.address = String(address || '').trim();
      }
      req.user.markModified('ngoDetails');
    }

    await req.user.save();

    return res.json(sanitizeUser(req.user));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Mobile number is already registered to another account' });
    }
    return res.status(500).json({ message: 'Failed to update profile' });
  }
}

async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old and new passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    if (newPassword.length > 30) {
      return res.status(400).json({ message: 'New password must be no more than 30 characters' });
    }
    if (/[^a-zA-Z0-9@]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password can only contain letters, numbers, and @' });
    }

    const ok = await bcrypt.compare(oldPassword, req.user.passwordHash);
    if (!ok) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    req.user.passwordHash = await bcrypt.hash(newPassword, 10);
    await req.user.save();
    return res.json({ message: 'Password updated' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update password' });
  }
}

async function applyNgo(req, res) {
  try {
    const { ngoName, address, city, contactNum } = req.body;
    if (!ngoName || !address || !city || !contactNum) {
      return res.status(400).json({ message: 'All NGO fields are required' });
    }

    const cleanContact = String(contactNum).trim();
    if (!/^\d{10}$/.test(cleanContact)) {
      return res.status(400).json({ message: 'Contact number must be exactly 10 digits (0-9 only)' });
    }

    const isBlocked = await BlockedPhone.findOne({ phone: cleanContact });
    if (isBlocked) {
      return res.status(403).json({ message: 'This phone number has been blocked.' });
    }

    if (req.user.ngoStatus === 'pending') {
      return res.status(400).json({ message: 'NGO application is already pending' });
    }
    if (req.user.ngoStatus === 'approved') {
      return res.status(400).json({ message: 'This account is already an approved NGO' });
    }

    req.user.ngoDetails = {
      ngoName: ngoName.trim(),
      address: address.trim(),
      city: city.trim(),
      contactNum: cleanContact,
    };
    req.user.ngoStatus = 'pending';
    await req.user.save();

    return res.status(201).json(sanitizeUser(req.user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to submit NGO application' });
  }
}

module.exports = { getProfile, updateProfile, changePassword, applyNgo };
