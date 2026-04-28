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

// SMART RECOVERY TRACKER
const retryCounts = {};

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
  onAuthenticated: (sessionId) => {
    const sid = typeof sessionId === 'object' ? sessionId.sessionId : sessionId;
    const cleanSid = String(sid || '').toLowerCase();
    console.log(`[SESSION] Authenticated: ${cleanSid}`);
    io.emit('device:status', { sessionId: cleanSid, status: 'connecting' });
  },
  onConnected: async (sessionId) => {
    const sid = typeof sessionId === 'object' ? sessionId.sessionId : sessionId;
    const cleanSid = String(sid || '').toLowerCase();
    
    if (cleanSid) {
      console.log(`[SESSION] Connected: ${cleanSid}`);
      retryCounts[cleanSid] = 0; // Reset retries on success
      // First update DB, then emit to ensure frontend polling sees it
      await updateDeviceStatus(cleanSid, 'online', true);
      io.emit('device:status', { sessionId: cleanSid, status: 'online' });
    }
  },
  onMessageUpdated: (data) => {
    const whatsappId = data.update?.key?.id;
    if (!whatsappId) return;

    // Real-time status update (delivered, read, failed)
    io.emit('message:status', { 
      sessionId: data.sessionId, 
      whatsappId: whatsappId, 
      status: data.messageStatus 
    });
    // Update DB status
    prisma.message.update({ 
      where: { whatsappId }, 
      data: { status: data.messageStatus } 
    }).catch(() => {});
  },
  onDisconnected: async (sessionId, reason) => {
    const sid = String((typeof sessionId === 'object' ? sessionId.sessionId : sessionId) || '').toLowerCase();
    if (!sid) return;

    console.log(`[SESSION] Disconnected: ${sid} (Reason: ${reason})`);
    
    // PERMANENT ERRORS: 440 (Session Expired), 401 (Unauthorized)
    // DO NOT RETRY - DELETE SESSION DATA
    const isPermanent = [401, 440, 403].includes(Number(reason));
    
    if (isPermanent) {
      console.log(`[SESSION] ❌ Permanent failure for ${sid}. Stopping recovery.`);
      retryCounts[sid] = 0;
      updateDeviceStatus(sid, 'offline');
      io.emit('device:status', { sessionId: sid, status: 'offline' });
      return;
    }

    // TEMPORARY ERRORS: 515 (Restarting), 440 (Stream error), etc.
    const isTemporary = [515, 408, 503, 500].includes(Number(reason)) || !reason;
    
    if (isTemporary) {
      // Limit retries to prevent server overload
      retryCounts[sid] = (retryCounts[sid] || 0) + 1;
      
      if (retryCounts[sid] > 3) {
        console.log(`[SESSION] ⛔ Max retries (3) reached for ${sid}. Giving up.`);
        retryCounts[sid] = 0;
        updateDeviceStatus(sid, 'offline');
        io.emit('device:status', { sessionId: sid, status: 'offline' });
        return;
      }

      const delay = retryCounts[sid] * 5000; // 5s, 10s, 15s backoff
      console.log(`[SESSION] Retry ${retryCounts[sid]}/3 for ${sid} in ${delay/1000}s...`);
      
      updateDeviceStatus(sid, 'connecting');
      setTimeout(() => {
        whatsapp.startSession(sid).catch(() => {});
      }, delay);
    } else {
      io.emit('device:status', { sessionId: sid, status: 'offline' });
      updateDeviceStatus(sid, 'offline');
    }
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
        if (name) await updateContact(data.sessionId, contact.id, { name, pushName: contact.notify });
      }
    }
    for (const msg of data.messages) await saveOrUpdateMessage(msg);
    io.emit('history:synced', { sessionId: data.sessionId });
  }
});

const cronEngine = new CronEngine(whatsapp);

async function handleAIAutoReply(msg) {
  try {
    const device = await prisma.device.findUnique({ where: { sessionId: msg.sessionId } });
    if (!device || !device.aiEnabled || !device.aiInstructions) return;
    const contact = await prisma.contact.findUnique({ where: { sessionId_remoteJid: { sessionId: msg.sessionId, remoteJid: msg.key.remoteJid } } });
    if (contact && contact.aiEnabled === false) return;
    const historyCount = await prisma.message.count({ where: { sessionId: msg.sessionId, remoteJid: msg.key.remoteJid } });
    const isNewUser = historyCount <= 1;
    if (isNewUser && !device.aiReplyNewUsers) return;
    if (!isNewUser && !device.aiReplyExistingUsers) return;

    // Show Typing Indicator
    await whatsapp.sendTypingIndicator({ 
      sessionId: msg.sessionId, 
      to: msg.key.remoteJid, 
      duration: 2000 
    }).catch(() => {});

    const recentMessages = await prisma.message.findMany({ where: { sessionId: msg.sessionId, remoteJid: msg.key.remoteJid }, orderBy: { timestamp: 'desc' }, take: 10 });
    const chatContext = recentMessages.reverse().map(m => `${m.direction === 'inbound' ? 'U' : 'A'}: ${m.content}`).join('\n');
    
    // TOOL DEFINITION
    const tools = [
      {
        functionDeclarations: [
          {
            name: "alertOwner",
            description: "Owner ko alert bheje jab user ka sawal mushkil ho ya AI ko decision lene mein help chahiye ho.",
            parameters: {
              type: "OBJECT",
              properties: {
                issue: { type: "STRING", description: "Problem ya user ka sawal jo owner ko batana hai." }
              },
              required: ["issue"]
            }
          }
        ]
      }
    ];

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-lite",
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
      tools: tools
    });

    const prompt = `Strict Instructions: YOU ARE A HUMAN ASSISTANT. NEVER MENTION AI, ROBOT, OR MODEL. TALK LIKE A REAL PERSON.
If you are confused or need owner's permission, use the 'alertOwner' tool immediately and tell user "Ek minute rukiye, main Sar se baat karwata hoon."
DO NOT GIVE ROBOTIC ANSWERS.
System Context: ${device.aiInstructions}\n\nChat History:\n${chatContext}\n\nAssistant:`;

    // MEDIA SUPPORT
    let parts = [{ text: prompt }];
    const lastMsg = recentMessages[recentMessages.length - 1];
    if (lastMsg && lastMsg.mediaPath && lastMsg.direction === 'inbound') {
      const fpath = path.join(__dirname, lastMsg.mediaPath);
      if (fs.existsSync(fpath)) {
        const b64 = fs.readFileSync(fpath).toString('base64');
        const mimeType = lastMsg.type === 'image' ? 'image/jpeg' : lastMsg.type === 'video' ? 'video/mp4' : 'application/pdf';
        parts.push({ inlineData: { data: b64, mimeType } });
      }
    }

    const result = await model.generateContent(parts);
    const response = result.response;
    const call = response.functionCalls()?.[0];

    if (call && call.name === "alertOwner") {
      const ownerNum = device.ownerNumber || '919876543210'; // Fallback
      const alertText = `🚨 *AI ALERT* (Node: ${device.name})\n\nUser: ${msg.key.remoteJid}\nIssue: ${call.args.issue}\n\nAI is waiting for your response.`;
      await whatsapp.sendText({ sessionId: msg.sessionId, to: ownerNum, text: alertText }).catch(() => {});
      await whatsapp.sendText({ sessionId: msg.sessionId, to: msg.key.remoteJid, text: "Ek second rukiye, main Sar se confirm karke batata hoon. 🙏" });
      return;
    }

    const responseText = response.text();
    if (responseText) await whatsapp.sendText({ sessionId: msg.sessionId, to: msg.key.remoteJid, text: responseText });
  } catch (e) { console.error('AI Error:', e); }
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

async function updateContact(sessionId, remoteJid, data) {
  try {
    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.pushName) updateData.pushName = data.pushName;
    if (data.profilePic) updateData.profilePic = data.profilePic;

    await prisma.contact.upsert({
      where: { sessionId_remoteJid: { sessionId, remoteJid } },
      update: updateData,
      create: { sessionId, remoteJid, aiEnabled: true, ...data }
    });
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

async function updateDeviceStatus(sessionId, status, clearQR = false) {
  try {
    const data = { status };
    if (clearQR) data.currentQR = null;
    await prisma.device.upsert({ where: { sessionId }, update: data, create: { sessionId, name: `Node ${sessionId}`, status, currentQR: null } });
  } catch (e) {}
}

// ENDPOINTS
app.post('/api/session/start', async (req, res) => {
  const { sessionId, name, ownerNumber } = req.body;
  try {
    await prisma.device.upsert({
      where: { sessionId },
      update: { name, ownerNumber, status: 'connecting' },
      create: { sessionId, name, ownerNumber, status: 'connecting' }
    });
    await whatsapp.startSession(sessionId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/session/logout', async (req, res) => {
  const { sessionId } = req.body;
  try {
    await whatsapp.deleteSession(sessionId);
    await prisma.device.update({ where: { sessionId }, data: { status: 'offline' } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/session/delete', async (req, res) => {
  const { sessionId } = req.body;
  try {
    await whatsapp.deleteSession(sessionId);
    await prisma.device.delete({ where: { sessionId } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sessions', async (req, res) => {
  const sessions = await prisma.device.findMany();
  res.json(sessions);
});

app.get('/api/session/status/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const device = await prisma.device.findUnique({ where: { sessionId } });
  res.json({ status: device?.status || 'offline' });
});

app.post('/api/campaign/create', upload.single('media'), async (req, res) => {
  const { name, message, selectedDevices, safetyConfig, recipients } = req.body;
  try {
    const campaign = await prisma.campaign.create({
      data: {
        name,
        message,
        mediaPath: req.file ? `/uploads/${req.file.filename}` : null,
        selectedDevices,
        safetyConfig,
        totalNumbers: JSON.parse(recipients).length,
        status: 'pending'
      }
    });
    const recipientData = JSON.parse(recipients).map(r => ({
      campaignId: campaign.id,
      number: r.number,
      message: r.message || null,
      scheduledAt: r.scheduledAt ? new Date(r.scheduledAt) : null,
      nodeId: r.nodeId || null
    }));
    await prisma.campaignRecipient.createMany({ data: recipientData });
    res.json({ success: true, campaignId: campaign.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/campaigns', async (req, res) => {
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(campaigns);
});

app.post('/api/campaign/status', async (req, res) => {
  const { id, status } = req.body;
  try {
    await prisma.campaign.update({ where: { id }, data: { status } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/config', async (req, res) => {
  const { sessionId, aiEnabled, aiInstructions, aiReplyNewUsers, aiReplyExistingUsers } = req.body;
  try {
    await prisma.device.update({ where: { sessionId }, data: { aiEnabled, aiInstructions, aiReplyNewUsers, aiReplyExistingUsers } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ai/test', async (req, res) => {
  const { instructions, history, message } = req.body;
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-lite",
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
    });
    
    const chatContext = (history || []).map(m => `${m.role === 'user' ? 'U' : 'A'}: ${m.content}`).join('\n');
    const prompt = `Strict Instructions: DIRECT REPLY ONLY. NO THINKING PROCESS.
TALK LIKE A PROFESSIONAL HUMAN ASSISTANT.

System Instructions: ${instructions || 'No specific instructions.'}

Chat History:
${chatContext}

User: ${message}
Assistant:`;

    const result = await model.generateContent(prompt);
    res.json({ response: result.response.text() });
  } catch (e) { 
    console.error('AI Test Error:', e);
    res.status(500).json({ error: e.message }); 
  }
});

app.post('/api/ai/contact-toggle', async (req, res) => {
  const { sessionId, remoteJid, aiEnabled } = req.body;
  try {
    await prisma.contact.upsert({ where: { sessionId_remoteJid: { sessionId, remoteJid } }, update: { aiEnabled }, create: { sessionId, remoteJid, aiEnabled } });
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

app.get('/api/whatsapp/messages', async (req, res) => {
  const { sessionId, remoteJid } = req.query;
  const messages = await prisma.message.findMany({ where: { sessionId, remoteJid }, orderBy: { timestamp: 'asc' } });
  res.json(messages);
});

app.post('/api/message/send', async (req, res) => {
  const { sessionId, to, text } = req.body;
  try {
    await whatsapp.sendText({ sessionId, to, text });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/message/typing', async (req, res) => {
  const { sessionId, to, duration = 3000 } = req.body;
  try {
    await whatsapp.sendTypingIndicator({ sessionId, to, duration });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Solid Models Backend running on port 3001`);
  whatsapp.load();
  cronEngine.start();
});
