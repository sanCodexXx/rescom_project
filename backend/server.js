require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { setIo } = require('./utils/notify');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const centersRoutes = require('./routes/centers.routes');
const evacueesRoutes = require('./routes/evacuees.routes');
const priorityCasesRoutes = require('./routes/priorityCases.routes');
const incidentsRoutes = require('./routes/incidents.routes');
const dromicRoutes = require('./routes/dromic.routes');
const notificationsRoutes = require('./routes/notifications.routes');

const app = express();
const server = http.createServer(app);

const clientOrigin = process.env.CLIENT_ORIGIN || '*';
const io = new Server(server, {
  cors: { origin: clientOrigin, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }
});
setIo(io);

app.use(cors({ origin: clientOrigin }));
app.use(express.json());
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'RESCOM API' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/centers', centersRoutes);
app.use('/api/evacuees', evacueesRoutes);
app.use('/api/priority-cases', priorityCasesRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/dromic', dromicRoutes);
app.use('/api/notifications', notificationsRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('responder_location', ({ userId, latitude, longitude }) => {
    io.emit('responder_location_updated', { userId, latitude, longitude });
  });
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`RESCOM API & WebSocket running on http://localhost:${PORT}`);
});
