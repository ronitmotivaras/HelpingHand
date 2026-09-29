const bcrypt = require('bcryptjs');
const { sanitizeUser } = require('./authController');

async function getProfile(req, res) {
  return res.json(sanitizeUser(req.user));
}

async function updateProfile(req, res) {
  try {
    const { name, city } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ message: 'City is required' });
    }

    req.user.name = name.trim();
    req.user.city = city.trim();
    await req.user.save();

    return res.json(sanitizeUser(req.user));
  } catch (err) {
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
      contactNum: String(contactNum).trim(),
    };
    req.user.ngoStatus = 'pending';
    await req.user.save();

    return res.status(201).json(sanitizeUser(req.user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to submit NGO application' });
  }
}

module.exports = { getProfile, updateProfile, changePassword, applyNgo };
