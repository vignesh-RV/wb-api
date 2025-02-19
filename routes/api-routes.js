// routes/authRoutes.js
const express = require('express');

const { createUser, login, refreshToken, updateUserData, fetchCurrentUser } = require('../controllers/users');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

router.post('/user/signup', createUser);
router.post('/user/login', login);
router.post('/api/refresh', refreshToken);
router.get('/api/user/current', fetchCurrentUser);
router.put('/api/user/updateData', updateUserData);

module.exports = router;