const path = require('path');
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { globalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { uploadDir } = require('./middleware/upload');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(globalLimiter);
  app.use('/uploads', express.static(uploadDir));

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
