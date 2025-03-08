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
  SONNET: process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-latest', // Use model from env or default to latest
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
  try {
    // First try parsing the response directly
    return JSON.parse(response);
  } catch (e) {
    console.log('Failed to parse entire response as JSON, trying to extract JSON...');
    
    // Try to extract JSON from code blocks (```json ... ```)
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
    const codeBlockMatch = response.match(codeBlockRegex);
    
    if (codeBlockMatch && codeBlockMatch[1]) {
      try {
        const jsonContent = codeBlockMatch[1].trim();
        console.log('Found JSON in code block, attempting to parse...');
        return JSON.parse(jsonContent);
      } catch (codeBlockError) {
        console.error('Failed to parse JSON from code block:', codeBlockError);
      }
    }
    
    // If code block extraction fails, try to find any JSON-like structure
    const jsonRegex = /(\{[\s\S]*\})/g;
    const jsonMatches = [...response.matchAll(jsonRegex)];
    
    if (jsonMatches.length > 0) {
      // Try each match until one works
      for (const match of jsonMatches) {
        try {
          console.log('Found JSON-like structure, attempting to parse...');
          return JSON.parse(match[0]);
        } catch (jsonError) {
          console.error('Failed to parse JSON match:', jsonError);
          // Continue to the next match
        }
      }
    }
    
    // If all else fails, try to extract the largest {...} block
    const jsonMatch = response.match(/\{[\s\S]*?\}/g);
    if (jsonMatch) {
      // Sort by length and try the longest match first (most likely to be the complete JSON)
      const sortedMatches = [...jsonMatch].sort((a, b) => b.length - a.length);
      
      for (const match of sortedMatches) {
        try {
          console.log('Trying to parse largest JSON block...');
          return JSON.parse(match);
        } catch (error) {
          console.error('Failed to parse JSON block:', error);
          // Continue to the next match
        }
      }
    }
    
    // If we get here, we couldn't find valid JSON
    console.error('Response content that failed to parse:', response);
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
