import { NextResponse } from 'next/server';

export async function GET(request) {
  return NextResponse.json({
    ai_provider: 'google',
    ai_api_key: '',
    ai_model: 'gemini-2.0-flash',
    ai_system_prompt: 'You are a CEO of a modern tech agency. Your tone is bold and direct. Focus on helping clients with effective solutions. You represent the brand "Solid Models".',
    ai_temperature: 0.7,
    ai_max_tokens: 1000,
    ai_spend_limit: 10.0,
    ai_default_enabled: true,
    ai_source_mode: 'saas_ai',
    ai_own_enabled: false,
    ai_saas_enabled: true,
    saas_free_replies_used: 2,
    saas_free_replies_limit: 10,
    saas_wallet_balance_inr: 500,
    saas_wallet_currency: 'INR',
    saas_block_reason: null,
  });
}

export async function POST(request) {
  const body = await request.json();
  return NextResponse.json({ success: true, message: 'AI settings saved!' });
}
