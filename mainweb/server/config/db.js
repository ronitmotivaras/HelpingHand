const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME || 'helpinghand',
    });
    console.log(`mainweb connected to MongoDB database: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;

