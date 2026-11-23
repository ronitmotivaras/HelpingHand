/**
 * Clear All Data Script
 * Removes all entries from both admin and portal databases.
 * Both servers share the same MongoDB database (helpinghand),
 * so this script clears everything from one connection.
 *
 * Usage: node scripts/clearAllData.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/helpinghand';

async function clearAllData() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected.\n');

  const db = mongoose.connection.db;

  // List all collections and drop their documents
  const collections = await db.listCollections().toArray();

  for (const col of collections) {
    const name = col.name;
    // Skip the admin collection so the admin login account is preserved
    if (name === 'admins') {
      console.log(`  SKIPPED: ${name} (admin login preserved)`);
      continue;
    }
    const result = await db.collection(name).deleteMany({});
    console.log(`  Cleared: ${name} — ${result.deletedCount} documents removed`);
  }

  console.log('\nAll data cleared successfully (admin login preserved).');
  console.log('You can re-seed data with: node ../portal/server/scripts/seedDynamicData.js');

  await mongoose.disconnect();
}

clearAllData().catch((err) => {
  console.error('Error clearing data:', err);
  process.exit(1);
});
