// server.js
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/api-routes');
const dotenv = require('dotenv');
const validateToken = require('./routes/jwt-validator');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Define the allowed origins
const allowedOrigins = ['http://localhost:4200', 'https://wb-ui.onrender.com'];

// CORS options to allow specific origins
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      // Allow the request if the origin is in the allowed list or if it's a server-side request (like Postman)
      callback(null, true);
    } else {
      // Reject the request if the origin is not allowed
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};

// Use the CORS middleware with the custom options
app.use(cors(corsOptions));



// Middleware
app.use(bodyParser.json({limit: '50mb'}));

// Routes
app.use(validateToken);
app.use('/wb', authRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
