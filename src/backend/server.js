require('dotenv').config();
const Sentry = require('@sentry/node');
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('./config/passport');

const { PORT, NODE_ENV, FRONTEND_URL, JWT_SECRET, SENTRY_DSN } = require('./config/environment');

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: NODE_ENV,
    beforeSend(event) {
      if (event.request?.headers?.authorization) {
        delete event.request.headers.authorization;
      }
      return event;
    },
  });
}
const { initializeSocket } = require('./config/socket');
const { sequelize } = require('./models');
const whatsappService = require('./services/whatsappService');
const DataRetentionService = require('./services/dataRetentionService');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.io with JWT auth + tenant namespaces
const io = initializeSocket(httpServer);

app.use(helmet());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions (required for Passport OAuth state parameter)
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

if (NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Expose io to route handlers via req.io and req.app.get('io')
app.set('io', io);
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

app.get('/health/ready', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ready', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', database: 'disconnected', error: err.message });
  }
});

app.use(errorHandler);

whatsappService.setIO(io);

DataRetentionService.agendarCleanup();

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Banco de dados conectado');
  } catch (err) {
    console.warn(`Banco indisponível: ${err.message}`);
  }

  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} [${NODE_ENV}]`);
    console.log(`Socket.io ready on ws://localhost:${PORT}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = { app, httpServer, io };
