const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { Whatsapp, SQLiteAdapter } = require('./dist');
const CronEngine = require('./cronEngine');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  allowEIO3: true,
  transports: ['polling', 'websocket']
});

const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const whatsapp = new Whatsapp({
  adapter: new SQLiteAdapter({ databasePath: './sessions.db' }),
  debugLevel: 'silent',
  autoLoad: false,
  onQRUpdated: async (args) => {
    let sid = args?.sessionId || '';
    let qr = args?.qr || '';
    if (sid && qr) {
      try { await prisma.device.update({ where: { sessionId: sid }, data: { currentQR: qr, status: 'connecting' } }); } catch (e) {}
      io.emit('qr', { sessionId: sid, qr });
    }
  },
  onConnected: (sessionId) => {
    const sid = typeof sessionId === 'string' ? sessionId : sessionId.sessionId || String(sessionId);
    console.log(`[Session:${sid}] Connected ✅`);
    io.emit('device:status', { sessionId: sid, status: 'online' });
    updateDeviceStatus(sid, 'online', true);
  },
  onDisconnected: (sessionId, reason) => {
    const sid = typeof sessionId === 'string' ? sessionId : sessionId.sessionId || String(sessionId);
    io.emit('device:status', { sessionId: sid, status: 'offline' });
    updateDeviceStatus(sid, 'offline');
  },
  onMessageReceived: async (msg) => {
    await saveOrUpdateMessage(msg);
    io.emit('message:incoming', msg);
    if (msg.pushName) {
      await updateContact(msg.sessionId, msg.key.remoteJid, { pushName: msg.pushName });
    }
  },
  onHistoryReceived: async (data) => {
    console.log(`[Session:${data.sessionId}] Syncing ${data.messages.length} messages`);
    for (const msg of data.messages) {
      await saveOrUpdateMessage(msg);
    }
    if (data.contacts) {
      for (const contact of data.contacts) {
        await updateContact(data.sessionId, contact.id, { name: contact.name, pushName: contact.notify });
      }
    }
    io.emit('history:synced', { sessionId: data.sessionId });
  },
  onMessageUpdated: async (data) => {
    try {
      await prisma.message.update({ where: { whatsappId: data.key.id }, data: { status: data.messageStatus } });
      io.emit('message:status', { whatsappId: data.key.id, status: data.messageStatus });
    } catch (e) {}
  },
  onPresenceUpdated: async (data) => {
    io.emit('presence:update', { sessionId: data.sessionId, remoteJid: data.remoteJid, presence: data.presence });
  }
});

async function updateContact(sessionId, remoteJid, data) {
  try {
    await prisma.contact.upsert({
      where: { sessionId_remoteJid: { sessionId, remoteJid } },
      update: data,
      create: { sessionId, remoteJid, ...data }
    });
  } catch (e) {}
}

const statusMap = {
  0: 'pending',
  1: 'server',
  2: 'delivered',
  3: 'read',
  4: 'played'
};

async function saveOrUpdateMessage(msg) {
  try {
    const whatsappId = msg.key.id;
    const timestamp = msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000) : new Date();
    let type = 'text';
    let content = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    let mediaPath = null;
    let fileName = null;

    if (msg.message?.imageMessage) { type = 'image'; content = msg.message.imageMessage.caption || ''; fileName = 'image.jpg'; }
    else if (msg.message?.videoMessage) { type = 'video'; content = msg.message.videoMessage.caption || ''; fileName = 'video.mp4'; }
    else if (msg.message?.documentMessage) { type = 'document'; content = msg.message.documentMessage.caption || ''; fileName = msg.message.documentMessage.fileName || 'file.pdf'; }

    const status = statusMap[msg.status] || 'delivered';

    await prisma.message.upsert({
      where: { whatsappId },
      update: { status },
      create: {
        whatsappId, sessionId: msg.sessionId, remoteJid: msg.key.remoteJid,
        pushName: msg.pushName || 'WhatsApp User',
        content, type, direction: msg.key.fromMe ? 'outbound' : 'inbound',
        status, mediaPath, fileName, timestamp,
        messageTimestamp: msg.messageTimestamp ? Number(msg.messageTimestamp) : null
      }
    });
  } catch (e) {}
}

async function updateDeviceStatus(sessionId, status, clearQR = false) {
  try {
    const data = { status };
    if (clearQR) data.currentQR = null;
    await prisma.device.upsert({
      where: { sessionId },
      update: data,
      create: { sessionId, name: `Node ${sessionId}`, status, currentQR: null }
    });
  } catch (e) {}
}

const cronEngine = new CronEngine(whatsapp, io);

app.post('/api/session/start', async (req, res) => {
  const { sessionId, name } = req.body;
  try {
    await prisma.device.upsert({ where: { sessionId }, update: { name, status: 'connecting' }, create: { sessionId, name, status: 'connecting' } });
    await whatsapp.startSession(sessionId);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/whatsapp/chats', async (req, res) => {
  try {
    const { sessionId } = req.query;
    const where = sessionId ? { sessionId } : {};
    const messages = await prisma.message.findMany({ where, orderBy: { timestamp: 'desc' } });
    const contacts = await prisma.contact.findMany({ where: sessionId ? { sessionId } : {} });
    const contactMap = new Map(contacts.map(c => [c.remoteJid, c]));
    const uniqueChats = [];
    const seenJids = new Set();
    for (const msg of messages) {
      if (!seenJids.has(msg.remoteJid)) {
        seenJids.add(msg.remoteJid);
        const contact = contactMap.get(msg.remoteJid);
        uniqueChats.push({
          id: msg.remoteJid,
          name: contact?.name || contact?.pushName || msg.pushName || msg.remoteJid.split('@')[0],
          profilePic: contact?.profilePic || null,
          lastMessage: msg.content || `[${msg.type.toUpperCase()}]`,
          timestamp: msg.timestamp,
          sessionId: msg.sessionId
        });
      }
    }
    res.json(uniqueChats);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/whatsapp/profile-pic', async (req, res) => {
  try {
    const { sessionId, remoteJid } = req.query;
    const session = await whatsapp.getSessionById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const url = await session.sock.profilePictureUrl(remoteJid, 'image').catch(() => null);
    if (url) await updateContact(sessionId, remoteJid, { profilePic: url });
    res.json({ url });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/whatsapp/messages', async (req, res) => {
  try {
    const { sessionId, remoteJid } = req.query;
    const messages = await prisma.message.findMany({ 
      where: { sessionId, remoteJid }, 
      orderBy: { timestamp: 'asc' }
    });
    res.json(messages);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/message/send', async (req, res) => {
  const { sessionId, to, text } = req.body;
  try {
    const response = await whatsapp.sendText({ sessionId, to, text });
    await prisma.message.create({
      data: {
        whatsappId: response.key.id, sessionId, remoteJid: to,
        pushName: 'Me', content: text, direction: 'outbound', status: 'server', timestamp: new Date()
      }
    });
    res.json({ success: true, data: response });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/message/send-media', upload.single('media'), async (req, res) => {
  const { sessionId, to, caption, type } = req.body;
  try {
    if (!req.file) throw new Error('No file uploaded');
    const media = fs.readFileSync(req.file.path);
    let response;
    if (type === 'image') response = await whatsapp.sendImage({ sessionId, to, media, text: caption || '' });
    else if (type === 'video') response = await whatsapp.sendVideo({ sessionId, to, media, text: caption || '' });
    else response = await whatsapp.sendDocument({ sessionId, to, media, filename: req.file.originalname, text: caption || '' });

    await prisma.message.create({
      data: {
        whatsappId: response.key.id, sessionId, remoteJid: to, pushName: 'Me',
        content: caption || `[${type.toUpperCase()}]`, type, direction: 'outbound',
        status: 'server', mediaPath: `/uploads/${req.file.filename}`, fileName: req.file.originalname, timestamp: new Date()
      }
    });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await prisma.device.findMany();
    res.json(sessions);
  } catch (e) { res.status(500).json([]); }
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Solid Models Backend running on port ${PORT}`);
  whatsapp.load();
});
