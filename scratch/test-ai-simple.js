const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend folder
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testAI() {
  console.log("--- AI RESPONSE SYSTEM TEST ---");
  console.log("API KEY (partial): " + (process.env.GEMINI_API_KEY?.substring(0, 8) || "NOT FOUND") + "...");

  try {
    const mockInstructions = "You are a professional assistant for RD Models, an architectural model making company. Be helpful and professional.";
    const mockMsg = "Hello! What services do you offer?";

    console.log(`\n📩 Mock Message: "${mockMsg}"`);
    console.log("⏳ Contacting Gemini API...");

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-lite",
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
    });

    const prompt = `Strict Instructions: DIRECT REPLY ONLY. NO THINKING PROCESS.
System Instructions: ${mockInstructions}

User: ${mockMsg}
Assistant:`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("\n✨ AI RESPONSE SUCCESSFUL:");
    console.log("-----------------------------------------");
    console.log(responseText);
    console.log("-----------------------------------------");
    console.log("\n✅ AI API IS WORKING CORRECTLY.");

  } catch (e) {
    console.error("\n❌ TEST FAILED:");
    console.error(e.message);
    if (e.message.includes("API key")) {
       console.log("\n⚠️ ACTION REQUIRED: Your GEMINI_API_KEY is blocked/leaked. Please update it in backend/.env");
    }
  }
}

testAI();
