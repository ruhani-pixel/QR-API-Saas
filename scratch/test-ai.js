const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend folder
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testAI() {
  console.log("--- AI AUTO-REPLY SYSTEM TEST ---");
  
  try {
    const device = await prisma.device.findFirst({ 
      where: { aiEnabled: true } 
    });

    if (!device) {
      console.error("❌ ERROR: No AI-enabled device found in database.");
      console.log("Tip: Enable AI for at least one node in the dashboard first.");
      return;
    }

    console.log(`✅ Found Active Node: ${device.name} (${device.sessionId})`);
    console.log(`🧠 Instructions: ${device.aiInstructions?.substring(0, 50)}...`);

    const mockMsg = {
      content: "Hello! What services do you offer for architectural models?",
      pushName: "Dummy User"
    };

    console.log(`\n📩 Simulating Incoming Message: "${mockMsg.content}"`);
    console.log("⏳ Contacting Gemini API...");

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-lite",
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
    });

    const prompt = `Strict Instructions: DIRECT REPLY ONLY. NO THINKING PROCESS.
System Instructions: ${device.aiInstructions || 'No specific instructions.'}

User: ${mockMsg.content}
Assistant:`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("\n✨ AI RESPONSE SUCCESSFUL:");
    console.log("-----------------------------------------");
    console.log(responseText);
    console.log("-----------------------------------------");
    console.log("\n✅ AI REPLAY SYSTEM IS FULLY OPERATIONAL.");

  } catch (e) {
    console.error("\n❌ TEST FAILED:");
    console.error(e.message);
    if (e.message.includes("API key")) {
       console.log("\n⚠️ ACTION REQUIRED: Your GEMINI_API_KEY is blocked/leaked. Please update it in backend/.env");
    }
  } finally {
    await prisma.$disconnect();
  }
}

testAI();
