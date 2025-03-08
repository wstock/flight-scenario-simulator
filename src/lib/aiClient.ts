/**
 * AI Client Library
 *
 * This module provides a unified interface for interacting with Anthropic's Claude models.
 * It handles message formatting, API calls, and response parsing.
 *
 * Primary Function:
 *
 * generateChatCompletion(messages, model = "SONNET", options = {})
 *    - Main function for AI interactions
 *    - Uses Anthropic's Claude 3.7 Sonnet model
 *    Example:
 *    ```typescript
 *    const response = await generateChatCompletion([
 *      { role: "user", content: "Generate a business idea" }
 *    ]);
 *    ```
 *
 * Available Models:
 * - SONNET: Claude 3.7 Sonnet (default)
 */

import Anthropic from '@anthropic-ai/sdk';
import { MessageParam } from '@anthropic-ai/sdk/resources/messages';

// Available models
export const MODELS = {
  SONNET: 'claude-3-sonnet-20240229', // Claude 3.7 Sonnet (default)
};

// Only initialize Anthropic client on the server side
let anthropic: Anthropic | null = null;
if (typeof window === 'undefined') {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  });
}

export type AIModel = keyof typeof MODELS;

export function parseJsonResponse(response: string): any {
  // First try parsing the response directly
  try {
    return JSON.parse(response);
  } catch (e) {
    // If direct parsing fails, look for code blocks
    const codeBlockRegex = /```(?:json|[^\n]*\n)?([\s\S]*?)```/;
    const match = response.match(codeBlockRegex);

    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch (innerError) {
        throw new Error("Failed to parse JSON from code block");
      }
    }

    throw new Error("No valid JSON found in response");
  }
}

/**
 * Generate a chat completion using the specified model
 * This function should only be called from server components or API routes
 * 
 * @param messages Array of message objects with role and content
 * @param model Model to use (defaults to SONNET)
 * @param temperature Temperature for response generation (0-1)
 * @param maxTokens Maximum tokens to generate
 * @returns The generated text response
 */
export async function generateChatCompletion(
  messages: { role: string; content: string }[],
  model: string = MODELS.SONNET,
  temperature: number = 0.7,
  maxTokens: number = 1000
): Promise<string> {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    throw new Error('generateChatCompletion cannot be called from client components. Use the /api/ai route instead.');
  }

  if (!anthropic) {
    throw new Error('Anthropic client not initialized');
  }

  try {
    // Convert messages to Anthropic format
    const anthropicMessages: MessageParam[] = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model,
      messages: anthropicMessages,
      temperature,
      max_tokens: maxTokens,
    });

    // Handle the response content properly
    if (response.content[0].type === 'text') {
      return response.content[0].text;
    }
    
    return '';
  } catch (error) {
    console.error('Error generating chat completion:', error);
    throw error;
  }
}
