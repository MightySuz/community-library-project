const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['fines', 'rental', 'wallet', 'notifications', 'general']
  },
  key: {
    type: String,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validationRules: {
    min: Number,
    max: Number,
    options: [String],
    pattern: String
  }
}, {
  timestamps: true
});

// Compound index to ensure unique key per category
systemConfigSchema.index({ category: 1, key: 1 }, { unique: true });

// Static method to get configuration by category
systemConfigSchema.statics.getByCategory = function(category) {
  return this.find({ category }).sort({ key: 1 });
};

// Static method to get a specific configuration value
systemConfigSchema.statics.getValue = function(category, key) {
  return this.findOne({ category, key }).then(config => config ? config.value : null);
};

// Static method to set a configuration value
systemConfigSchema.statics.setValue = function(category, key, value, modifiedBy) {
  return this.findOneAndUpdate(
    { category, key },
    { 
      value, 
      lastModifiedBy: modifiedBy,
      updatedAt: new Date()
    },
    { new: true }
  );
};

// Default system configurations
const defaultConfigs = [
  // Fine configurations
  {
    category: 'fines',
    key: 'overdue_fine_per_day',
    value: 2.00,
    dataType: 'number',
    description: 'Fine amount charged per day for overdue books',
    validationRules: { min: 0, max: 100 }
  },
  {
    category: 'fines',
    key: 'damage_fine_percentage',
    value: 50,
    dataType: 'number',
    description: 'Percentage of book value charged for damage',
    validationRules: { min: 0, max: 100 }
  },
  {
    category: 'fines',
    key: 'lost_book_multiplier',
    value: 2,
    dataType: 'number',
    description: 'Multiplier of book value for lost books',
    validationRules: { min: 1, max: 5 }
  },
  {
    category: 'fines',
    key: 'grace_period_days',
    value: 1,
    dataType: 'number',
    description: 'Grace period in days before fines start',
    validationRules: { min: 0, max: 7 }
  },
  
  // Rental configurations
  {
    category: 'rental',
    key: 'max_rental_days',
    value: 30,
    dataType: 'number',
    description: 'Maximum number of days a book can be rented',
    validationRules: { min: 1, max: 365 }
  },
  {
    category: 'rental',
    key: 'max_books_per_user',
    value: 5,
    dataType: 'number',
    description: 'Maximum books a user can borrow simultaneously',
    validationRules: { min: 1, max: 20 }
  },
  {
    category: 'rental',
    key: 'auto_extend_enabled',
    value: true,
    dataType: 'boolean',
    description: 'Allow automatic extension of rental periods'
  },
  {
    category: 'rental',
    key: 'extension_days',
    value: 7,
    dataType: 'number',
    description: 'Number of days for automatic extension',
    validationRules: { min: 1, max: 30 }
  },
  
  // Wallet configurations
  {
    category: 'wallet',
    key: 'min_balance_warning',
    value: 10,
    dataType: 'number',
    description: 'Minimum balance threshold for warnings',
    validationRules: { min: 0, max: 100 }
  },
  {
    category: 'wallet',
    key: 'max_wallet_balance',
    value: 1000,
    dataType: 'number',
    description: 'Maximum allowed wallet balance',
    validationRules: { min: 100, max: 10000 }
  },
  {
    category: 'wallet',
    key: 'daily_spend_limit',
    value: 100,
    dataType: 'number',
    description: 'Daily spending limit per user',
    validationRules: { min: 10, max: 1000 }
  },
  
  // Notification configurations
  {
    category: 'notifications',
    key: 'reminder_days_before_due',
    value: [1, 3],
    dataType: 'array',
    description: 'Days before due date to send reminders'
  },
  {
    category: 'notifications',
    key: 'email_notifications_enabled',
    value: true,
    dataType: 'boolean',
    description: 'Enable email notifications'
  },
  {
    category: 'notifications',
    key: 'sms_notifications_enabled',
    value: true,
    dataType: 'boolean',
    description: 'Enable SMS notifications'
  },
  
  // General configurations
  {
    category: 'general',
    key: 'platform_commission_percentage',
    value: 10,
    dataType: 'number',
    description: 'Platform commission percentage on transactions',
    validationRules: { min: 0, max: 50 }
  },
  {
    category: 'general',
    key: 'auto_approve_books',
    value: false,
    dataType: 'boolean',
    description: 'Automatically approve book listings'
  },
  {
    category: 'general',
    key: 'maintenance_mode',
    value: false,
    dataType: 'boolean',
    description: 'Enable maintenance mode'
  }
];

// Static method to initialize default configurations
systemConfigSchema.statics.initializeDefaults = async function() {
  for (const config of defaultConfigs) {
    await this.findOneAndUpdate(
      { category: config.category, key: config.key },
      config,
      { upsert: true, new: true }
    );
  }
};

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
