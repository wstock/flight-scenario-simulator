import { NextRequest, NextResponse } from 'next/server';
import { generateChatCompletion, MODELS } from '@/lib/aiClient';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, model = MODELS.SONNET, temperature = 0.7, maxTokens = 1000 } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }

    const response = await generateChatCompletion(
      messages,
      model,
      temperature,
      maxTokens
    );

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in AI API route:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
} 