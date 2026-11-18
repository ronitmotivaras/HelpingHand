const FoodDonation = require('../models/FoodDonation');
const User = require('../models/User');
const Request = require('../models/Request');
const { sendNotification } = require('../utils/notify');

function publicDonation(doc, reqUser, blockedNgoIds = []) {
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
  const isApprovedNgo = reqUser && reqUser.ngoStatus === 'approved' && !reqUser.isBlocked;
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

  // Filter out any requests from blocked NGOs
  const blockedSet = new Set(blockedNgoIds.map(String));
  const rawRequests = Array.isArray(doc.requests) ? doc.requests : [];
  const allRequests = rawRequests.filter((r) => !blockedSet.has(String(r.ngoId)));

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

    // Auto-expire listings where expiryAt or pickupTo has passed
    await FoodDonation.updateMany(
      {
        status: { $in: ['available', 'accepted', 'booked'] },
        $or: [
          { expiryAt: { $lt: now } },
          { pickupTo: { $lt: now } },
        ],
      },
      { $set: { status: 'expired' } }
    );

    // Hidden data: Hide listings from blocked users
    const blockedUsers = await User.find({ isBlocked: true }, '_id');
    const blockedIds = blockedUsers.map((u) => u._id);

    // NGO feed shows ONLY active "available" listings where neither expiryAt nor pickupTo has passed
    const filter = {
      status: 'available',
      donorId: { $nin: blockedIds },
      $and: [
        {
          $or: [
            { expiryAt: { $gt: now } },
            { expiryAt: { $exists: false } },
          ],
        },
        {
          $or: [
            { pickupTo: { $gt: now } },
            { pickupTo: { $exists: false }, availableUpto: { $gt: now } },
          ],
        },
      ],
    };

    if (city) {
      filter.city = new RegExp(`^${escapeRegex(city)}$`, 'i');
    }

    if (foodType === 'veg' || foodType === 'nonveg' || foodType === 'mixed') {
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

    let sortOption = { expiryAt: 1, pickupTo: 1, createdAt: -1 };
    if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }

    const donations = await FoodDonation.find(filter).sort(sortOption);
    return res.json(donations.map((doc) => publicDonation(doc, req.user, blockedIds)));
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load donations' });
  }
}

async function getMyHistory(req, res) {
  try {
    const now = new Date();
    // Auto-expire donor's own elapsed listings
    await FoodDonation.updateMany(
      {
        donorId: req.user._id,
        status: { $in: ['available', 'accepted', 'booked'] },
        $or: [
          { expiryAt: { $lt: now } },
          { pickupTo: { $lt: now } },
        ],
      },
      { $set: { status: 'expired' } }
    );

    const blockedUsers = await User.find({ isBlocked: true }, '_id');
    const blockedIds = blockedUsers.map((u) => u._id);

    const donations = await FoodDonation.find({ donorId: req.user._id }).sort({ createdAt: -1 });
    return res.json(donations.map((doc) => publicDonation(doc, req.user, blockedIds)));
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

    // Check if donor is blocked
    const donor = await User.findById(donation.donorId);
    if (donor && donor.isBlocked && String(donor._id) !== String(req.user._id)) {
      return res.status(404).json({ message: 'This donation listing is no longer available' });
    }

    const blockedUsers = await User.find({ isBlocked: true }, '_id');
    const blockedIds = blockedUsers.map((u) => u._id);

    return res.json(publicDonation(donation, req.user, blockedIds));
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

    if (!foodType || (foodType !== 'veg' && foodType !== 'nonveg' && foodType !== 'mixed')) {
      return res.status(400).json({ message: 'Food type must be veg, nonveg, or mixed' });
    }

    if (!contactName || !contactName.trim()) {
      return res.status(400).json({ message: 'Contact person name is required' });
    }

    if (!/^[a-zA-Z\s]+$/.test(contactName.trim())) {
      return res.status(400).json({ message: 'Contact name can only contain alphabets and spaces' });
    }

    if (contactName.trim().length > 100) {
      return res.status(400).json({ message: 'Contact name cannot exceed 100 characters' });
    }

    const cleanPhone = String(phone || '').trim();
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Contact phone must be exactly 10 digits (0-9 only)' });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({ message: 'Pickup address is required' });
    }

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

    if (toDate < nowWithBuffer) {
      return res.status(400).json({ message: 'Pickup available end time cannot be in the past' });
    }

    if (expDate < nowWithBuffer) {
      return res.status(400).json({ message: 'Food expiry time cannot be in the past' });
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

// Requirement 2: Only verified NGOs can request
async function requestPickup(req, res) {
  try {
    if (!req.user || req.user.ngoStatus !== 'approved' || req.user.isBlocked) {
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

    // Check if NGO already requested in Request collection or donation.requests
    const existingActive = await Request.findOne({
      foodId: donation._id,
      ngoId: req.user._id,
      status: 'pending',
    });
    if (existingActive) {
      return res.status(400).json({ message: 'You have already submitted a pickup request for this listing' });
    }

    const ngoName = req.user.ngoDetails?.ngoName || req.user.name || 'NGO';
    const coordinatorName = req.user.ngoDetails?.coordinatorName || req.user.name || '';
    const phone = req.user.ngoDetails?.contactNum || req.user.ngoDetails?.coordinatorPhone || req.user.mobile || '';

    // Create standalone Request record
    const requestDoc = await Request.create({
      foodId: donation._id,
      ngoId: req.user._id,
      donorId: donation.donorId,
      ngoName,
      coordinatorName,
      phone,
      isVerified: true,
      status: 'pending',
    });

    // Also push to donation.requests for atomic backward compatibility
    donation.requests = donation.requests || [];
    donation.requests.push({
      _id: requestDoc._id,
      ngoId: req.user._id,
      ngoName,
      coordinatorName,
      phone,
      isVerified: true,
      status: 'pending',
      createdAt: requestDoc.createdAt,
    });
    await donation.save();

    // Requirement 3: Send notification to donor
    await sendNotification({
      userId: donation.donorId,
      type: 'request_received',
      title: 'New Pickup Request',
      message: `${ngoName} requested your food (${donation.foodName || 'Donation'}).`,
      link: '/my-donations',
      relatedFoodId: donation._id,
      relatedRequestId: requestDoc._id,
    });

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

    const activeRequest = await Request.findOne({
      foodId: donation._id,
      ngoId: req.user._id,
      status: 'pending',
    });

    if (!activeRequest) {
      return res.status(400).json({ message: 'No active pickup request found to cancel' });
    }

    activeRequest.status = 'cancelled';
    await activeRequest.save();

    donation.requests = donation.requests || [];
    const reqSubdoc = donation.requests.id(activeRequest._id);
    if (reqSubdoc) {
      reqSubdoc.status = 'cancelled';
    } else {
      const idx = donation.requests.findIndex(
        (r) => String(r.ngoId) === String(req.user._id) && r.status === 'pending'
      );
      if (idx !== -1) donation.requests[idx].status = 'cancelled';
    }
    await donation.save();

    const ngoName = req.user.ngoDetails?.ngoName || req.user.name || 'NGO';
    // Notify donor of cancellation
    await sendNotification({
      userId: donation.donorId,
      type: 'request_cancelled',
      title: 'Request Cancelled',
      message: `${ngoName} cancelled their pickup request for ${donation.foodName || 'Donation'}.`,
      link: '/my-donations',
      relatedFoodId: donation._id,
      relatedRequestId: activeRequest._id,
    });

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

    // Find in Request collection
    const targetRequest = await Request.findById(requestId);
    if (!targetRequest || String(targetRequest.foodId) !== String(donation._id)) {
      return res.status(404).json({ message: 'Pickup request not found' });
    }
    if (targetRequest.status !== 'pending') {
      return res.status(400).json({ message: `This request is already ${targetRequest.status}` });
    }

    targetRequest.status = 'accepted';
    await targetRequest.save();

    // Close all other pending requests on this food in Request collection
    const otherPending = await Request.find({
      foodId: donation._id,
      _id: { $ne: targetRequest._id },
      status: 'pending',
    });

    await Request.updateMany(
      {
        foodId: donation._id,
        _id: { $ne: targetRequest._id },
        status: 'pending',
      },
      { status: 'closed' }
    );

    // Sync subdocuments on donation
    donation.requests = donation.requests || [];
    for (const r of donation.requests) {
      if (String(r._id) === String(targetRequest._id)) {
        r.status = 'accepted';
      } else if (r.status === 'pending') {
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

    // Notify accepted NGO
    await sendNotification({
      userId: targetRequest.ngoId,
      type: 'request_accepted',
      title: 'Pickup Request Accepted!',
      message: `Your request was accepted. You can now see the donor's contact for ${donation.foodName}.`,
      link: `/food/${donation._id}`,
      relatedFoodId: donation._id,
      relatedRequestId: targetRequest._id,
    });

    // Notify other competing NGOs that food went to another organization
    for (const oth of otherPending) {
      await sendNotification({
        userId: oth.ngoId,
        type: 'request_closed',
        title: 'Food Request Update',
        message: `The food (${donation.foodName}) was accepted by another NGO.`,
        link: '/feed',
        relatedFoodId: donation._id,
        relatedRequestId: oth._id,
      });
    }

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
    const targetRequest = await Request.findById(requestId);
    if (!targetRequest || String(targetRequest.foodId) !== String(donation._id)) {
      return res.status(404).json({ message: 'Pickup request not found' });
    }
    if (targetRequest.status !== 'pending') {
      return res.status(400).json({ message: `This request is already ${targetRequest.status}` });
    }

    targetRequest.status = 'declined';
    await targetRequest.save();

    donation.requests = donation.requests || [];
    const rSub = donation.requests.id(requestId);
    if (rSub) {
      rSub.status = 'declined';
      await donation.save();
    }

    // Notify NGO that donor declined request
    await sendNotification({
      userId: targetRequest.ngoId,
      type: 'request_declined',
      title: 'Pickup Request Declined',
      message: `The donor declined your pickup request for ${donation.foodName}.`,
      link: '/feed',
      relatedFoodId: donation._id,
      relatedRequestId: targetRequest._id,
    });

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

    const prevAcceptedNgoId = donation.acceptedNgo?.ngoId;

    donation.status = 'available';
    donation.acceptedNgo = null;
    donation.bookedByNgoName = '';
    donation.bookedAt = null;
    await donation.save();

    // Notify previous NGO that food was released
    if (prevAcceptedNgoId) {
      await sendNotification({
        userId: prevAcceptedNgoId,
        type: 'listing_released',
        title: 'Listing Released',
        message: `The donor released the food (${donation.foodName}) back to available.`,
        link: `/food/${donation._id}`,
        relatedFoodId: donation._id,
      });
    }

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

// Requirement 4: NGO profile that the donor sees
// Only the donor who received the request can open this profile
async function getNgoProfileForDonor(req, res) {
  try {
    const { id, ngoId } = req.params;
    const donation = await FoodDonation.findById(id);
    if (!donation) {
      return res.status(404).json({ message: 'Food donation not found' });
    }

    // Security check: Only the donor of this food can open the NGO profile
    if (String(donation.donorId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the donor who received the request can view this NGO profile' });
    }

    const ngo = await User.findById(ngoId);
    if (!ngo || ngo.ngoStatus === 'none') {
      return res.status(404).json({ message: 'NGO organization not found' });
    }

    // Number of completed pickups (trust metric)
    const completedPickupsCount = await FoodDonation.countDocuments({
      status: 'pickedUp',
      $or: [
        { 'acceptedNgo.ngoId': ngo._id },
        { bookedByNgoName: ngo.ngoDetails?.ngoName || ngo.name },
      ],
    });

    const ngoDetails = ngo.ngoDetails || {};

    return res.json({
      id: ngo._id,
      ngoName: ngoDetails.ngoName || ngo.name,
      coordinatorName: ngoDetails.coordinatorName || ngo.name,
      phone: ngoDetails.contactNum || ngoDetails.coordinatorPhone || ngo.mobile,
      city: ngoDetails.city || ngo.city,
      address: ngoDetails.address || '',
      isVerified: ngo.ngoStatus === 'approved' && !ngo.isBlocked,
      createdAt: ngo.createdAt,
      completedPickupsCount,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load NGO profile' });
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
  getNgoProfileForDonor,
};
