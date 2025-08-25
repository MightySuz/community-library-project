#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

async function run() {
  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in environment');
    process.exit(1);
  }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env to seed admin');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log('Admin user already exists:', ADMIN_EMAIL);
    process.exit(0);
  }
  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const user = await User.create({
    fullName: 'System Admin',
    parentName: 'N/A',
    communityName: 'GLOBAL',
    phoneNumber: '+10000000000',
    email: ADMIN_EMAIL,
    password: hashed,
    persona: ['admin','publisher','borrower'],
    isEmailVerified: true,
    isPhoneVerified: true,
    approvalStatus: 'approved',
    isActive: true
  });
  console.log('Seeded admin:', user.email, user._id.toString());
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});
