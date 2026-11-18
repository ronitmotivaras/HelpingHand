require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const seedAdmin = require('./scripts/seedAdmin');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());

const mongoose = require('mongoose');

app.get(['/api/admin/health', '/api/health', '/health'], (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'ok',
    db: isDbConnected ? 'connected' : 'disconnected',
  });
});


// Support /api/admin, /admin, and /api mount paths
app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);
app.use('/api', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Admin endpoint not found' });
});

const PORT = process.env.PORT || 5001;

async function start() {
  await connectDB();
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(`HelpingHand Admin API running on http://127.0.0.1:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start admin server:', err.message);
  process.exit(1);
});
