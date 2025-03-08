import { generateATCCommunication } from '@/lib/anthropic';
import { supabase } from '@/lib/supabase';

export interface ATCCommunicationParams {
  scenarioId: string;
  aircraftCallsign: string;
  currentPhase: 'taxi' | 'takeoff' | 'climb' | 'cruise' | 'descent' | 'approach' | 'landing';
  currentAltitude?: number;
  currentHeading?: number;
  weatherCondition?: string;
  nextWaypoint?: string;
  specialInstructions?: string;
}

export interface ATCCommunication {
  id?: string;
  scenario_id: string;
  type: 'atc';
  sender: string;
  message: string;
  is_important: boolean;
  created_at?: string;
}

/**
 * Generates an ATC communication using Anthropic API based on flight context
 */
export async function generateATCMessage(params: ATCCommunicationParams): Promise<ATCCommunication> {
  const {
    scenarioId,
    aircraftCallsign,
    currentPhase,
    currentAltitude,
    currentHeading,
    weatherCondition,
    nextWaypoint,
    specialInstructions,
  } = params;
  
  // Determine ATC facility based on flight phase
  let atcFacility = 'Tower';
  switch (currentPhase) {
    case 'taxi':
      atcFacility = 'Ground';
      break;
    case 'takeoff':
    case 'landing':
      atcFacility = 'Tower';
      break;
    case 'climb':
    case 'descent':
      atcFacility = 'Approach';
      break;
    case 'cruise':
      atcFacility = 'Center';
      break;
    case 'approach':
      atcFacility = 'Approach';
      break;
  }
  
  // Build context for the AI
  let context = `
    Generate a realistic ATC communication for ${aircraftCallsign} during the ${currentPhase} phase.
    The ATC facility is ${atcFacility}.
    ${currentAltitude ? `Current altitude is ${currentAltitude} feet.` : ''}
    ${currentHeading ? `Current heading is ${currentHeading} degrees.` : ''}
    ${weatherCondition ? `Weather conditions: ${weatherCondition}.` : ''}
    ${nextWaypoint ? `Next waypoint is ${nextWaypoint}.` : ''}
    ${specialInstructions ? `Special instructions: ${specialInstructions}.` : ''}
    
    Use proper aviation phraseology and format. Keep the message concise and realistic.
    Do not include any explanations or commentary, just the ATC message itself.
  `;
  
  try {
    // Generate ATC communication using Anthropic API
    const message = await generateATCCommunication(context);
    
    // Determine if this is an important communication
    const isImportant = 
      message.includes('IMMEDIATELY') || 
      message.includes('EMERGENCY') || 
      message.includes('CAUTION') ||
      message.includes('WARNING') ||
      message.includes('TRAFFIC') ||
      (specialInstructions ? specialInstructions.includes('emergency') : false);
    
    // Create communication object
    const communication: ATCCommunication = {
      scenario_id: scenarioId,
      type: 'atc',
      sender: `${atcFacility}`,
      message: message.trim(),
      is_important: isImportant,
    };
    
    return communication;
  } catch (error) {
    console.error('Error generating ATC communication:', error);
    throw new Error('Failed to generate ATC communication');
  }
}

/**
 * Saves an ATC communication to Supabase
 */
export async function saveATCCommunication(communication: ATCCommunication): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('communications')
      .insert({
        scenario_id: communication.scenario_id,
        type: communication.type,
        sender: communication.sender,
        message: communication.message,
        is_important: communication.is_important,
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    return data.id;
  } catch (error) {
    console.error('Error saving ATC communication:', error);
    throw new Error('Failed to save ATC communication');
  }
}

/**
 * Generates and saves an ATC communication
 */
export async function generateAndSaveATCCommunication(params: ATCCommunicationParams): Promise<string> {
  const communication = await generateATCMessage(params);
  return saveATCCommunication(communication);
} 