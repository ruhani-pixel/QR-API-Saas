const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { Whatsapp, SQLiteAdapter } = require('./dist');
const CronEngine = require('./cronEngine');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => res.send('🚀 Solid Models API is running!'));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();

// Initialize Whatsapp with SQLiteAdapter
const whatsapp = new Whatsapp({
  adapter: new SQLiteAdapter({
    databasePath: './sessions.db'
  }),
  debugLevel: 'silent',
  autoLoad: true,
  onQRUpdated: (sessionId, qr) => {
    console.log(`[Session:${sessionId}] QR Updated`);
    io.emit(`qr:${sessionId}`, { qr });
  },
  onConnected: (sessionId) => {
    console.log(`[Session:${sessionId}] Connected ✅`);
    io.emit('device:status', { sessionId, status: 'online' });
    updateDeviceStatus(sessionId, 'online');
  },
  onDisconnected: (sessionId) => {
    console.log(`[Session:${sessionId}] Disconnected ❌`);
    io.emit('device:status', { sessionId, status: 'offline' });
    updateDeviceStatus(sessionId, 'offline');
  },
  onConnecting: (sessionId) => {
    console.log(`[Session:${sessionId}] Connecting...`);
    io.emit('device:status', { sessionId, status: 'connecting' });
    updateDeviceStatus(sessionId, 'connecting');
  },
  onMessageReceived: (msg) => {
    console.log(`[Session:${msg.sessionId}] New Message from ${msg.key.remoteJid}`);
    io.emit('message:incoming', msg);
  }
});

async function updateDeviceStatus(sessionId, status) {
  try {
    await prisma.device.update({
      where: { sessionId },
      data: { status }
    });
  } catch (e) {
    // Device might not be in DB yet
  }
}

// Initialize CronEngine
const cronEngine = new CronEngine(whatsapp, io);

// ─── SESSION ROUTES ───

app.post('/api/session/start', async (req, res) => {
  const { sessionId, name } = req.body;
  try {
    // Save or Update device in DB
    await prisma.device.upsert({
      where: { sessionId },
      update: { name },
      create: { sessionId, name, status: 'connecting' }
    });

    await whatsapp.startSession(sessionId);
    res.json({ success: true, message: 'Session starting...' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/session/delete', async (req, res) => {
  const { sessionId } = req.body;
  try {
    await whatsapp.deleteSession(sessionId);
    await prisma.device.update({
      where: { sessionId },
      data: { status: 'offline' }
    });
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await prisma.device.findMany();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── CAMPAIGN ROUTES ───

app.post('/api/campaign/start', async (req, res) => {
  try {
    const result = await cronEngine.startCampaign(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/campaign/pause', async (req, res) => {
  const result = await cronEngine.pauseCampaign(req.body.campaignId);
  res.json(result);
});

app.post('/api/campaign/resume', async (req, res) => {
  const result = await cronEngine.resumeCampaign(req.body.campaignId);
  res.json(result);
});

app.post('/api/campaign/stop', async (req, res) => {
  const result = await cronEngine.stopCampaign(req.body.campaignId);
  res.json(result);
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Solid Models Backend running on port ${PORT}`);
});
