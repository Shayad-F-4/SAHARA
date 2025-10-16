const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username :{
    type: String,
    required: true,
    unique: true
  },
  userpassword:{
    type: String,
    required:true
  },
  name:{
    type: String,
    required:true
  },
  // Optional profile fields
  profile_pic: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  bio: { type: String, default: '' },
  resume: { type: String, default: '' },
  // Notification settings
  emergency_alerts: { type: Boolean, default: false },
  email_notifications: { type: Boolean, default: false },
  sms_notifications: { type: Boolean, default: false },
  // Emergency contact number
  emergency_number: { type: String, default: '' }
})

module.exports = mongoose.model('User', userSchema)