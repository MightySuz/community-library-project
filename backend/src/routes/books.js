const express = require('express');
const Joi = require('joi');
const { optionalAuth, publisherAuth, auth } = require('../middleware/auth');
const Book = require('../models/Book');

const router = express.Router();

// Validation schemas
const createSchema = Joi.object({
  title: Joi.string().min(1).max(300).required(),
  author: Joi.string().min(1).max(200).required(),
  isbn: Joi.string().optional().allow('', null),
  barcode: Joi.string().min(3).max(100).required(),
  genre: Joi.string().required(),
  description: Joi.string().allow('', null),
  condition: Joi.string().valid('Excellent','Good','Fair','Poor').default('Good'),
  language: Joi.string().default('English'),
  publicationYear: Joi.number().integer().min(1000).max(new Date().getFullYear()+1).optional(),
  images: Joi.array().items(Joi.object({ url: Joi.string().uri().required(), caption: Joi.string().allow('', null) })).optional(),
  rental: Joi.object({
    pricePerDay: Joi.number().min(0).default(1),
    maxRentalDays: Joi.number().min(1).max(90).default(14),
    securityDeposit: Joi.number().min(0).default(0)
  }).default(),
  location: Joi.object({
    community: Joi.string().required(),
    address: Joi.string().allow('', null),
    coordinates: Joi.object({ latitude: Joi.number(), longitude: Joi.number() }).optional()
  }).required(),
  tags: Joi.array().items(Joi.string()).optional()
});

const updateSchema = createSchema.fork(['barcode','location.community'], (s)=> s.optional());

// @route   GET /api/books
// @desc    Get all approved & active books (filterable)
// @access  Public / optional auth for personalization later
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { community, publisher, status, q, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true, approvalStatus: 'approved' };
    if (community) filter['location.community'] = community;
    if (publisher) filter.publisher = publisher;
    if (status) filter['availability.status'] = status;
    if (q) filter.$text = { $search: q };

    const skip = (parseInt(page)-1) * parseInt(limit);
    const books = await Book.find(filter)
      .populate('publisher','fullName email communityName persona')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Book.countDocuments(filter);

    res.json({ success: true, data: { items: books, page: parseInt(page), total, pages: Math.ceil(total/parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ success:false, error: error.message });
  }
});

// @route   POST /api/books
// @desc    Create new book (pending approval)
// @access  Private (Publisher)
router.post('/', publisherAuth, async (req, res) => {
  try {
    const { error, value } = createSchema.validate(req.body, { abortEarly: true });
    if (error) return res.status(400).json({ success:false, error: error.details[0].message });

    // Enforce community from user if not admin
    if (!req.user.persona.includes('admin')) {
      value.location.community = req.user.communityName;
    }

    const book = new Book({
      ...value,
      publisher: req.user.userId,
      approvalStatus: req.user.persona.includes('admin') ? 'approved' : 'pending',
      metadata: { createdBy: req.user.userId }
    });
    await book.save();
    res.status(201).json({ success:true, data: { book } });
  } catch (error) {
    const status = error.code === 11000 ? 409 : 500;
    res.status(status).json({ success:false, error: error.code === 11000 ? 'Duplicate ISBN or barcode' : error.message });
  }
});

// @route   GET /api/books/:id
// @desc    Get book by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('publisher','fullName email communityName persona');
    if (!book || !book.isActive) return res.status(404).json({ success:false, error:'Book not found' });
    res.json({ success:true, data:{ book } });
  } catch (error) {
    res.status(404).json({ success:false, error:'Book not found' });
  }
});

// @route   PUT /api/books/:id
// @desc    Update book (owner or admin)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { error, value } = updateSchema.validate(req.body, { abortEarly: true });
    if (error) return res.status(400).json({ success:false, error: error.details[0].message });

    const book = await Book.findById(req.params.id);
    if (!book || !book.isActive) return res.status(404).json({ success:false, error:'Book not found' });
    const isOwner = String(book.publisher) === req.user.userId;
    const isAdmin = req.user.persona.includes('admin');
    if (!isOwner && !isAdmin) return res.status(403).json({ success:false, error:'Not authorized' });

    // Prevent changing community unless admin
    if (!isAdmin && value.location?.community && value.location.community !== book.location.community) {
      return res.status(400).json({ success:false, error:'Cannot change community' });
    }

    Object.assign(book, value);
    book.metadata.updatedBy = req.user.userId;
    await book.save();
    res.json({ success:true, data:{ book } });
  } catch (error) {
    res.status(500).json({ success:false, error: error.message });
  }
});

// @route   DELETE /api/books/:id
// @desc    Soft delete book (owner or admin)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || !book.isActive) return res.status(404).json({ success:false, error:'Book not found' });
    const isOwner = String(book.publisher) === req.user.userId;
    const isAdmin = req.user.persona.includes('admin');
    if (!isOwner && !isAdmin) return res.status(403).json({ success:false, error:'Not authorized' });

    book.isActive = false;
    book.metadata.updatedBy = req.user.userId;
    await book.save();
    res.json({ success:true, data:{ message:'Book deleted' } });
  } catch (error) {
    res.status(500).json({ success:false, error: error.message });
  }
});

module.exports = router;
