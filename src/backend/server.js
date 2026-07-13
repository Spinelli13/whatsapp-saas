require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { PORT, NODE_ENV, FRONTEND_URL } = require('./config/environment');
const { initializeSocket } = require('./config/socket');
const { sequelize } = require('./models');
const whatsappService = require('./services/whatsappService');
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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

whatsappService.setIO(io);

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
