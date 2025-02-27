// routes/authRoutes.js
const express = require('express');

const { createUser, login, refreshToken, updateUserData, fetchCurrentUser, generateTokenForSocialLogins } = require('../controllers/users');
const { getStockData } = require('../controllers/nse');
const { saveComment, fetchComments, updateVote, fetchAllPosts, savePost } = require('../controllers/posts');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

router.post('/user/signup', createUser);
router.post('/user/login', login);
router.post('/api/refresh', refreshToken);
router.get('/api/user/current', fetchCurrentUser);
router.put('/api/user/updateData', updateUserData);
router.post('/user/social/token', generateTokenForSocialLogins);

router.post('/nse/getStockData', getStockData);

router.get('/api/posts/all', fetchAllPosts);
router.post('/api/posts', savePost);
router.post('/api/posts/saveComment', saveComment);
router.get('/api/posts/fetchComments/:post_id', fetchComments);
router.post('/api/posts/updateVote', updateVote);

module.exports = router;