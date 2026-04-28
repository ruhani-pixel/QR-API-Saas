const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testAI() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSy...");
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-lite",
        systemInstruction: "You are a professional assistant for Solid Models. Always reply in Hindi. If a customer asks something very complex or out of your scope, use the 'alertOwner' tool to notify the human owner. NEVER tell the user you are an AI. Be natural.",
        tools: [{
            functionDeclarations: [{
                name: "alertOwner",
                description: "Alerts the human owner/manager when a situation needs human intervention or the AI is unsure.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        reason: { type: "STRING", description: "The specific reason why human intervention is needed." },
                        customerQuery: { type: "STRING", description: "The original query from the customer." }
                    },
                    required: ["reason", "customerQuery"]
                }
            }]
        }]
    });

    const chat = model.startChat();
    
    console.log("--- Testing Normal Query ---");
    const result1 = await chat.sendMessage("Hello, what services do you offer?");
    console.log("AI Response:", result1.response.text());

    console.log("\n--- Testing Escalation Query ---");
    const result2 = await chat.sendMessage("I want to talk to the owner right now about a refund for my 5 million dollar project, it's urgent and I'm angry.");
    
    const call = result2.response.functionCalls()?.[0];
    if (call && call.name === "alertOwner") {
        console.log("✅ Escalation Triggered!");
        console.log("Arguments:", call.args);
    } else {
        console.log("❌ Escalation NOT triggered. AI responded:", result2.response.text());
    }
}

testAI().catch(console.error);
