require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/helpinghand';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  city: { type: String, required: true, trim: true },
  ngoStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
  },
  ngoDetails: {
    ngoName: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    contactNum: { type: String, default: '' },
  },
  createdAt: { type: Date, default: Date.now },
});

const foodDonationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  donorName: { type: String, required: true, trim: true },
  donorPhone: { type: String, required: true, trim: true },
  foodName: { type: String, required: true, trim: true },
  quantity: { type: String, required: true, trim: true },
  foodType: { type: String, enum: ['veg', 'nonveg'], required: true },
  availableUpto: { type: Date, required: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['available', 'accepted', 'picked_up', 'expired'],
    default: 'available',
  },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const FoodDonation = mongoose.models.FoodDonation || mongoose.model('FoodDonation', foodDonationSchema);

async function seed() {
  console.log('Connecting to MongoDB on:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const defaultPasswordHash = await bcrypt.hash('user123', 10);

  // 1. Seed Dynamic Users (Individual Donors, Verified NGOs, Pending NGOs)
  const usersToSeed = [
    {
      name: 'Priya Sharma',
      mobile: '9825012345',
      passwordHash: defaultPasswordHash,
      city: 'Ahmedabad',
      ngoStatus: 'none',
      ngoDetails: {},
    },
    {
      name: 'Anil Mehta',
      mobile: '9879054321',
      passwordHash: defaultPasswordHash,
      city: 'Rajkot',
      ngoStatus: 'none',
      ngoDetails: {},
    },
    {
      name: 'Kavita Patel',
      mobile: '9712345678',
      passwordHash: defaultPasswordHash,
      city: 'Surat',
      ngoStatus: 'none',
      ngoDetails: {},
    },
    {
      name: 'Ravi Receiver',
      mobile: '9000000009',
      passwordHash: defaultPasswordHash,
      city: 'Ahmedabad',
      ngoStatus: 'approved',
      ngoDetails: {
        ngoName: 'Asha Food Relief Trust',
        address: 'Plot 12, Ashram Road, Navrangpura',
        city: 'Ahmedabad',
        contactNum: '9000000009',
      },
    },
    {
      name: 'Dr. Vikram Dave',
      mobile: '9898011223',
      passwordHash: defaultPasswordHash,
      city: 'Rajkot',
      ngoStatus: 'pending',
      ngoDetails: {
        ngoName: 'Saurashtra Annapurna Foundation',
        address: '14 Kalavad Road, Near KKV Hall',
        city: 'Rajkot',
        contactNum: '9898011223',
      },
    },
    {
      name: 'Meera Joshi',
      mobile: '9924088776',
      passwordHash: defaultPasswordHash,
      city: 'Ahmedabad',
      ngoStatus: 'pending',
      ngoDetails: {
        ngoName: 'Feeding Hope Relief Care',
        address: '402 SG Highway, Bodakdev',
        city: 'Ahmedabad',
        contactNum: '9924088776',
      },
    },
    {
      name: 'Suresh Nair',
      mobile: '9824155667',
      passwordHash: defaultPasswordHash,
      city: 'Surat',
      ngoStatus: 'approved',
      ngoDetails: {
        ngoName: 'Surat Seva Community Kitchen',
        address: '22 Ring Road, Athwa Lines',
        city: 'Surat',
        contactNum: '9824155667',
      },
    },
  ];

  const userMap = {};

  for (const u of usersToSeed) {
    let existing = await User.findOne({ mobile: u.mobile });
    if (!existing) {
      existing = await User.create(u);
      console.log(`Created user: ${existing.name} (${existing.mobile}, NGO: ${existing.ngoStatus})`);
    } else {
      existing.ngoStatus = u.ngoStatus;
      existing.ngoDetails = u.ngoDetails;
      existing.city = u.city;
      await existing.save();
      console.log(`Updated user: ${existing.name} (${existing.mobile}, NGO: ${existing.ngoStatus})`);
    }
    userMap[existing.mobile] = existing;
  }

  // Also get Ronit Motivaras if present
  const ronit = await User.findOne({ mobile: '9106384630' });
  if (ronit) {
    userMap['9106384630'] = ronit;
  }

  // 2. Seed Dynamic Food Donations (Available, Accepted, Picked Up)
  const now = Date.now();
  const hours = (h) => new Date(now + h * 3600 * 1000);

  const foodsToSeed = [
    // --- RAJKOT LISTINGS ---
    {
      donorMobile: '9879054321', // Anil Mehta
      foodName: '35 Meal Boxes: Paneer Butter Masala & Roti',
      quantity: '35 meal portions',
      foodType: 'veg',
      availableUpto: hours(8),
      address: 'Yagnik Road, Near Jagnath Temple',
      city: 'Rajkot',
      status: 'available',
    },
    {
      donorMobile: '9879054321', // Anil Mehta
      foodName: '20 Packs Kathiyawadi Khichdi & Kadhi',
      quantity: '20 packs (approx 8 kg)',
      foodType: 'veg',
      availableUpto: hours(6),
      address: '150 Feet Ring Road, Near Big Bazaar',
      city: 'Rajkot',
      status: 'available',
    },
    {
      donorMobile: '9879054321', // Anil Mehta
      foodName: '15 Food Parcels: Fresh Vegetable Biryani',
      quantity: '15 boxes',
      foodType: 'veg',
      availableUpto: hours(10),
      address: 'University Road, Near Saurashtra University Gate',
      city: 'Rajkot',
      status: 'available',
    },
    {
      donorMobile: '9879054321',
      foodName: '25 Fresh Lunch Boxes: Dal Fry & Jeera Rice',
      quantity: '25 boxes',
      foodType: 'veg',
      availableUpto: hours(4),
      address: 'Dhebar Road, Near Central Bus Station',
      city: 'Rajkot',
      status: 'accepted',
    },

    // --- AHMEDABAD LISTINGS ---
    {
      donorMobile: '9825012345', // Priya Sharma
      foodName: '40 Portions Gujarati Thali (Rotli, Shaak, Dal, Rice)',
      quantity: '40 full meal plates',
      foodType: 'veg',
      availableUpto: hours(7),
      address: 'Vastrapur Lake Road, Opp Alpha One Mall',
      city: 'Ahmedabad',
      status: 'available',
    },
    {
      donorMobile: '9825012345', // Priya Sharma
      foodName: '25 Boxes Club Sandwiches & Healthy Fruit Bowls',
      quantity: '25 meal trays',
      foodType: 'veg',
      availableUpto: hours(5),
      address: 'Prahladnagar Corporate Road',
      city: 'Ahmedabad',
      status: 'available',
    },
    {
      donorMobile: '9825012345', // Priya Sharma
      foodName: '18 Containers Hyderabadi Chicken Biryani with Raita',
      quantity: '18 large containers',
      foodType: 'nonveg',
      availableUpto: hours(6),
      address: 'Sindhu Bhavan Road, Bodakdev',
      city: 'Ahmedabad',
      status: 'available',
    },
    {
      donorMobile: '9825012345',
      foodName: '50 Fresh Chapatis & Mixed Dal',
      quantity: '50 rotis + 5L dal',
      foodType: 'veg',
      availableUpto: hours(3),
      address: 'Ellisbridge, Near Town Hall',
      city: 'Ahmedabad',
      status: 'picked_up',
    },

    // --- SURAT LISTINGS ---
    {
      donorMobile: '9712345678', // Kavita Patel
      foodName: '30 Packets Fresh Pav Bhaji & Pulao',
      quantity: '30 portions',
      foodType: 'veg',
      availableUpto: hours(6),
      address: 'Ghod Dod Road, Athwa Lines',
      city: 'Surat',
      status: 'available',
    },
    {
      donorMobile: '9712345678', // Kavita Patel
      foodName: '20 Trays Grilled Chicken & Herb Rice',
      quantity: '20 trays',
      foodType: 'nonveg',
      availableUpto: hours(5),
      address: 'Dumas Road, Piplod',
      city: 'Surat',
      status: 'available',
    },
  ];

  for (const f of foodsToSeed) {
    const donor = userMap[f.donorMobile] || (await User.findOne());
    if (!donor) continue;

    const existing = await FoodDonation.findOne({
      foodName: f.foodName,
      city: f.city,
    });

    if (!existing) {
      await FoodDonation.create({
        donorId: donor._id,
        donorName: donor.name,
        donorPhone: donor.mobile,
        foodName: f.foodName,
        quantity: f.quantity,
        foodType: f.foodType,
        availableUpto: f.availableUpto,
        address: f.address,
        city: f.city,
        status: f.status,
      });
      console.log(`Created donation: "${f.foodName}" in ${f.city} (${f.status})`);
    } else {
      existing.availableUpto = f.availableUpto;
      existing.status = f.status;
      await existing.save();
      console.log(`Updated donation: "${f.foodName}" in ${f.city} (${f.status})`);
    }
  }

  // Final summary counts
  const totalUsers = await User.countDocuments();
  const pendingNgos = await User.countDocuments({ ngoStatus: 'pending' });
  const approvedNgos = await User.countDocuments({ ngoStatus: 'approved' });
  const totalFoods = await FoodDonation.countDocuments();
  const availableFoods = await FoodDonation.countDocuments({ status: 'available' });

  console.log('\n--- SEED COMPLETE ---');
  console.log(`Total Users: ${totalUsers}`);
  console.log(`Pending NGOs: ${pendingNgos}`);
  console.log(`Verified NGOs: ${approvedNgos}`);
  console.log(`Total Food Donations: ${totalFoods}`);
  console.log(`Available Food Listings: ${availableFoods}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
