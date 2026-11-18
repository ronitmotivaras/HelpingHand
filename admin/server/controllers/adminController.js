const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const FoodDonation = require('../models/FoodDonation');
const BlockedPhone = require('../models/BlockedPhone');
const Request = require('../models/Request');
const { sendNotification } = require('../utils/notify');

function sanitizeUser(user) {
  const rawNgo = user.ngoDetails ? (user.ngoDetails.toObject ? user.ngoDetails.toObject() : { ...user.ngoDetails }) : {};
  const isNgo = Boolean(user.ngoStatus && user.ngoStatus !== 'none');
  return {
    id: user._id,
    name: user.name,
    mobile: user.mobile,
    city: user.city,
    accountType: isNgo ? 'NGO' : 'Donor',
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
    adminNotes: Array.isArray(user.adminNotes) ? user.adminNotes : [],
    isBlocked: Boolean(user.isBlocked),
    blockedAt: user.blockedAt || null,
    blockedReason: user.blockedReason || '',
    createdAt: user.createdAt,
  };
}

const getStats = async (req, res) => {
  try {
    const totalDonators = await User.countDocuments({ ngoStatus: 'none', isBlocked: false });
    const totalUsers = totalDonators;
    const totalNgos = await User.countDocuments({ ngoStatus: { $ne: 'none' }, isBlocked: false });
    const pendingNgoReviews = await User.countDocuments({ ngoStatus: 'pending', isBlocked: false });
    const verifiedNgoPartners = await User.countDocuments({ ngoStatus: 'approved', isBlocked: false });
    const totalBlocked = await User.countDocuments({ isBlocked: true });

    res.json({ totalUsers, totalDonators, totalNgos, pendingNgoReviews, verifiedNgoPartners, totalBlocked });
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
    const { status, hasNotes } = req.query;
    let query = { ngoStatus: { $ne: 'none' }, isBlocked: false };
    if (status && status !== 'all') {
      query.ngoStatus = status;
    }
    if (hasNotes === 'true') {
      query['adminNotes.0'] = { $exists: true };
    }
    const users = await User.find(query).sort({ createdAt: -1 });
    return res.json(users.map(sanitizeUser));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load NGO list' });
  }
}

// Case 1: Called and confirmed real -> Verify
async function approveNgo(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.ngoStatus = 'approved';
    await user.save();

    // Notify NGO of verification
    await sendNotification({
      userId: user._id,
      type: 'status_changed',
      title: 'NGO Partner Verified',
      message: 'Your organization has been verified by the admin team! You can now request food pickups.',
      link: '/feed',
    });

    return res.json(sanitizeUser(user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to approve NGO request' });
  }
}

// Case 2: Decline (Block) NGO -> Blocks NGO into shared blocklist, cancels open requests
async function rejectNgo(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const reason = req.body?.reason || 'NGO verification declined / blocked by admin';
    user.ngoStatus = 'rejected';
    user.isBlocked = true;
    user.blockedAt = new Date();
    user.blockedReason = reason;

    user.adminNotes = user.adminNotes || [];
    user.adminNotes.unshift({
      note: `Decline (Block): ${reason}`,
      createdAt: new Date(),
    });

    await user.save();

    // Block phone numbers in BlockedPhone collection
    const phonesToBlock = new Set();
    if (user.mobile && /^\d{10}$/.test(user.mobile)) phonesToBlock.add(user.mobile);
    if (user.ngoDetails?.contactNum && /^\d{10}$/.test(user.ngoDetails.contactNum)) {
      phonesToBlock.add(user.ngoDetails.contactNum);
    }
    if (user.ngoDetails?.coordinatorPhone && /^\d{10}$/.test(user.ngoDetails.coordinatorPhone)) {
      phonesToBlock.add(user.ngoDetails.coordinatorPhone);
    }
    for (const phone of phonesToBlock) {
      await BlockedPhone.findOneAndUpdate(
        { phone },
        { phone, reason, blockedBy: 'admin', blockedAt: new Date() },
        { upsert: true, new: true }
      );
    }

    // Automatically cancel all open pending requests
    await Request.updateMany({ ngoId: user._id, status: 'pending' }, { status: 'cancelled' });
    await FoodDonation.updateMany(
      { 'requests.ngoId': user._id, 'requests.status': 'pending' },
      { $set: { 'requests.$[elem].status': 'cancelled' } },
      { arrayFilters: [{ 'elem.ngoId': user._id, 'elem.status': 'pending' }] }
    );

    return res.json(sanitizeUser(user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to decline NGO request' });
  }
}

// Requirement 2: If an NGO is moved back to Pending later, its open requests are cancelled automatically
async function setNgoPending(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.ngoStatus = 'pending';
    await user.save();

    // Auto-cancel open requests
    await Request.updateMany({ ngoId: user._id, status: 'pending' }, { status: 'cancelled' });
    await FoodDonation.updateMany(
      { 'requests.ngoId': user._id, 'requests.status': 'pending' },
      { $set: { 'requests.$[elem].status': 'cancelled' } },
      { arrayFilters: [{ 'elem.ngoId': user._id, 'elem.status': 'pending' }] }
    );

    // Notify NGO
    await sendNotification({
      userId: user._id,
      type: 'status_changed',
      title: 'NGO Verification Status',
      message: 'Your organization verification status was moved back to Pending review.',
      link: '/feed',
    });

    return res.json(sanitizeUser(user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update NGO status' });
  }
}

// Case B: Couldn't reach -> Keep Pending and add an admin-only note on the card
async function addAdminNote(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { note } = req.body;
    if (!note || !String(note).trim()) {
      return res.status(400).json({ message: 'Note content is required' });
    }

    user.adminNotes = user.adminNotes || [];
    user.adminNotes.unshift({
      note: String(note).trim(),
      createdAt: new Date(),
    });

    await user.save();
    return res.json(sanitizeUser(user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to add admin note' });
  }
}

async function listUsers(req, res) {
  try {
    const { type } = req.query;
    let query = { isBlocked: false };
    if (type === 'donator') {
      query.ngoStatus = 'none';
    } else if (type === 'ngo') {
      query.ngoStatus = { $ne: 'none' };
    } else {
      query.ngoStatus = 'none';
    }
    const users = await User.find(query).sort({ createdAt: -1 });
    return res.json(users.map(sanitizeUser));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load users' });
  }
}

// Requirement 1: One blocklist for both (NGOs and Donors)
async function listBlockedUsers(req, res) {
  try {
    const { type, search } = req.query;
    let query = { isBlocked: true };

    if (type === 'donator') {
      query.ngoStatus = 'none';
    } else if (type === 'ngo') {
      query.ngoStatus = { $ne: 'none' };
    }

    const users = await User.find(query).sort({ blockedAt: -1, createdAt: -1 });
    let result = users.map(sanitizeUser);

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(term) ||
          u.mobile?.toLowerCase().includes(term) ||
          u.city?.toLowerCase().includes(term) ||
          u.blockedReason?.toLowerCase().includes(term) ||
          u.ngoDetails?.ngoName?.toLowerCase().includes(term)
      );
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load blocked accounts' });
  }
}

// Requirement 1: Block user (Donor or NGO)
async function blockUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const reason = req.body?.reason || 'Account blocked by admin';
    user.isBlocked = true;
    user.blockedAt = new Date();
    user.blockedReason = reason;

    // Add note to adminNotes
    user.adminNotes = user.adminNotes || [];
    user.adminNotes.unshift({
      note: `Account Blocked: ${reason}`,
      createdAt: new Date(),
    });

    await user.save();

    // Block phone numbers in BlockedPhone collection
    const phonesToBlock = new Set();
    if (user.mobile && /^\d{10}$/.test(user.mobile)) phonesToBlock.add(user.mobile);
    if (user.ngoDetails?.contactNum && /^\d{10}$/.test(user.ngoDetails.contactNum)) {
      phonesToBlock.add(user.ngoDetails.contactNum);
    }
    if (user.ngoDetails?.coordinatorPhone && /^\d{10}$/.test(user.ngoDetails.coordinatorPhone)) {
      phonesToBlock.add(user.ngoDetails.coordinatorPhone);
    }

    for (const phone of phonesToBlock) {
      await BlockedPhone.findOneAndUpdate(
        { phone },
        { phone, reason, blockedBy: 'admin', blockedAt: new Date() },
        { upsert: true, new: true }
      );
    }

    // If NGO, auto-cancel open requests
    if (user.ngoStatus && user.ngoStatus !== 'none') {
      await Request.updateMany({ ngoId: user._id, status: 'pending' }, { status: 'cancelled' });
      await FoodDonation.updateMany(
        { 'requests.ngoId': user._id, 'requests.status': 'pending' },
        { $set: { 'requests.$[elem].status': 'cancelled' } },
        { arrayFilters: [{ 'elem.ngoId': user._id, 'elem.status': 'pending' }] }
      );
    }

    return res.json(sanitizeUser(user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to block user' });
  }
}

// Requirement 1: Unblock user (Unblocking an NGO sets it back to Pending, unblocking a donor restores account)
async function unblockUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isNgo = Boolean(user.ngoStatus && user.ngoStatus !== 'none');
    user.isBlocked = false;
    user.blockedAt = null;
    user.blockedReason = '';

    if (isNgo) {
      user.ngoStatus = 'pending';
    }

    user.adminNotes = user.adminNotes || [];
    user.adminNotes.unshift({
      note: 'Account Unblocked by admin',
      createdAt: new Date(),
    });

    await user.save();

    // Remove phone numbers from BlockedPhone collection
    const phones = [user.mobile, user.ngoDetails?.contactNum, user.ngoDetails?.coordinatorPhone].filter(Boolean);
    await BlockedPhone.deleteMany({ phone: { $in: phones } });

    // Send notification to user
    await sendNotification({
      userId: user._id,
      type: 'general',
      title: 'Account Unblocked',
      message: 'Your account has been unblocked by the administrator.',
      link: isNgo ? '/feed' : '/my-donations',
    });

    return res.json(sanitizeUser(user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to unblock user' });
  }
}

async function updateUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      name,
      mobile,
      city,
      newPassword,
      ngoName,
      coordinatorName,
      address,
      coordinatorPhone,
    } = req.body;

    if (name && String(name).trim()) {
      user.name = String(name).trim();
    }

    if (city && String(city).trim()) {
      user.city = String(city).trim();
      if (user.ngoDetails) {
        user.ngoDetails.city = String(city).trim();
      }
    }

    if (user.ngoDetails) {
      if (ngoName && String(ngoName).trim()) {
        user.ngoDetails.ngoName = String(ngoName).trim();
        user.name = String(ngoName).trim();
      }
      if (coordinatorName && String(coordinatorName).trim()) {
        user.ngoDetails.coordinatorName = String(coordinatorName).trim();
      }
      if (address && String(address).trim()) {
        user.ngoDetails.address = String(address).trim();
      }
      if (coordinatorPhone && String(coordinatorPhone).trim()) {
        const cleanCoord = String(coordinatorPhone).trim();
        if (/^\d{10}$/.test(cleanCoord)) {
          user.ngoDetails.coordinatorPhone = cleanCoord;
        }
      }
    }

    if (mobile) {
      const cleanMobile = String(mobile).trim();
      if (!/^\d{10}$/.test(cleanMobile)) {
        return res.status(400).json({ message: 'Mobile number must be exactly 10 digits (0-9 only)' });
      }
      const isBlocked = await BlockedPhone.findOne({ phone: cleanMobile });
      if (isBlocked) {
        return res.status(403).json({ message: 'This phone number is blocked from use.' });
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

// Delete user: Permanently deletes all data
async function deleteUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const shouldBlock = req.body?.blockPhone === true || req.query?.blockPhone === 'true';
    if (shouldBlock) {
      const phonesToBlock = new Set();
      if (user.mobile && /^\d{10}$/.test(user.mobile)) {
        phonesToBlock.add(user.mobile);
      }
      if (user.ngoDetails?.contactNum && /^\d{10}$/.test(user.ngoDetails.contactNum)) {
        phonesToBlock.add(user.ngoDetails.contactNum);
      }
      if (user.ngoDetails?.coordinatorPhone && /^\d{10}$/.test(user.ngoDetails.coordinatorPhone)) {
        phonesToBlock.add(user.ngoDetails.coordinatorPhone);
      }

      for (const phone of phonesToBlock) {
        await BlockedPhone.findOneAndUpdate(
          { phone },
          {
            phone,
            reason: req.body?.reason || 'Confirmed fraud / blocked account',
            blockedBy: 'admin',
            blockedAt: new Date(),
          },
          { upsert: true, new: true }
        );
      }
    }

    // Delete donations by this user
    await FoodDonation.deleteMany({ donorId: user._id });

    // Clean up any requests made by this user or made for this user's donations
    await Request.deleteMany({ $or: [{ ngoId: user._id }, { donorId: user._id }] });

    await FoodDonation.updateMany(
      { 'requests.ngoId': user._id },
      { $pull: { requests: { ngoId: user._id } } }
    );

    await user.deleteOne();
    return res.json({
      message: shouldBlock
        ? 'User and associated data permanently deleted and phone number blocked from registration'
        : 'User and all associated data permanently deleted',
    });
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
  setNgoPending,
  addAdminNote,
  listUsers,
  listBlockedUsers,
  blockUser,
  unblockUser,
  updateUser,
  deleteUser,
};
