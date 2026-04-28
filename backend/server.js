const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { Whatsapp, SQLiteAdapter } = require('./dist');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { downloadMediaMessage } = require('baileys');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  allowEIO3: true,
  transports: ['polling', 'websocket']
});

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const whatsapp = new Whatsapp({
  adapter: new SQLiteAdapter({ databasePath: './sessions.db' }),
  debugLevel: 'silent',
  autoLoad: true,
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
    syncProfilePic(msg.sessionId, msg.key.remoteJid);
    if (!msg.key.fromMe) handleAIAutoReply(msg);
  },
  onHistoryReceived: async (data) => {
    if (data.contacts) {
      for (const contact of data.contacts) {
        const name = contact.name || contact.verifiedName || contact.notify || contact.shortName;
        if (name) await updateContact(data.sessionId, contact.id, { name: contact.name || contact.verifiedName || contact.shortName, pushName: contact.notify });
      }
    }
    for (const msg of data.messages) await saveOrUpdateMessage(msg);
    io.emit('history:synced', { sessionId: data.sessionId });
  }
});

async function handleAIAutoReply(msg) {
  try {
    const device = await prisma.device.findUnique({ where: { sessionId: msg.sessionId } });
    if (!device || !device.aiEnabled || !device.aiInstructions) return;

    // Contact Level Override Check
    const contact = await prisma.contact.findUnique({ where: { sessionId_remoteJid: { sessionId: msg.sessionId, remoteJid: msg.key.remoteJid } } });
    if (contact && contact.aiEnabled === false) return;

    // Check if new/existing user based on message history
    const historyCount = await prisma.message.count({ where: { sessionId: msg.sessionId, remoteJid: msg.key.remoteJid } });
    const isNewUser = historyCount <= 1;

    if (isNewUser && !device.aiReplyNewUsers) return;
    if (!isNewUser && !device.aiReplyExistingUsers) return;

    // Fetch Last 20 messages for context
    const recentMessages = await prisma.message.findMany({
      where: { sessionId: msg.sessionId, remoteJid: msg.key.remoteJid },
      orderBy: { timestamp: 'desc' },
      take: 20
    });
    
    const chatContext = recentMessages.reverse().map(m => `${m.direction === 'inbound' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-lite-latest" });
    const prompt = `System Instructions: ${device.aiInstructions}\n\nChat History:\n${chatContext}\n\nAssistant:`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    if (responseText) {
      await whatsapp.sendText({ sessionId: msg.sessionId, to: msg.key.remoteJid, text: responseText });
    }
  } catch (e) { console.error('AI Reply Error:', e); }
}

async function updateContact(sessionId, remoteJid, data) {
  try {
    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.pushName) updateData.pushName = data.pushName;
    if (data.profilePic) updateData.profilePic = data.profilePic;
    if (data.aiEnabled !== undefined) updateData.aiEnabled = data.aiEnabled;

    await prisma.contact.upsert({
      where: { sessionId_remoteJid: { sessionId, remoteJid } },
      update: updateData,
      create: { sessionId, remoteJid, aiEnabled: true, ...data }
    });
  } catch (e) {}
}

async function saveOrUpdateMessage(msg) {
  try {
    const whatsappId = msg.key.id;
    const timestamp = msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000) : new Date();
    let type = 'text';
    let content = '';
    let mediaPath = null;
    let fileName = null;

    const messageContent = msg.message;
    if (!messageContent) return;

    if (messageContent.conversation) content = messageContent.conversation;
    else if (messageContent.extendedTextMessage?.text) content = messageContent.extendedTextMessage.text;
    else if (messageContent.imageMessage || messageContent.videoMessage || messageContent.documentMessage || messageContent.audioMessage || messageContent.stickerMessage) {
      const mediaMsg = messageContent.imageMessage || messageContent.videoMessage || messageContent.documentMessage || messageContent.audioMessage || messageContent.stickerMessage;
      if (messageContent.imageMessage) type = 'image';
      else if (messageContent.videoMessage) type = mediaMsg.gifPlayback ? 'gif' : 'video';
      else if (messageContent.documentMessage) { type = 'document'; fileName = mediaMsg.fileName || 'file.pdf'; }
      else if (messageContent.audioMessage) type = 'audio';
      else if (messageContent.stickerMessage) type = 'sticker';
      content = mediaMsg.caption || '';
      
      if (!msg.key.fromMe) {
        try {
          const session = await whatsapp.getSessionById(msg.sessionId);
          if (session) {
            const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: { level: 'silent', info:()=>{}, error:()=>{}, warn:()=>{}, debug:()=>{} }, reuploadRequest: session.sock.updateMediaMessage });
            const ext = mediaMsg.mimetype?.split('/')[1]?.split(';')[0] || 'bin';
            const fname = `${Date.now()}-${whatsappId}.${ext}`;
            const fpath = path.join(__dirname, 'uploads', fname);
            fs.writeFileSync(fpath, buffer);
            mediaPath = `/uploads/${fname}`;
          }
        } catch (e) {}
      }
    }

    await prisma.message.upsert({
      where: { whatsappId },
      update: { content, type, mediaPath, fileName },
      create: {
        whatsappId, sessionId: msg.sessionId, remoteJid: msg.key.remoteJid,
        pushName: msg.pushName || 'WhatsApp User',
        content, type, direction: msg.key.fromMe ? 'outbound' : 'inbound',
        status: 'delivered', mediaPath, fileName, timestamp
      }
    });
  } catch (e) {}
}

// AI ENDPOINTS
app.post('/api/ai/config', async (req, res) => {
  const { sessionId, aiEnabled, aiInstructions, aiReplyNewUsers, aiReplyExistingUsers } = req.body;
  try {
    await prisma.device.update({ where: { sessionId }, data: { aiEnabled, aiInstructions, aiReplyNewUsers, aiReplyExistingUsers } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/contact-toggle', async (req, res) => {
  const { sessionId, remoteJid, aiEnabled } = req.body;
  try {
    await prisma.contact.upsert({
      where: { sessionId_remoteJid: { sessionId, remoteJid } },
      update: { aiEnabled },
      create: { sessionId, remoteJid, aiEnabled }
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/ai/contact-status', async (req, res) => {
  const { sessionId, remoteJid } = req.query;
  try {
    const contact = await prisma.contact.findUnique({ where: { sessionId_remoteJid: { sessionId, remoteJid } } });
    res.json({ aiEnabled: contact ? contact.aiEnabled : true });
  } catch (e) { res.json({ aiEnabled: true }); }
});

app.post('/api/ai/test', async (req, res) => {
  const { instructions, message, history = [] } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-lite-latest" });
    const chatContext = history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    const prompt = `System Instructions: ${instructions}\n\nChat History:\n${chatContext}\nUser: ${message}\nAssistant:`;
    const result = await model.generateContent(prompt);
    res.json({ response: result.response.text() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/whatsapp/chats', async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.json([]);
    const messages = await prisma.message.findMany({ where: { sessionId }, orderBy: { timestamp: 'desc' } });
    const contacts = await prisma.contact.findMany({ where: { sessionId } });
    const contactMap = new Map(contacts.map(c => [c.remoteJid, c]));
    const uniqueChats = [];
    const seenJids = new Set();
    for (const msg of messages) {
      if (!seenJids.has(msg.remoteJid)) {
        seenJids.add(msg.remoteJid);
        const contact = contactMap.get(msg.remoteJid);
        let name = contact?.name || contact?.pushName || msg.pushName;
        if (!name || name === 'WhatsApp User' || /^\d+$/.test(name)) {
          const num = msg.remoteJid.split('@')[0];
          name = num.length === 12 ? `+91 ${num.slice(2, 7)} ${num.slice(7)}` : `+${num}`;
        }
        uniqueChats.push({ id: msg.remoteJid, name, profilePic: contact?.profilePic || null, lastMessage: msg.content, timestamp: msg.timestamp });
      }
    }
    res.json(uniqueChats);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/sessions', async (req, res) => {
  const sessions = await prisma.device.findMany();
  res.json(sessions);
});

app.post('/api/session/start', async (req, res) => {
  const { sessionId, name } = req.body;
  try {
    await prisma.device.upsert({ where: { sessionId }, update: { name, status: 'connecting' }, create: { sessionId, name, status: 'connecting' } });
    await whatsapp.startSession(sessionId);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/session/delete', async (req, res) => {
  const { sessionId } = req.body;
  try {
    await whatsapp.terminateSession(sessionId).catch(() => {});
    await prisma.device.delete({ where: { sessionId } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

async function updateDeviceStatus(sessionId, status, clearQR = false) {
  try {
    const data = { status };
    if (clearQR) data.currentQR = null;
    await prisma.device.upsert({ where: { sessionId }, update: data, create: { sessionId, name: `Node ${sessionId}`, status, currentQR: null } });
  } catch (e) {}
}

async function syncProfilePic(sessionId, remoteJid) {
  try {
    const session = await whatsapp.getSessionById(sessionId);
    if (!session) return;
    const url = await session.sock.profilePictureUrl(remoteJid, 'image').catch(() => null);
    if (url) await updateContact(sessionId, remoteJid, { profilePic: url });
  } catch (e) {}
}

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Solid Models Backend running on port 3001`);
  whatsapp.load();
});
