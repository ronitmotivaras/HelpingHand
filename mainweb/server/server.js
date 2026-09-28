require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const startExpireListingsJob = require('./jobs/expireListings');
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const profileRoutes = require('./routes/profile');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/profile', profileRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  startExpireListingsJob();
  app.listen(PORT, () => {
    console.log(`HelpingHand API running on http://127.0.0.1:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
