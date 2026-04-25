Solid Models - Complete System Design (Full Detail)
Bhai, main poora system detail mein explain karta hoon - har page, har workflow, aur inbox ka logic sab kuch.

📁 Total Pages & Structure
solid-models/
├── backend/                    (Node.js - 10%)
│   ├── server.js               (Main socket server)
│   ├── sessionManager.js       (wa-multi-session logic)
│   └── cronEngine.js           (Bulk message scheduler)
│
└── frontend/                   (Next.js - 90%)
    ├── app/
    │   ├── (dashboard)/
    │   │   ├── page.jsx              → Page 1: Main Dashboard
    │   │   ├── devices/
    │   │   │   └── page.jsx          → Page 2: Device Manager
    │   │   ├── inbox/
    │   │   │   ├── page.jsx          → Page 3: Unified Inbox
    │   │   │   └── [chatId]/
    │   │   │       └── page.jsx      → Page 4: Single Chat View
    │   │   ├── bulk/
    │   │   │   ├── page.jsx          → Page 5: Bulk Campaign Creator
    │   │   │   └── history/
    │   │   │       └── page.jsx      → Page 6: Campaign History
    │   │   └── settings/
    │   │       └── page.jsx          → Page 7: Safety Settings (Read-only)
Total: 7 Main Pages (+ QR Modal, Chat Window - components ke roop mein)

🗺️ Complete Workflow Map
┌─────────────────────────────────────────────────────────┐
│                    SOLID MODELS SaaS                     │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Page 1:        │  ← Yahan saari details dikhti hain
│  DASHBOARD      │    • Kitne devices online/offline
│  (Home Screen)  │    • Aaj kitne messages aaye/gaye
└────────┬────────┘    • Active campaigns
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌─────────────────┐
│Page 2 │  │   Page 3:       │
│DEVICE │  │  UNIFIED INBOX  │
│MANAGER│  │  (Main kaam)    │
└───┬───┘  └───────┬─────────┘
    │               │
    ▼               ▼
[QR Scan]    [Page 4: Chat View]
[Add/Remove]  (Single conversation)
              
              ▼
         [Page 5: BULK]
         [Page 6: HISTORY]
         [Page 7: SETTINGS]

📱 PAGE 1: Dashboard (Home)
Purpose: Ek nazar mein poora system dikhe
┌──────────────────────────────────────────────────────┐
│  SOLID MODELS          [🔔 3]  [👤 Admin]           │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ 📱 47    │ │ ✅ 42    │ │ ❌ 5     │ │📨 1,247│ │
│  │ Total    │ │ Online   │ │ Offline  │ │ Aaj ke │ │
│  │ Devices  │ │ Devices  │ │ Devices  │ │Messages│ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│                                                      │
│  📊 LIVE DEVICE STATUS (Mini Grid)                  │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬────┐  │
│  │M-01 │M-02 │M-03 │M-04 │M-05 │M-06 │M-07 │... │  │
│  │ 🟢  │ 🟢  │ 🔴  │ 🟢  │ 🟢  │ 🟡  │ 🟢  │   │  │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴────┘  │
│  🟢 Online  🔴 Offline  🟡 Connecting               │
│                                                      │
│  ⚡ ACTIVE CAMPAIGNS                                 │
│  ┌────────────────────────────────────────────────┐  │
│  │ Campaign "Diwali Offer" → 47/120 sent ████░░░ │  │
│  │ Next message in: 00:23 sec                     │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  📬 RECENT MESSAGES (Last 10)                       │
│  ┌────────────────────────────────────────────────┐  │
│  │ [M-02 SIM1] Rahul: "Haan bhai, kab milenge?" │  │
│  │ [M-05 SIM2] Priya: "Order confirm karo"        │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘

📱 PAGE 2: Device Manager (Sabse Important)
Purpose: Mobile add/remove karna + QR Scan
Device Add karne ka Flow:
STEP 1: "Add Device" button dabao
         ↓
STEP 2: Device ka naam likho (e.g., "Mobile-01 SIM1")
         ↓  
STEP 3: QR Code generate hoga
         ↓
STEP 4: WhatsApp → Linked Devices → Link a Device → Camera se scan karo
         ↓
STEP 5: ✅ Connected! Dashboard mein 🟢 dikha dega
Page Layout:
┌──────────────────────────────────────────────────────┐
│  DEVICE MANAGER           [+ Add New Device]         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  FILTER: [All ▼] [Online ▼] [Offline ▼]  🔍 Search  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ 📱 Mobile-01 SIM-1      🟢 Online  [Chat][❌] │  │
│  │ Number: +91-98765-XXXXX                        │  │
│  │ Messages today: 47  |  Session: Active 3h 20m  │  │
│  ├────────────────────────────────────────────────┤  │
│  │ 📱 Mobile-01 SIM-2      🟢 Online  [Chat][❌] │  │
│  │ Number: +91-87654-XXXXX                        │  │
│  │ Messages today: 23  |  Session: Active 1h 05m  │  │
│  ├────────────────────────────────────────────────┤  │
│  │ 📱 Mobile-02 SIM-1      🔴 Offline  [Reconnect]│  │
│  │ Number: +91-76543-XXXXX                        │  │
│  │ Last seen: 2h ago                              │  │
│  ├────────────────────────────────────────────────┤  │
│  │ + ADD NEW DEVICE (Dashed Border, Click karo)   │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
QR Scan Modal (Pop-up):
┌──────────────────────────────────┐
│  📱 New Device Connect karo      │
│                                  │
│  Device Name: [Mobile-03 SIM-1]  │
│                                  │
│  ┌────────────────────────────┐  │
│  │  ██████████████████████    │  │
│  │  ██  ░░░░░░░░░░░░  ██    │  │
│  │  ██  ░ QR CODE ░  ██    │  │
│  │  ██  ░░░░░░░░░░░░  ██    │  │
│  │  ██████████████████████    │  │
│  └────────────────────────────┘  │
│                                  │
│  ⏱️ Expires in: 55 seconds       │
│  Status: ⏳ Waiting for scan...  │
│                                  │
│  📌 WhatsApp → ⋮ → Linked       │
│     Devices → Link a Device      │
│                                  │
│  [Refresh QR]    [Cancel]        │
└──────────────────────────────────┘
Device Remove karne ka Flow:
❌ button dabao → Confirmation pop-up:
"Mobile-01 SIM-1 ko disconnect karna chahte ho?"
[Haan, Hata Do] [Nahi, Rakho]
→ Session destroy → Grid se remove → Done ✅
50+ Devices ka Solution - Grid View:
5 devices  → List view (naam + status)
20 devices → 4-column card grid
50+ devices → Compact grid (sirf icon + status + naam)
              + Search bar mandatory
              + Filter by: Online/Offline/Mobile Number

📱 PAGE 3: Unified Inbox (Sabse Complex - Detail Mein)
Yeh page sabse critical hai. Samajhte hain:
Problem:

10 mobiles add hain
Har mobile mein 2 SIMs = 20 WhatsApp numbers
Har number mein 0 se 200+ conversations ho sakti hain
Total potential: 4000+ conversations
Sabko ek jagah dikhana + reply karna

Solution - 3-Panel Layout:
┌──────────────────────────────────────────────────────────────────┐
│  UNIFIED INBOX                                      [🔍 Search]  │
├────────────┬───────────────────────┬────────────────────────────┤
│            │                       │                            │
│  PANEL 1   │      PANEL 2          │       PANEL 3              │
│  DEVICES   │   CONVERSATIONS       │    CHAT WINDOW             │
│  (Filter)  │   (Chat List)         │    (Messages)              │
│            │                       │                            │
│ [All] ←✓  │ 🔴 Unread (47)       │  ← Yahan selected         │
│            │ ─────────────────     │    conversation            │
│ M01-SIM1  │ Rahul Kumar     2m ↩  │    khulegi                 │
│ M01-SIM2  │ "Order kab aayega"    │                            │
│ M02-SIM1  │ ─────────────────     │                            │
│ M02-SIM2  │ Priya Sharma    5m    │                            │
│ M03-SIM1  │ "Photo bhejo please"  │                            │
│ M03-SIM2  │ ─────────────────     │                            │
│ ...        │ Amit Verma     12m    │                            │
│            │ "Haan confirm hai"    │                            │
│ [+ Filter] │ ─────────────────     │                            │
│            │ [Load more...]        │                            │
└────────────┴───────────────────────┴────────────────────────────┘
Panel 1 - Device Filter Logic:
javascript// Kaise kaam karega:
"All" select → Sabhi 20 numbers ke chats dikhao (by last message time)
"M01-SIM1" select → Sirf us number ke chats dikhao
Multiple select → Un sabke chats combined dikhao
Panel 2 - Conversation List Logic:
Har conversation card mein:
┌─────────────────────────────────────┐
│ 👤 Rahul Kumar        [M01-SIM1] 2m │  ← Kis SIM se baat ho rhi hai
│ "Bhai order kab aayega?"         ↩  │  ← ↩ means unread
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Sort by: Latest | Unread | Device   │
└─────────────────────────────────────┘
Panel 3 - Chat Window (Full Detail):
┌────────────────────────────────────────────────┐
│  👤 Rahul Kumar  +91-98765-XXXXX               │
│  via: 📱 Mobile-01 SIM-1  🟢 Online           │
├────────────────────────────────────────────────┤
│                                                │
│          [Rahul]: Bhai kab aayega?             │
│                          10:23 AM              │
│                                                │
│   Kal tak ho jaega ✓✓  [You (M01-SIM1)]       │
│                          10:25 AM              │
│                                                │
│          [Rahul]: Okay thanks 🙏               │
│                          10:26 AM              │
│                                                │
├────────────────────────────────────────────────┤
│  📎  📷  🎥  📄  📍  🎤  |  Message type karo │
│ ┌──────────────────────────────────────┐  [▶] │
│ │ Yahan message likho...               │      │
│ └──────────────────────────────────────┘      │
│                                                │
│  Sending via: [M01-SIM1 ▼] ← Change kar sako │
└────────────────────────────────────────────────┘
Media Send karne ka Flow (Inbox se):
📷 Photo: Click → File picker → Preview → Send
🎥 Video: Click → File picker → Compress option → Send  
📄 Doc:   Click → File picker → Send as document
📍 Location: Click → Map picker → Send
🎤 Voice: Hold button → Record → Release → Send
Stickers: WhatsApp ke default stickers support
Typing Indicator (Real-time):
javascript// Jab aap message box mein type karo:
User types → Backend ko signal bhejo
Backend → wa-multi-session → whatsapp.sendPresenceUpdate('composing', chatId)
Dusre ko dikhega: "Typing..." ✅

// Jab send karo ya 5 sec inactivity:
whatsapp.sendPresenceUpdate('paused', chatId)

📱 PAGE 4: Chat View (Full Screen)
Panel 3 ka hi full-screen version hai jab mobile ya small screen ho
Mobile responsive ke liye:

Panel 1 → Hamburger menu mein
Panel 2 → Back button se
Panel 3 → Full screen chat


📱 PAGE 5: Bulk Campaign Creator
Complete Workflow:
STEP 1: MESSAGE COMPOSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌────────────────────────────────────────────────────┐
│  BULK CAMPAIGN BANAO                               │
│                                                    │
│  Campaign Name: [Diwali Offer 2025          ]      │
│                                                    │
│  Message:                                          │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🎉 Diwali Special! Hamari dukan par aao...   │  │
│  │                                              │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Media attach karo (Optional):                     │
│  [📷 Photo] [🎥 Video] [📄 Document]               │
│  ┌────────────────────┐                            │
│  │  [Diwali.jpg] ✅   │  ← Preview                │
│  └────────────────────┘                            │
│                                                    │
│  [Next: Choose SIMs →]                             │
└────────────────────────────────────────────────────┘
STEP 2: SIM SELECT KARO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌────────────────────────────────────────────────────┐
│  Kaunse SIM se bhejoge?                            │
│                                                    │
│  [Select All]  [Deselect All]                      │
│                                                    │
│  ☑ Mobile-01 SIM-1  (+91-987...)  🟢 Available   │
│  ☑ Mobile-01 SIM-2  (+91-876...)  🟢 Available   │
│  ☑ Mobile-02 SIM-1  (+91-765...)  🟢 Available   │
│  ☐ Mobile-02 SIM-2  (+91-654...)  🔴 Offline     │
│  ☑ Mobile-03 SIM-1  (+91-543...)  🟢 Available   │
│  ...                                               │
│                                                    │
│  ✅ 4 SIMs selected (4 × 120 = 480 max numbers)   │
│                                                    │
│  [← Back]  [Next: Add Numbers →]                  │
└────────────────────────────────────────────────────┘
STEP 3: NUMBERS ADD KARO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌────────────────────────────────────────────────────┐
│  Numbers Add Karo (Max 120 per SIM)                │
│                                                    │
│  [📋 Paste karo]  [📁 CSV Upload]  [➕ Manual]     │
│                                                    │
│  ┌────────────────────────────────────────────┐    │
│  │ #  │ Number          │ Name    │ SIM       │    │
│  │ 1  │ +91-98765-XXXXX │ Rahul   │ M01-SIM1 │    │
│  │ 2  │ +91-87654-XXXXX │ Priya   │ M01-SIM2 │    │
│  │ 3  │ +91-76543-XXXXX │ Amit    │ M02-SIM1 │    │
│  │ ...│ ...             │ ...     │ Auto ↻    │    │
│  │120 │ +91-11111-XXXXX │ Vijay   │ M03-SIM1 │    │
│  └────────────────────────────────────────────┘    │
│                                                    │
│  SIM-wise breakdown:                               │
│  M01-SIM1: 30/120  M01-SIM2: 30/120               │
│  M02-SIM1: 30/120  M03-SIM1: 30/120               │
│  Total: 120 numbers, 4 SIMs                        │
│                                                    │
│  ⚠️ Auto-distribute: System numbers ko SIMs mein   │
│     automatically baant dega equally               │
│                                                    │
│  [← Back]  [Next: Review & Launch →]              │
└────────────────────────────────────────────────────┘
STEP 4: REVIEW & LAUNCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌────────────────────────────────────────────────────┐
│  CAMPAIGN SUMMARY                                  │
│                                                    │
│  📋 Name: Diwali Offer 2025                       │
│  💬 Message: "🎉 Diwali Special! Hamari dukan..."  │
│  📷 Media: Diwali.jpg                              │
│  📱 SIMs: 4 selected                              │
│  👥 Recipients: 120 numbers                        │
│                                                    │
│  ⏱️ SAFETY SCHEDULE (Fixed - Change nahi hoga):   │
│  ┌──────────────────────────────────────────────┐  │
│  │ • Message gap: 20-35 seconds (Random)         │  │
│  │ • Har 10-15 messages baad: 25-30 min break    │  │
│  │ • Total time estimate: ~6-7 hours             │  │
│  │ • Max per SIM: 120 messages                   │  │
│  │ 🔒 Yeh settings change nahi ho sakti          │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Estimated completion: ~6h 30m se 7h tak           │
│                                                    │
│  [← Back]  [🚀 Campaign Start Karo]               │
└────────────────────────────────────────────────────┘

📱 PAGE 6: Campaign History
┌────────────────────────────────────────────────────┐
│  CAMPAIGN HISTORY                                  │
├────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐  │
│  │ 🟢 Diwali Offer 2025         ACTIVE          │  │
│  │ Started: 10:00 AM | Progress: 47/120         │  │
│  │ █████████████░░░░░░░░░░░░░░░  39%            │  │
│  │ Next: 00:18 sec  |  [Pause] [Details]        │  │
│  ├──────────────────────────────────────────────┤  │
│  │ ✅ Summer Sale              COMPLETED         │  │
│  │ 120/120 sent | 2h 15m ago | 0 failed         │  │
│  │ [Report Download]                             │  │
│  ├──────────────────────────────────────────────┤  │
│  │ ⏸️ New Year Promo            PAUSED           │  │
│  │ 45/120 sent | [Resume] [Cancel]              │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘

📱 PAGE 7: Safety Settings (Read-Only)
┌────────────────────────────────────────────────────┐
│  SAFETY SETTINGS  🔒 (System Admin Only)           │
├────────────────────────────────────────────────────┤
│                                                    │
│  ⚠️ Yeh settings WhatsApp detection se bachne      │
│  ke liye fixed hain. Change karne ka option        │
│  intentionally nahi diya gaya hai.                │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ 📊 MESSAGE LIMITS                            │  │
│  │ Max per SIM per day:      120 messages       │  │
│  │ Burst limit (per session): 10-15 messages    │  │
│  │                                              │  │
│  │ ⏱️ TIMING RULES                              │  │
│  │ Between messages:  20-35 sec (random)        │  │
│  │ After burst:       25-35 min (random)        │  │
│  │ Session window:    6-7 hours                 │  │
│  │                                              │  │
│  │ 🛡️ DETECTION PREVENTION                      │  │
│  │ Typing indicator:  ✅ Always ON              │  │
│  │ Read receipts:     ✅ Normal behavior        │  │
│  │ Message variation: ✅ Auto micro-variation   │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘

⚙️ Backend Cron Engine Logic (Node.js - Critical Part)
javascript// cronEngine.js - Yeh sabse important file hai

class BulkMessageEngine {
  
  async startCampaign(campaign) {
    const { numbers, message, selectedSIMs } = campaign;
    
    // Numbers ko SIMs mein distribute karo
    const batches = this.distributeToSIMs(numbers, selectedSIMs);
    // [SIM1: [n1,n2,...,n30], SIM2: [n31,...,n60], ...]
    
    // Har SIM ke liye alag queue chalao
    for (const [simId, simNumbers] of Object.entries(batches)) {
      this.runSimQueue(simId, simNumbers, message);
      // Important: Ek saath sabhi SIMs start hongi
      // Alag-alag workers mein
    }
  }
  
  async runSimQueue(simId, numbers, message) {
    let sentCount = 0;
    
    for (const number of numbers) {
      // Safety check: 120 limit
      if (sentCount >= 120) break;
      
      // Message bhejo
      await this.sendMessage(simId, number, message);
      sentCount++;
      
      // BURST CHECK: Har 10-15 messages ke baad bada break
      const burstLimit = this.random(10, 15); // 10 ya 15 ka random
      if (sentCount % burstLimit === 0) {
        const bigBreak = this.random(25 * 60, 35 * 60); // 25-35 min
        await this.sleep(bigBreak * 1000);
      } else {
        // Normal gap: 20-35 seconds
        const smallGap = this.random(20, 35);
        await this.sleep(smallGap * 1000);
      }
    }
  }
  
  random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

🔌 Real-time Architecture (Socket.io)
Next.js (Browser) ←──── Socket.io ────→ Node.js Backend
                                              │
                                              ▼
                                    wa-multi-session
                                              │
                                         ┌───┴───┐
                                    WhatsApp Servers

Events flow:
1. New message aaya → Backend → Socket emit → Inbox update (real-time)
2. Device disconnect → Backend → Socket emit → Dashboard red ho gaya
3. Bulk message sent → Backend → Socket emit → Progress bar update
4. Typing karo → Frontend → Socket → Backend → WA server

📊 Database Schema (SQLite + Prisma)
prismamodel Device {
  id          String   @id
  name        String   // "Mobile-01 SIM-1"
  number      String   // "+91-987..."
  sessionId   String   @unique
  status      String   // "online" | "offline" | "connecting"
  createdAt   DateTime
  messages    Message[]
}

model Message {
  id        String   @id
  deviceId  String
  chatId    String   // WhatsApp chat ID
  content   String
  type      String   // "text" | "image" | "video" | "doc"
  direction String   // "incoming" | "outgoing"
  timestamp DateTime
  device    Device   @relation(...)
}

model Campaign {
  id        String   @id
  name      String
  status    String   // "active" | "paused" | "completed"
  total     Int
  sent      Int
  createdAt DateTime
  jobs      CampaignJob[]
}

🚀 Development Order (Step by Step)
Phase 1 (Week 1-2): Foundation
  ✅ Node.js backend setup (wa-multi-session)
  ✅ Next.js project setup
  ✅ Socket.io connection
  ✅ SQLite + Prisma setup

Phase 2 (Week 3): Device Manager
  ✅ QR Code generation + display
  ✅ Session save/restore
  ✅ Device add/remove
  ✅ Status monitoring

Phase 3 (Week 4-5): Unified Inbox
  ✅ 3-panel layout
  ✅ Real-time message display
  ✅ Send text/media
  ✅ Typing indicator

Phase 4 (Week 6): Bulk Engine
  ✅ Campaign creator (4-step wizard)
  ✅ Cron job engine (hardcoded safety)
  ✅ Progress tracking
  ✅ History page

Phase 5 (Week 7): Polish
  ✅ Dashboard
  ✅ Mobile responsive
  ✅ Error handling
  ✅ Testing with real devices

Summary: 7 pages, 10% Node.js (sessions + cron), 90% Next.js (UI + DB + logic), SQLite database, Socket.io for real-time. Inbox 3-panel mein banao - device filter, chat list, chat window. Bulk engine mein hardcoded safety taaki koi bypass na kar sake. Kya ab main kisi specific page ka detailed code likhu?