import { generateChatCompletion, MODELS } from './aiClient';

/**
 * Generates a response using the Anthropic Claude model
 * @param messages Array of message objects with role and content
 * @returns Promise with text response
 */
export async function generateAnthropicResponse(
  messages: Array<{ role: "user" | "system" | "assistant"; content: string }>
): Promise<string> {
  try {
    // Always use the SONNET model
    return await generateChatCompletion(messages, MODELS.SONNET);
  } catch (error) {
    console.error("Error generating Anthropic response:", error);
    throw error;
  }
}

/**
 * Generates a scenario using Anthropic Claude
 * @param prompt The prompt to generate a scenario
 * @returns Promise with the generated scenario
 */
export async function generateScenario(prompt: string): Promise<string> {
  const messages = [
    {
      role: "system" as const,
      content: "You are a flight simulation scenario creator. Create detailed, realistic aviation scenarios with clear decision points."
    },
    {
      role: "user" as const,
      content: prompt
    }
  ];
  
  return generateAnthropicResponse(messages);
}

/**
 * Generates ATC communications using Anthropic Claude
 * @param context The context for the ATC communication
 * @returns Promise with the generated ATC communication
 */
export async function generateATCCommunication(context: string): Promise<string> {
  const messages = [
    {
      role: "system" as const,
      content: "You are an air traffic controller. Generate realistic ATC communications using proper phraseology and protocols."
    },
    {
      role: "user" as const,
      content: context
    }
  ];
  
  return generateAnthropicResponse(messages);
}

/**
 * Generates crew communications using Anthropic Claude
 * @param context The context for the crew communication
 * @returns Promise with the generated crew communication
 */
export async function generateCrewCommunication(context: string): Promise<string> {
  const messages = [
    {
      role: "system" as const,
      content: "You are a flight crew member. Generate realistic cockpit communications using proper aviation terminology and protocols."
    },
    {
      role: "user" as const,
      content: context
    }
  ];
  
  return generateAnthropicResponse(messages);
} 