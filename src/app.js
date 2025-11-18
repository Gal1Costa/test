/* eslint-disable */
/**
 * Express application initialization for TrailHub.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL);


const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

const routes = require('./routes');
const { requestLogger } = require('./middleware/requestLogger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./src/app/auth.middleware');

dotenv.config();

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));
app.use(requestLogger);

// Auth middleware (populates req.user)
app.use(authMiddleware);

// Routes
app.use('/', routes);

// 404 and error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
