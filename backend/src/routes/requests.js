const express = require('express');
const Joi = require('joi');
const { auth } = require('../middleware/auth');
const Book = require('../models/Book');
const BookRequest = require('../models/BookRequest');

const router = express.Router();

const createSchema = Joi.object({
  bookId: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required()
});

// Create request
router.post('/', auth, async (req,res) => {
  try {
    const { error, value } = createSchema.validate(req.body); if (error) return res.status(400).json({success:false,error:error.details[0].message});
    const book = await Book.findById(value.bookId);
    if (!book || book.approvalStatus !== 'approved' || !book.isActive) return res.status(404).json({success:false,error:'Book not available'});
    if (book.availability.status !== 'available') return res.status(400).json({success:false,error:'Book not currently available'});
    const request = await BookRequest.create({
      book: book._id,
      borrower: req.user.userId,
      publisher: book.publisher,
      requestedStartDate: value.startDate,
      requestedEndDate: value.endDate
    });
    res.status(201).json({success:true,data:{request}});
  } catch(e){res.status(500).json({success:false,error:e.message});}
});

// List my requests (borrower)
router.get('/mine', auth, async (req,res)=>{
  const items = await BookRequest.find({ borrower: req.user.userId })
    .populate('book','title author')
    .populate('borrower','fullName email')
    .populate('publisher','fullName email');
  res.json({success:true,data:{items}});
});

// Publisher pending requests for their books
router.get('/publisher/pending', auth, async (req,res)=>{
  const items = await BookRequest.find({ publisher: req.user.userId, status:'pending' })
    .populate('book','title author')
    .populate('borrower','fullName email')
    .populate('publisher','fullName email');
  res.json({success:true,data:{items}});
});

// Approve request
router.post('/:id/approve', auth, async (req,res)=>{
  try {
    const br = await BookRequest.findById(req.params.id).populate('book');
    if (!br) return res.status(404).json({success:false,error:'Not found'});
    if (String(br.publisher) !== req.user.userId) return res.status(403).json({success:false,error:'Not authorized'});
    if (br.status !== 'pending') return res.status(400).json({success:false,error:'Already processed'});
    br.status='approved';
    br.rental.actualStartDate = new Date();
    br.rental.actualEndDate = br.requestedEndDate;
    br.rental.status='active';
    await br.save();
    res.json({success:true,data:{request:br}});
  } catch(e){res.status(500).json({success:false,error:e.message});}
});

// Return rental
router.post('/:id/return', auth, async (req,res)=>{
  try {
    const br = await BookRequest.findById(req.params.id).populate('book');
    if (!br) return res.status(404).json({success:false,error:'Not found'});
    const isBorrower = String(br.borrower) === req.user.userId;
    const isPublisher = String(br.publisher) === req.user.userId;
    if (!isBorrower && !isPublisher) return res.status(403).json({success:false,error:'Not authorized'});
    if (br.rental.status !== 'active') return res.status(400).json({success:false,error:'Not active'});
    br.rental.returnDate = new Date();
    br.rental.status='returned';
    await br.save();
    res.json({success:true,data:{request:br}});
  } catch(e){res.status(500).json({success:false,error:e.message});}
});

module.exports = router;
