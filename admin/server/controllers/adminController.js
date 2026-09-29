const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const FoodDonation = require('../models/FoodDonation');

function sanitizeUser(user) {
  const rawNgo = user.ngoDetails ? (user.ngoDetails.toObject ? user.ngoDetails.toObject() : { ...user.ngoDetails }) : {};
  return {
    id: user._id,
    name: user.name,
    mobile: user.mobile,
    city: user.city,
    ngoStatus: user.ngoStatus,
    ngoDetails: {
      ngoName: rawNgo.ngoName || rawNgo.name || '',
      name: rawNgo.name || rawNgo.ngoName || '',
      address: rawNgo.address || '',
      city: rawNgo.city || user.city || '',
      contactNum: rawNgo.contactNum || rawNgo.contactNumber || user.mobile || '',
      contactNumber: rawNgo.contactNumber || rawNgo.contactNum || user.mobile || '',
      coordinatorPhone: rawNgo.coordinatorPhone || '',
      coordinatorName: rawNgo.coordinatorName || '',
    },
    createdAt: user.createdAt,
  };
}

const getStats = async (req, res) => {
  try {
    const totalDonators = await User.countDocuments({ ngoStatus: 'none' });
    const totalUsers = totalDonators;
    const totalNgos = await User.countDocuments({ ngoStatus: { $ne: 'none' } });
    const pendingNgoReviews = await User.countDocuments({ ngoStatus: 'pending' });
    const verifiedNgoPartners = await User.countDocuments({ ngoStatus: 'approved' });

    res.json({ totalUsers, totalDonators, totalNgos, pendingNgoReviews, verifiedNgoPartners });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

async function adminLogin(req, res) {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(500).json({ message: 'Admin account is not configured' });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid admin password' });
    }

    const token = jwt.sign({ type: 'admin' }, process.env.ADMIN_JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ message: 'Admin login failed' });
  }
}

async function listNgoRequests(req, res) {
  try {
    const { status } = req.query;
    let query = { ngoStatus: { $ne: 'none' } };
    if (status && status !== 'all') {
      query.ngoStatus = status;
    }
    const users = await User.find(query).sort({ createdAt: -1 });
    return res.json(users.map(sanitizeUser));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load NGO list' });
  }
}

async function approveNgo(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.ngoStatus !== 'pending') {
      return res.status(400).json({ message: 'This user does not have a pending NGO request' });
    }
    user.ngoStatus = 'approved';
    await user.save();
    return res.json(sanitizeUser(user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to approve NGO request' });
  }
}

async function rejectNgo(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.ngoStatus !== 'pending') {
      return res.status(400).json({ message: 'This user does not have a pending NGO request' });
    }
    user.ngoStatus = 'rejected';
    await user.save();
    return res.json(sanitizeUser(user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reject NGO request' });
  }
}

async function listUsers(req, res) {
  try {
    const { type } = req.query;
    let query = {};
    if (type === 'donator') {
      query = { ngoStatus: 'none' };
    } else if (type === 'ngo') {
      query = { ngoStatus: { $ne: 'none' } };
    } else {
      // Default to donators to keep donators separate from NGOs
      query = { ngoStatus: 'none' };
    }
    const users = await User.find(query).sort({ createdAt: -1 });
    return res.json(users.map(sanitizeUser));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load users' });
  }
}

async function updateUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, mobile, city, newPassword } = req.body;

    if (name && String(name).trim()) {
      user.name = String(name).trim();
    }

    if (city && String(city).trim()) {
      user.city = String(city).trim();
    }

    if (mobile) {
      const cleanMobile = String(mobile).trim();
      if (!/^\d{10}$/.test(cleanMobile)) {
        return res.status(400).json({ message: 'Mobile number must be exactly 10 digits (0-9 only)' });
      }
      const taken = await User.findOne({ mobile: cleanMobile, _id: { $ne: user._id } });
      if (taken) {
        return res.status(409).json({ message: 'Mobile number is already in use' });
      }
      user.mobile = cleanMobile;
      if (user.ngoDetails) {
        user.ngoDetails.contactNum = cleanMobile;
      }
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }
      if (newPassword.length > 30) {
        return res.status(400).json({ message: 'New password must be no more than 30 characters' });
      }
      if (/[^a-zA-Z0-9@]/.test(newPassword)) {
        return res.status(400).json({ message: 'New password can only contain letters, numbers, and @' });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    return res.json(sanitizeUser(user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update user' });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await FoodDonation.deleteMany({ donorId: user._id });
    await user.deleteOne();
    return res.json({ message: 'User deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete user' });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    if (newPassword.length > 30) {
      return res.status(400).json({ message: 'New password must be no more than 30 characters' });
    }
    if (/[^a-zA-Z0-9@]/.test(newPassword)) {
      return res.status(400).json({ message: 'New password can only contain letters, numbers, and @' });
    }

    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(500).json({ message: 'Admin account is not configured' });
    }

    const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    admin.passwordHash = await bcrypt.hash(newPassword, 12);
    await admin.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to change password' });
  }
}

module.exports = {
  adminLogin,
  changePassword,
  getStats,
  listNgoRequests,
  approveNgo,
  rejectNgo,
  listUsers,
  updateUser,
  deleteUser,
};

