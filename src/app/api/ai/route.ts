import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/utils/logger';
import { generateChatCompletion, MODELS } from '@/lib/aiClient';
import { db } from '@/lib/db';

const logger = createApiLogger('AiRoute');

export const runtime = 'edge';

// Get the model from environment variable or use the default
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || MODELS.SONNET;

export async function POST(req: NextRequest) {
  try {
    const { messages, model = CLAUDE_MODEL, temperature = 0.7, maxTokens = 1000 } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }

    logger.info(`Processing request with model ${model}`);
    
    try {
      const response = await generateChatCompletion(
        messages,
        model,
        temperature,
        maxTokens
      );
      
      logger.info(`Successfully generated response (${response.length} chars)`);
      
      return NextResponse.json({ response });
    } catch (aiError) {
      logger.error('Error generating AI response:', aiError);
      
      // Provide more specific error information
      const errorMessage = aiError instanceof Error 
        ? aiError.message 
        : 'Unknown error generating AI response';
        
      return NextResponse.json(
        { 
          error: 'AI generation failed', 
          message: errorMessage,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error processing request:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 
