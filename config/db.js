require('dotenv').config();
const mongoose = require('mongoose')

const connectDB = () => {
  const url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/sahara';
  mongoose.connect(url, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    // Do not crash the app; continue to start so routes that don't need DB still work
  });
}

module.exports = connectDB;


