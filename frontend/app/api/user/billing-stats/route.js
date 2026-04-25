import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    last1h: 0.0012,
    today: 0.0543,
    last7: 1.24,
    last30: 5.67,
    allTime: 12.45,
    lastSynced: new Date().toISOString(),
    tokens: { total: 450000, today: 1200 },
    pricing: {
      'gemini-2.0-flash': { prompt: 0.10, completion: 0.10 },
      'gpt-4o': { prompt: 5.00, completion: 15.00 }
    },
    breakdown: {
      inputCostToday: 0.02,
      outputCostToday: 0.0343,
      inputTokensToday: 800,
      outputTokensToday: 400,
      totalInput: 300000,
      totalOutput: 150000
    }
  });
}
