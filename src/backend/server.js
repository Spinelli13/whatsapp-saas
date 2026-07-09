require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { PORT, NODE_ENV, FRONTEND_URL } = require('./config/environment');
const { sequelize } = require('./models');
const whatsappService = require('./services/whatsappService');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(helmet());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

io.on('connection', (socket) => {
  const clienteId = socket.handshake.auth?.cliente_id;
  if (clienteId) {
    socket.join(`cliente_${clienteId}`);
  }

  socket.on('disconnect', () => {});
});

app.set('io', io);
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
  });
}

if (require.main === module) {
  start();
}

module.exports = { app, httpServer, io };
