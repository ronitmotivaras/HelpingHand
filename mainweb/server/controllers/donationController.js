const FoodDonation = require('../models/FoodDonation');

function publicDonation(doc, reqUser) {
  // Normalize items for backward compatibility
  let items = doc.items && Array.isArray(doc.items) && doc.items.length > 0 ? doc.items : [];
  if (items.length === 0 && doc.foodName) {
    items = [{ name: doc.foodName, quantity: doc.quantity || '1', unit: 'portions' }];
  }

  // Normalize timing
  const pickupTo = doc.pickupTo || doc.availableUpto || null;
  const pickupFrom = doc.pickupFrom || doc.createdAt || null;
  const expiryAt = doc.expiryAt || doc.availableUpto || pickupTo;

  // Normalize status
  let status = doc.status || 'available';
  if (status === 'accepted') status = 'booked';
  if (status === 'picked_up') status = 'pickedUp';

  // Only approved NGOs or the donor themselves can see the contact phone
  const isOwner = reqUser && String(doc.donorId) === String(reqUser._id);
  const isApprovedNgo = reqUser && reqUser.ngoStatus === 'approved';
  const showPhone = Boolean(isOwner || isApprovedNgo);

  // Group summary (e.g. "15 portions + 3 kg")
  const summaryMap = {};
  items.forEach((item) => {
    const u = item.unit || 'portions';
    const num = parseFloat(item.quantity);
    if (!isNaN(num)) {
      summaryMap[u] = (summaryMap[u] || 0) + num;
    } else {
      summaryMap[u] = (summaryMap[u] || 0) + 1;
    }
  });
  const itemsSummary = Object.entries(summaryMap)
    .map(([unit, qty]) => `${qty} ${unit}`)
    .join(' + ') || doc.quantity || '';

  return {
    id: doc._id,
    donorId: doc.donorId,
    donorName: doc.donorName,
    donorPhone: showPhone ? doc.donorPhone : null,
    phoneVisible: showPhone,
    foodName: doc.foodName || (items[0] ? items[0].name : 'Food Donation'),
    items,
    itemsSummary,
    totalItemCount: items.length,
    quantity: doc.quantity || itemsSummary,
    foodType: doc.foodType,
    pickupFrom,
    pickupTo,
    expiryAt,
    availableUpto: doc.availableUpto || pickupTo,
    address: doc.address,
    city: doc.city,
    status,
    bookedByNgoName: doc.bookedByNgoName || '',
    bookedAt: doc.bookedAt || null,
    pickedUpAt: doc.pickedUpAt || null,
    createdAt: doc.createdAt,
  };
}

async function listDonations(req, res) {
  try {
    const city = (req.query.city || req.user?.city || '').trim();
    const foodType = (req.query.foodType || '').trim().toLowerCase();
    const search = (req.query.search || '').trim();
    const sort = (req.query.sort || 'newest').trim().toLowerCase();

    const now = new Date();

    // NGO feed shows ONLY "available" listings where pickupTo has not passed
    const filter = {
      status: 'available',
      $or: [
        { pickupTo: { $gt: now } },
        { pickupTo: { $exists: false }, availableUpto: { $gt: now } },
      ],
    };

    if (city) {
      filter.city = new RegExp(`^${escapeRegex(city)}$`, 'i');
    }

    if (foodType === 'veg' || foodType === 'nonveg') {
      filter.foodType = foodType;
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { foodName: searchRegex },
          { 'items.name': searchRegex },
          { address: searchRegex },
          { donorName: searchRegex },
        ],
      });
    }

    // Sort order: expiring soonest vs newest
    let sortOption = { createdAt: -1 };
    if (sort === 'expiring') {
      sortOption = { pickupTo: 1, expiryAt: 1, createdAt: -1 };
    }

    const donations = await FoodDonation.find(filter).sort(sortOption);
    return res.json(donations.map((doc) => publicDonation(doc, req.user)));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load donations' });
  }
}

async function getMyHistory(req, res) {
  try {
    const donations = await FoodDonation.find({ donorId: req.user._id }).sort({ createdAt: -1 });
    return res.json(donations.map((doc) => publicDonation(doc, req.user)));
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
    return res.json(publicDonation(donation, req.user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load donation' });
  }
}

async function createDonation(req, res) {
  try {
    const {
      items,
      foodName,
      quantity,
      foodType,
      contactName,
      phone,
      pickupFrom,
      pickupTo,
      expiryAt,
      availableUpto,
      address,
    } = req.body;

    // Validate food items
    let parsedItems = [];
    if (Array.isArray(items) && items.length > 0) {
      parsedItems = items
        .map((it) => ({
          name: String(it.name || '').trim(),
          quantity: String(it.quantity || '').trim(),
          unit: String(it.unit || 'portions').trim().toLowerCase(),
        }))
        .filter((it) => it.name && it.quantity);
    } else if (foodName && quantity) {
      parsedItems = [{
        name: String(foodName).trim(),
        quantity: String(quantity).trim(),
        unit: 'portions',
      }];
    }

    if (parsedItems.length === 0) {
      return res.status(400).json({ message: 'At least one food item with name and quantity is required' });
    }

    const allowedUnits = ['portions', 'kg', 'packets', 'pieces', 'litres'];
    for (const it of parsedItems) {
      if (!allowedUnits.includes(it.unit)) {
        return res.status(400).json({ message: `Invalid unit "${it.unit}". Allowed: portions, kg, packets, pieces, litres` });
      }
      const q = parseFloat(it.quantity);
      if (isNaN(q) || q <= 0) {
        return res.status(400).json({ message: `Quantity for "${it.name}" must be a positive number` });
      }
    }

    if (!foodType || (foodType !== 'veg' && foodType !== 'nonveg')) {
      return res.status(400).json({ message: 'Food type must be veg or nonveg' });
    }

    if (!contactName || !contactName.trim()) {
      return res.status(400).json({ message: 'Contact person name is required' });
    }

    const cleanPhone = String(phone || '').trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Contact phone must be exactly 10 digits (0-9 only)' });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({ message: 'Pickup address is required' });
    }

    // Timing validations
    const rawFrom = pickupFrom || new Date();
    const rawTo = pickupTo || availableUpto;
    const rawExp = expiryAt || rawTo;

    if (!rawFrom || !rawTo || !rawExp) {
      return res.status(400).json({ message: 'Pickup start time, pickup end time, and expiry time are all required' });
    }

    const fromDate = new Date(rawFrom);
    const toDate = new Date(rawTo);
    const expDate = new Date(rawExp);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || isNaN(expDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date or time format' });
    }

    // 1-minute grace for slight network/client clock drift
    const nowWithBuffer = new Date(Date.now() - 60000);
    if (fromDate < nowWithBuffer) {
      return res.status(400).json({ message: 'Pickup start time cannot be in the past' });
    }

    if (toDate <= fromDate) {
      return res.status(400).json({ message: 'Pickup end time must be after pickup start time' });
    }

    if (expDate <= fromDate) {
      return res.status(400).json({ message: 'Food expiry time must be after pickup start time' });
    }

    const donationCity = (req.body.city || req.user.city || '').trim();
    if (!donationCity) {
      return res.status(400).json({ message: 'City is required' });
    }

    // Build summaries for legacy support
    const legacyFoodName = parsedItems.map((i) => i.name).join(', ');
    const legacyQuantity = parsedItems.map((i) => `${i.quantity} ${i.unit}`).join(', ');

    const donation = await FoodDonation.create({
      donorId: req.user._id,
      donorName: contactName.trim(),
      donorPhone: cleanPhone,
      items: parsedItems,
      foodName: legacyFoodName,
      quantity: legacyQuantity,
      foodType,
      pickupFrom: fromDate,
      pickupTo: toDate,
      expiryAt: expDate,
      availableUpto: toDate, // Backwards compatibility
      address: address.trim(),
      city: donationCity,
      status: 'available',
    });

    return res.status(201).json(publicDonation(donation, req.user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create donation listing' });
  }
}

// Donor books listing with optional NGO name note
async function bookFood(req, res) {
  try {
    const donation = await FoodDonation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (String(donation.donorId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the donor can manage this listing' });
    }
    if (donation.status !== 'available') {
      return res.status(400).json({ message: 'Only available listings can be marked as booked' });
    }

    donation.status = 'booked';
    donation.bookedByNgoName = (req.body.ngoName || req.body.note || '').trim();
    donation.bookedAt = new Date();
    await donation.save();

    return res.json(publicDonation(donation, req.user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update listing' });
  }
}

// Donor releases booked listing back to available
async function releaseFood(req, res) {
  try {
    const donation = await FoodDonation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (String(donation.donorId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the donor can manage this listing' });
    }
    if (donation.status !== 'booked' && donation.status !== 'accepted') {
      return res.status(400).json({ message: 'Only booked listings can be released' });
    }

    donation.status = 'available';
    donation.bookedByNgoName = '';
    donation.bookedAt = null;
    await donation.save();

    return res.json(publicDonation(donation, req.user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to release listing' });
  }
}

// Donor marks listing as picked up
async function markPickedUp(req, res) {
  try {
    const donation = await FoodDonation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (String(donation.donorId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the donor can manage this listing' });
    }
    if (donation.status !== 'booked' && donation.status !== 'accepted' && donation.status !== 'available') {
      return res.status(400).json({ message: 'This listing cannot be marked as picked up' });
    }

    donation.status = 'pickedUp';
    donation.pickedUpAt = new Date();
    await donation.save();

    return res.json(publicDonation(donation, req.user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to mark listing as picked up' });
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
  bookFood,
  releaseFood,
  markPickedUp,
};
