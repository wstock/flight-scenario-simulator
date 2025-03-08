/**
 * Client-side AI utility functions
 * 
 * This module provides functions for client components to interact with AI models
 * through the server-side API routes.
 */

import { MODELS } from './aiClient';

/**
 * Generate a chat completion using the API route
 * Safe to use in client components
 * 
 * @param messages Array of message objects with role and content
 * @param model Model to use (defaults to SONNET)
 * @param temperature Temperature for response generation (0-1)
 * @param maxTokens Maximum tokens to generate
 * @returns The generated text response
 */
export async function generateAIResponse(
  messages: { role: string; content: string }[],
  model: string = MODELS.SONNET,
  temperature: number = 0.7,
  maxTokens: number = 1000
): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        temperature,
        maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
} 