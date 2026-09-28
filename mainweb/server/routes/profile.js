const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getProfile, changePassword, applyNgo } = require('../controllers/profileController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getProfile);
router.patch('/password', changePassword);
router.post('/apply-ngo', applyNgo);

module.exports = router;
