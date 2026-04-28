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
const { downloadMediaMessage } = require('baileys');

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
    // Background sync profile pic on new message
    syncProfilePic(msg.sessionId, msg.key.remoteJid);
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
  },
  onMessageUpdated: async (data) => {
    try {
      await prisma.message.update({ where: { whatsappId: data.key.id }, data: { status: data.messageStatus } });
      io.emit('message:status', { whatsappId: data.key.id, status: data.messageStatus });
    } catch (e) {}
  }
});

async function updateContact(sessionId, remoteJid, data) {
  try {
    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.pushName) updateData.pushName = data.pushName;
    if (data.profilePic) updateData.profilePic = data.profilePic;

    await prisma.contact.upsert({
      where: { sessionId_remoteJid: { sessionId, remoteJid } },
      update: updateData,
      create: { sessionId, remoteJid, ...data }
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
    else if (messageContent.protocolMessage && messageContent.protocolMessage.type === 0) {
      await prisma.message.update({ where: { whatsappId: messageContent.protocolMessage.key.id }, data: { content: '🚫 You deleted this message', type: 'deleted' } }).catch(() => {});
      return;
    }

    const status = statusMap[msg.status] || 'delivered';
    const remoteJid = msg.key.remoteJid;

    if (msg.pushName && msg.pushName !== 'WhatsApp User') await updateContact(msg.sessionId, remoteJid, { pushName: msg.pushName });

    await prisma.message.upsert({
      where: { whatsappId },
      update: { status, content, type, mediaPath, fileName },
      create: {
        whatsappId, sessionId: msg.sessionId, remoteJid,
        pushName: msg.pushName || 'WhatsApp User',
        content, type, direction: msg.key.fromMe ? 'outbound' : 'inbound',
        status, mediaPath, fileName, timestamp,
        messageTimestamp: msg.messageTimestamp ? Number(msg.messageTimestamp) : null
      }
    });
  } catch (e) {}
}

const statusMap = { 0: 'pending', 1: 'server', 2: 'delivered', 3: 'read', 4: 'played' };

function formatPhoneNumber(jid) {
  const num = jid.split('@')[0];
  if (num.length < 5) return num;
  if (num.includes('-')) return num; // Group
  if (num.length > 15) return 'WhatsApp User'; // Filter out crazy long internal IDs
  // Indian format
  if (num.startsWith('91') && num.length === 12) {
    return `+91 ${num.slice(2, 7)} ${num.slice(7)}`;
  }
  return `+${num}`;
}

async function syncProfilePic(sessionId, remoteJid) {
  try {
    const session = await whatsapp.getSessionById(sessionId);
    if (!session) return;
    const url = await session.sock.profilePictureUrl(remoteJid, 'image').catch(() => null);
    if (url) await updateContact(sessionId, remoteJid, { profilePic: url });
  } catch (e) {}
}

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
        
        let displayName = contact?.name || contact?.pushName || msg.pushName;
        if (!displayName || displayName === 'WhatsApp User' || /^\d+$/.test(displayName)) {
          displayName = formatPhoneNumber(msg.remoteJid);
        }

        let lastMsgText = msg.content;
        if (msg.type === 'image') lastMsgText = '📷 Photo';
        else if (msg.type === 'video') lastMsgText = '🎥 Video';
        else if (msg.type === 'gif') lastMsgText = '🎬 GIF';
        else if (msg.type === 'audio') lastMsgText = '🎵 Audio';
        else if (msg.type === 'sticker') lastMsgText = '🎭 Sticker';
        else if (msg.type === 'document') lastMsgText = '📄 Document';

        uniqueChats.push({ id: msg.remoteJid, name: displayName, isGroup: msg.remoteJid.endsWith('@g.us'), profilePic: contact?.profilePic || null, lastMessage: lastMsgText, lastMessageDirection: msg.direction, lastMessageStatus: msg.status, timestamp: msg.timestamp, sessionId: msg.sessionId });
      }
    }
    res.json(uniqueChats);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/whatsapp/profile-pic', async (req, res) => {
  const { sessionId, remoteJid } = req.query;
  try {
    const session = await whatsapp.getSessionById(sessionId);
    if (!session) return res.json({ url: null });
    const url = await session.sock.profilePictureUrl(remoteJid, 'image').catch(() => null);
    if (url) await updateContact(sessionId, remoteJid, { profilePic: url });
    res.json({ url });
  } catch (e) { res.json({ url: null }); }
});

app.get('/api/whatsapp/messages', async (req, res) => {
  const { sessionId, remoteJid } = req.query;
  const messages = await prisma.message.findMany({ where: { sessionId, remoteJid }, orderBy: { timestamp: 'asc' } });
  res.json(messages);
});

app.post('/api/message/send', async (req, res) => {
  const { sessionId, to, text } = req.body;
  try {
    const response = await whatsapp.sendText({ sessionId, to, text });
    await prisma.message.create({ data: { whatsappId: response.key.id, sessionId, remoteJid: to, pushName: 'Me', content: text, direction: 'outbound', status: 'server', timestamp: new Date() } });
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
    else if (type === 'video' || type === 'gif') response = await whatsapp.sendVideo({ sessionId, to, media, text: caption || '', gif: type === 'gif' });
    else if (type === 'audio') response = await whatsapp.sendAudio({ sessionId, to, media });
    else if (type === 'sticker') response = await whatsapp.sendSticker({ sessionId, to, media });
    else response = await whatsapp.sendDocument({ sessionId, to, media, filename: req.file.originalname, text: caption || '' });

    await prisma.message.create({ data: { whatsappId: response.key.id, sessionId, remoteJid: to, pushName: 'Me', content: caption || '', type, direction: 'outbound', status: 'server', mediaPath: `/uploads/${req.file.filename}`, fileName: req.file.originalname, timestamp: new Date() } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
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
    await prisma.message.deleteMany({ where: { sessionId } });
    await prisma.contact.deleteMany({ where: { sessionId } });
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

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Solid Models Backend running on port 3001`);
  whatsapp.load();
});
