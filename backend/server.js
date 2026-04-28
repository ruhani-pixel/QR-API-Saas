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
    origin: "*",
    methods: ["GET", "POST"]
  },
  allowEIO3: true,
  transports: ['polling', 'websocket']
});

const prisma = new PrismaClient();

// Initialize Whatsapp with SQLiteAdapter
const whatsapp = new Whatsapp({
  adapter: new SQLiteAdapter({
    databasePath: './sessions.db'
  }),
  debugLevel: 'silent',
  autoLoad: false,
  onQRUpdated: async (...args) => {
    // Debug all arguments to find where the data is hiding
    console.log('[DEBUG] onQRUpdated arguments:', JSON.stringify(args, null, 2));
    
    let sid = '';
    let qr = '';

    // Strategy 1: (sessionId, qr)
    if (typeof args[0] === 'string' && typeof args[1] === 'string') {
      sid = args[0];
      qr = args[1];
    } 
    // Strategy 2: ({ sessionId, qr })
    else if (args[0] && typeof args[0] === 'object') {
      sid = args[0].sessionId || args[0].id || '';
      qr = args[0].qr || args[0].data || '';
    }

    if (!sid || !qr) {
      console.error('[CRITICAL] Failed to extract SID or QR from args!');
      return;
    }

    console.log(`[Session:${sid}] QR Captured Successfully! Length: ${qr.length}`);
    
    try {
      await prisma.device.update({
        where: { sessionId: sid },
        data: { currentQR: qr, status: 'connecting' }
      });
    } catch (e) {
      console.error('Failed to save QR to DB:', e);
    }

    io.emit('qr', { sessionId: sid, qr });
  },
  onConnected: (sessionId) => {
    const sid = typeof sessionId === 'string' ? sessionId : sessionId.sessionId || String(sessionId);
    console.log(`[Session:${sid}] Connected ✅`);
    io.emit('device:status', { sessionId: sid, status: 'online' });
    updateDeviceStatus(sid, 'online', true); // true to clear QR
  },
  onDisconnected: (sessionId) => {
    const sid = typeof sessionId === 'string' ? sessionId : sessionId.sessionId || String(sessionId);
    console.log(`[Session:${sid}] Disconnected ❌`);
    io.emit('device:status', { sessionId: sid, status: 'offline' });
    updateDeviceStatus(sid, 'offline');
  },
  onConnecting: (sessionId) => {
    const sid = typeof sessionId === 'string' ? sessionId : sessionId.sessionId || String(sessionId);
    console.log(`[Session:${sid}] Connecting...`);
    io.emit('device:status', { sessionId: sid, status: 'connecting' });
    updateDeviceStatus(sid, 'connecting');
  },
  onMessageReceived: async (msg) => {
    console.log(`[Session:${msg.sessionId}] New Message from ${msg.key.remoteJid}`);
    await saveOrUpdateMessage(msg);
    io.emit('message:incoming', msg);
  },
  onHistoryReceived: async (data) => {
    console.log(`[Session:${data.sessionId}] Syncing ${data.messages.length} historical messages...`);
    for (const msg of data.messages) {
      await saveOrUpdateMessage(msg);
    }
    console.log(`[Session:${data.sessionId}] History sync completed.`);
  }
});

async function saveOrUpdateMessage(msg) {
  try {
    const content = msg.message?.conversation || 
                    msg.message?.extendedTextMessage?.text || 
                    (msg.message?.imageMessage ? '[Image]' : '[Media]') || 
                    '';
    
    const whatsappId = msg.key.id;
    const timestamp = msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000) : new Date();

    await prisma.message.upsert({
      where: { whatsappId: whatsappId },
      update: {
        status: 'delivered', // Update status if message already exists
      },
      create: {
        whatsappId: whatsappId,
        sessionId: msg.sessionId,
        remoteJid: msg.key.remoteJid,
        pushName: msg.pushName || 'WhatsApp User',
        content: content,
        direction: msg.key.fromMe ? 'outbound' : 'inbound',
        status: 'delivered',
        timestamp: timestamp,
        messageTimestamp: msg.messageTimestamp ? Number(msg.messageTimestamp) : null
      }
    });
  } catch (e) {
    // console.error('Failed to save message:', e);
  }
}

console.log('✅ Whatsapp Engine Initialized');

async function updateDeviceStatus(sessionId, status, clearQR = false) {
  try {
    const data = { status };
    if (clearQR) data.currentQR = null;
    
    await prisma.device.update({
      where: { sessionId },
      data
    });
  } catch (e) {
    console.error('Failed to update status:', e);
  }
}

// Initialize CronEngine
const cronEngine = new CronEngine(whatsapp, io);

// Load all saved sessions from DB
whatsapp.load().then(() => {
  console.log('✅ Loaded existing WhatsApp sessions');
}).catch(err => {
  console.error('Failed to load WhatsApp sessions:', err);
});

// ─── SESSION ROUTES ───

app.post('/api/session/start', async (req, res) => {
  const { sessionId, name } = req.body;
  const sid = String(sessionId);
  console.log(`[API] Starting session: ${sid} for ${name}`);
  try {
    // Force cleanup if session exists in memory
    try {
      await whatsapp.deleteSession(sid);
    } catch (e) {
      // Ignore if doesn't exist
    }

    // Save or Update device in DB
    await prisma.device.upsert({
      where: { sessionId: sid },
      update: { name, currentQR: null, status: 'connecting' },
      create: { sessionId: sid, name, status: 'connecting' }
    });

    console.log(`[API] Triggering Whatsapp.startSession for ${sid}`);
    await whatsapp.startSession(sid);
    console.log(`[API] Whatsapp.startSession initiated for ${sid}`);
    res.json({ success: true, message: 'Session starting...' });
  } catch (error) {
    console.error(`[API] Error starting session ${sid}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/session/delete', async (req, res) => {
  const { sessionId } = req.body;
  try {
    try {
      await whatsapp.deleteSession(sessionId);
    } catch(e) {}
    await prisma.device.delete({
      where: { sessionId }
    });
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/session/bulk-delete', async (req, res) => {
  const { sessionIds } = req.body;
  if (!Array.isArray(sessionIds)) {
    return res.status(400).json({ success: false, error: 'Invalid input' });
  }
  
  let deletedCount = 0;
  for (const sessionId of sessionIds) {
    try {
      try {
        await whatsapp.deleteSession(sessionId);
      } catch(e) {}
      await prisma.device.delete({
        where: { sessionId }
      });
      deletedCount++;
    } catch (e) {
      console.error(`Failed to delete session ${sessionId}:`, e);
    }
  }
  
  res.json({ success: true, message: `Successfully deleted ${deletedCount} sessions.` });
});

app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await prisma.device.findMany();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const { sessionId, remoteJid } = req.query;
    const where = {};
    if (sessionId) where.sessionId = sessionId;
    if (remoteJid) where.remoteJid = remoteJid;

    const messages = await prisma.message.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 50
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── MESSAGE ROUTES ───

app.post('/api/message/send', async (req, res) => {
  const { sessionId, to, text } = req.body;
  if (!sessionId || !to || !text) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    // Send via WhatsApp
    const response = await whatsapp.sendText({
      sessionId,
      to,
      text
    });

    // Save outbound message to DB
    await prisma.message.upsert({
      where: { whatsappId: response.key.id },
      update: { status: 'sent' },
      create: {
        whatsappId: response.key.id,
        sessionId,
        remoteJid: to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`,
        pushName: 'Me',
        content: text,
        direction: 'outbound',
        status: 'sent',
        timestamp: new Date()
      }
    });

    res.json({ success: true, message: 'Message sent successfully', data: response });
  } catch (error) {
    console.error('Failed to send message:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to send message' });
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
