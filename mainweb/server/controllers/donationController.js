const FoodDonation = require('../models/FoodDonation');

function publicDonation(doc) {
  return {
    id: doc._id,
    donorName: doc.donorName,
    donorPhone: doc.donorPhone,
    foodName: doc.foodName,
    quantity: doc.quantity,
    foodType: doc.foodType,
    availableUpto: doc.availableUpto,
    address: doc.address,
    city: doc.city,
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

async function listDonations(req, res) {
  try {
    const city = (req.query.city || req.user.city || '').trim();
    const foodType = (req.query.foodType || '').trim().toLowerCase();

    const filter = {
      city: new RegExp(`^${escapeRegex(city)}$`, 'i'),
      status: { $in: ['available', 'accepted'] },
    };

    if (foodType === 'veg' || foodType === 'nonveg') {
      filter.foodType = foodType;
    }

    const donations = await FoodDonation.find(filter).sort({ createdAt: -1 });
    return res.json(donations.map(publicDonation));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load donations' });
  }
}

async function getMyHistory(req, res) {
  try {
    const donations = await FoodDonation.find({ donorId: req.user._id }).sort({ createdAt: -1 });
    return res.json(donations.map(publicDonation));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load donation history' });
  }
}

async function getDonation(req, res) {
  try {
    const donation = await FoodDonation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    return res.json(publicDonation(donation));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load donation' });
  }
}

async function createDonation(req, res) {
  try {
    const { foodName, quantity, foodType, contactName, phone, availableUpto, address } = req.body;

    if (!foodName || !quantity || !foodType || !contactName || !phone || !availableUpto || !address) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (foodType !== 'veg' && foodType !== 'nonveg') {
      return res.status(400).json({ message: 'Food type must be veg or nonveg' });
    }

    const cleanPhone = String(phone).trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Contact phone must be exactly 10 digits (0-9 only)' });
    }

    const donationCity = (req.body.city || req.user.city || '').trim();

    const donation = await FoodDonation.create({
      donorId: req.user._id,
      donorName: contactName.trim(),
      donorPhone: cleanPhone,
      foodName: foodName.trim(),
      quantity: String(quantity).trim(),
      foodType,
      availableUpto: new Date(availableUpto),
      address: address.trim(),
      city: donationCity,
      status: 'available',
    });

    return res.status(201).json(publicDonation(donation));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create donation' });
  }
}

async function markAccepted(req, res) {
  try {
    const donation = await FoodDonation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    if (String(donation.donorId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the donor can update this listing' });
    }
    if (donation.status !== 'available') {
      return res.status(400).json({ message: 'Only available listings can be marked accepted' });
    }

    donation.status = 'accepted';
    await donation.save();
    return res.json(publicDonation(donation));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update listing' });
  }
}

async function markPickedUp(req, res) {
  try {
    const donation = await FoodDonation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    if (String(donation.donorId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the donor can update this listing' });
    }
    if (donation.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted listings can be marked picked up' });
    }

    donation.status = 'picked_up';
    await donation.save();
    return res.json(publicDonation(donation));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update listing' });
  }
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  listDonations,
  getMyHistory,
  getDonation,
  createDonation,
  markAccepted,
  markPickedUp,
};
