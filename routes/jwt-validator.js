const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Middleware to verify the token
function validateToken(req, res, next) {
    if (!req.url.startsWith('/wb/api')) {
        next();
        return;
    }
    
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Access denied' });

  jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET, (err, user) => {
    if (err){
        console.log("Error while verifying token ...");
        console.dir(err);
        if(err.name === 'TokenExpiredError'){
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

module.exports = validateToken;
