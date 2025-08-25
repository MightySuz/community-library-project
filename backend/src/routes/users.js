const express = require('express');
const Joi = require('joi');
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Validation
const updateSchema = Joi.object({
	fullName: Joi.string().min(2).max(100),
	parentName: Joi.string().min(2).max(100),
	communityName: Joi.string().min(2).max(100),
	bio: Joi.string().max(500).allow('', null),
	address: Joi.object({
		street: Joi.string().allow('', null),
		city: Joi.string().allow('', null),
		state: Joi.string().allow('', null),
		zipCode: Joi.string().allow('', null),
		country: Joi.string().allow('', null)
	}).optional()
});

// @route GET /api/users/me
// @desc  Get own profile
// @access Private
router.get('/me', auth, async (req, res) => {
	const user = await User.findById(req.user.userId).select('-password -refreshToken');
	res.json({ success:true, data:{ user } });
});

// @route PUT /api/users/me
// @desc  Update own profile
// @access Private
router.put('/me', auth, async (req, res) => {
	try {
		const { error, value } = updateSchema.validate(req.body, { abortEarly: true });
		if (error) return res.status(400).json({ success:false, error: error.details[0].message });
		const user = await User.findById(req.user.userId);
		if (!user) return res.status(404).json({ success:false, error:'User not found' });
		Object.assign(user, value);
		await user.save();
		res.json({ success:true, data:{ user: user.toJSON() } });
	} catch (e) {
		res.status(500).json({ success:false, error: e.message });
	}
});

// @route GET /api/users
// @desc  List users (admin)
// @access Private (Admin)
router.get('/', adminAuth, async (req, res) => {
	try {
		const { page=1, limit=20, community, persona, q } = req.query;
		const filter = {};
		if (community) filter.communityName = community;
		if (persona) filter.persona = persona;
		if (q) filter.$or = [
			{ fullName: new RegExp(q,'i') },
			{ email: new RegExp(q,'i') },
			{ communityName: new RegExp(q,'i') }
		];
		const skip = (parseInt(page)-1)*parseInt(limit);
		const users = await User.find(filter).select('-password -refreshToken').sort({ createdAt:-1 }).skip(skip).limit(parseInt(limit));
		const total = await User.countDocuments(filter);
		res.json({ success:true, data:{ items: users, page: parseInt(page), total, pages: Math.ceil(total/parseInt(limit)) } });
	} catch (e) {
		res.status(500).json({ success:false, error: e.message });
	}
});

module.exports = router;
