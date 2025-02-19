const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate Access Token
const generateAccessToken = (user) => {
  return jwt.sign({ user_id: user.user_id, email: user.email }, process.env.JWT_ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION, // 15 minutes (or change as per your requirement)
  });
};

// Generate Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign({ user_id: user.user_id, email: user.email }, process.env.JWT_REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION, // 7 days
  });
};

// Verify Access Token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
};

// Verify Refresh Token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_TOKEN_SECRET);
  } catch (err) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};