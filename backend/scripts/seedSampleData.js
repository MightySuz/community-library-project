#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../src/models/Book');
const User = require('../src/models/User');

(async () => {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const admin = await User.findOne({ email: adminEmail });
    if (!admin) throw new Error('Admin user not found. Run npm run seed:admin first.');

    const barcode = 'INIT-' + Date.now();
    const book = await Book.create({
      title: 'Seed Book',
      author: 'System',
      barcode,
      genre: 'Fiction',
      publisher: admin._id,
      description: 'Initial seeded book',
      rental: { pricePerDay: 2, maxRentalDays: 14, securityDeposit: 0 },
      location: { community: 'GLOBAL' },
      approvalStatus: 'approved',
      metadata: { createdBy: admin._id }
    });
    console.log('Seeded book with barcode', barcode, 'id', book._id.toString());
    process.exit(0);
  } catch (e) {
    console.error('Seed sample data error:', e.message);
    process.exit(1);
  }
})();
