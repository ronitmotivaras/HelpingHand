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

  // Normalize status: Available -> Accepted -> Picked up (plus Expired)
  let status = doc.status || 'available';
  if (status === 'booked') status = 'accepted';
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

  // Calculate active pending requests count
  const allRequests = Array.isArray(doc.requests) ? doc.requests : [];
  const pendingRequests = allRequests.filter((r) => r.status === 'pending');
  const requestCount = pendingRequests.length;

  // Check if reqUser is an NGO and has an active request on this listing
  let hasRequested = false;
  let myRequestStatus = null;
  let myRequestId = null;
  if (reqUser && reqUser._id) {
    const myReq = allRequests.find((r) => String(r.ngoId) === String(reqUser._id) && r.status !== 'cancelled');
    if (myReq) {
      myRequestId = myReq._id;
      myRequestStatus = myReq.status;
      if (myReq.status === 'pending' || myReq.status === 'accepted') {
        hasRequested = true;
      }
    }
  }

  // Accepted NGO details (available to owner and the accepted NGO)
  let acceptedNgo = null;
  if (doc.acceptedNgo && doc.acceptedNgo.ngoName) {
    acceptedNgo = {
      ngoId: doc.acceptedNgo.ngoId,
      ngoName: doc.acceptedNgo.ngoName,
      coordinatorName: doc.acceptedNgo.coordinatorName || '',
      phone: doc.acceptedNgo.phone || '',
      acceptedAt: doc.acceptedNgo.acceptedAt || doc.bookedAt || null,
    };
  } else if (doc.bookedByNgoName) {
    acceptedNgo = {
      ngoId: null,
      ngoName: doc.bookedByNgoName,
      coordinatorName: '',
      phone: '',
      acceptedAt: doc.bookedAt || null,
    };
  }

  // Only the donor gets the full list of requests with contact details
  let requests = [];
  if (isOwner) {
    requests = allRequests.map((r) => ({
      id: r._id,
      ngoId: r.ngoId,
      ngoName: r.ngoName,
      coordinatorName: r.coordinatorName || '',
      phone: r.phone || '',
      isVerified: r.isVerified !== false,
      status: r.status,
      createdAt: r.createdAt,
    }));
  }

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
    requestCount,
    hasRequested,
    myRequestStatus,
    myRequestId,
    requests,
    acceptedNgo,
    bookedByNgoName: acceptedNgo?.ngoName || doc.bookedByNgoName || '',
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
      parsedItems = [
        {
          name: String(foodName).trim(),
          quantity: String(quantity).trim(),
          unit: 'portions',
        },
      ];
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
      availableUpto: toDate,
      address: address.trim(),
      city: donationCity,
      status: 'available',
      requests: [],
    });

    return res.status(201).json(publicDonation(donation, req.user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create donation listing' });
  }
}

// NGO requests pickup (Only verified NGOs can request)
async function requestPickup(req, res) {
  try {
    if (!req.user || req.user.ngoStatus !== 'approved') {
      return res.status(403).json({
        message: 'Only verified NGOs can request food pickup. Your account is waiting for verification.',
      });
    }

    const donation = await FoodDonation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Food listing not found' });
    }

    if (String(donation.donorId) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot request pickup for your own food donation' });
    }

    if (donation.status !== 'available') {
      return res.status(400).json({ message: 'This food donation is no longer available for pickup' });
    }

    const now = new Date();
    const pickupTo = donation.pickupTo || donation.availableUpto;
    if (pickupTo && new Date(pickupTo) < now) {
      return res.status(400).json({ message: 'The pickup window for this listing has expired' });
    }

    donation.requests = donation.requests || [];
    const alreadyRequested = donation.requests.find(
      (r) => String(r.ngoId) === String(req.user._id) && r.status === 'pending'
    );
    if (alreadyRequested) {
      return res.status(400).json({ message: 'You have already submitted a pickup request for this listing' });
    }

    const ngoName = req.user.ngoDetails?.ngoName || req.user.name || 'NGO';
    const coordinatorName = req.user.ngoDetails?.coordinatorName || req.user.name || '';
    const phone = req.user.ngoDetails?.contactNum || req.user.ngoDetails?.coordinatorPhone || req.user.mobile || '';

    donation.requests.push({
      ngoId: req.user._id,
      ngoName,
      coordinatorName,
      phone,
      isVerified: true,
      status: 'pending',
      createdAt: new Date(),
    });

    await donation.save();
    return res.status(201).json(publicDonation(donation, req.user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to request pickup' });
  }
}

// NGO cancels their own pickup request
async function cancelPickupRequest(req, res) {
  try {
    const donation = await FoodDonation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Food listing not found' });
    }

    donation.requests = donation.requests || [];
    const reqIndex = donation.requests.findIndex(
      (r) => String(r.ngoId) === String(req.user._id) && r.status === 'pending'
    );

    if (reqIndex === -1) {
      return res.status(400).json({ message: 'No active pickup request found to cancel' });
    }

    donation.requests[reqIndex].status = 'cancelled';
    await donation.save();
    return res.json(publicDonation(donation, req.user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to cancel pickup request' });
  }
}

// Donor accepts an NGO's request:
// Food becomes Accepted, accepted NGO is stored, and other requests are closed automatically
async function acceptRequest(req, res) {
  try {
    const donation = await FoodDonation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (String(donation.donorId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the donor can manage this listing' });
    }
    if (donation.status !== 'available') {
      return res.status(400).json({ message: 'Only available listings can accept requests' });
    }

    const { requestId } = req.params;
    donation.requests = donation.requests || [];
    const targetRequest = donation.requests.id(requestId);

    if (!targetRequest) {
      return res.status(404).json({ message: 'Pickup request not found' });
    }
    if (targetRequest.status !== 'pending') {
      return res.status(400).json({ message: `This request is already ${targetRequest.status}` });
    }

    // Accept this request
    targetRequest.status = 'accepted';

    // Close all other requests on this listing
    for (const r of donation.requests) {
      if (String(r._id) !== String(requestId) && r.status === 'pending') {
        r.status = 'closed';
      }
    }

    donation.status = 'accepted';
    donation.acceptedNgo = {
      ngoId: targetRequest.ngoId,
      ngoName: targetRequest.ngoName,
      coordinatorName: targetRequest.coordinatorName,
      phone: targetRequest.phone,
      acceptedAt: new Date(),
    };
    donation.bookedByNgoName = targetRequest.ngoName;
    donation.bookedAt = new Date();

    await donation.save();
    return res.json(publicDonation(donation, req.user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to accept request' });
  }
}

// Donor declines a single request without affecting the others
async function declineRequest(req, res) {
  try {
    const donation = await FoodDonation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (String(donation.donorId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the donor can manage this listing' });
    }

    const { requestId } = req.params;
    donation.requests = donation.requests || [];
    const targetRequest = donation.requests.id(requestId);

    if (!targetRequest) {
      return res.status(404).json({ message: 'Pickup request not found' });
    }
    if (targetRequest.status !== 'pending') {
      return res.status(400).json({ message: `This request is already ${targetRequest.status}` });
    }

    targetRequest.status = 'declined';
    await donation.save();
    return res.json(publicDonation(donation, req.user));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to decline request' });
  }
}

// Donor releases accepted listing back to available
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
      return res.status(400).json({ message: 'Only accepted listings can be released' });
    }

    donation.status = 'available';
    donation.acceptedNgo = null;
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

// Backwards compatibility function
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
      return res.status(400).json({ message: 'Only available listings can be accepted' });
    }

    const ngoName = (req.body.ngoName || req.body.note || '').trim();
    donation.status = 'accepted';
    donation.bookedByNgoName = ngoName;
    donation.acceptedNgo = {
      ngoName,
      acceptedAt: new Date(),
    };
    donation.bookedAt = new Date();
    await donation.save();

    return res.json(publicDonation(donation, req.user));
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
  requestPickup,
  cancelPickupRequest,
  acceptRequest,
  declineRequest,
  bookFood,
  releaseFood,
  markPickedUp,
};
