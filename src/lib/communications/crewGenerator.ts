import { generateCrewCommunication } from '@/lib/anthropic';
import { supabase } from '@/lib/supabase';

export interface CrewCommunicationParams {
  scenarioId: string;
  aircraftCallsign: string;
  currentPhase: 'taxi' | 'takeoff' | 'climb' | 'cruise' | 'descent' | 'approach' | 'landing';
  crewMember: 'Captain' | 'First Officer' | 'Flight Engineer' | 'Cabin Crew';
  currentAltitude?: number;
  currentHeading?: number;
  weatherCondition?: string;
  systemStatus?: string;
  replyToATC?: string;
  specialSituation?: string;
}

export interface CrewCommunication {
  id?: string;
  scenario_id: string;
  type: 'crew';
  sender: string;
  message: string;
  is_important: boolean;
  created_at?: string;
}

/**
 * Generates a crew communication using Anthropic API based on flight context
 */
export async function generateCrewMessage(params: CrewCommunicationParams): Promise<CrewCommunication> {
  const {
    scenarioId,
    aircraftCallsign,
    currentPhase,
    crewMember,
    currentAltitude,
    currentHeading,
    weatherCondition,
    systemStatus,
    replyToATC,
    specialSituation,
  } = params;
  
  // Build context for the AI
  let context = `
    Generate a realistic ${crewMember} communication for ${aircraftCallsign} during the ${currentPhase} phase.
    ${currentAltitude ? `Current altitude is ${currentAltitude} feet.` : ''}
    ${currentHeading ? `Current heading is ${currentHeading} degrees.` : ''}
    ${weatherCondition ? `Weather conditions: ${weatherCondition}.` : ''}
    ${systemStatus ? `System status: ${systemStatus}.` : ''}
    ${replyToATC ? `This is in response to ATC: "${replyToATC}"` : ''}
    ${specialSituation ? `Special situation: ${specialSituation}.` : ''}
    
    Use proper aviation phraseology and format. Keep the message concise and realistic.
    Do not include any explanations or commentary, just the crew communication itself.
    ${replyToATC ? 'Make sure to include proper readback of critical information.' : ''}
  `;
  
  try {
    // Generate crew communication using Anthropic API
    const message = await generateCrewCommunication(context);
    
    // Determine if this is an important communication
    const isImportant = 
      message.includes('MAYDAY') || 
      message.includes('PAN PAN') || 
      message.includes('EMERGENCY') ||
      message.includes('WARNING') ||
      message.includes('ALERT') ||
      (specialSituation ? specialSituation.includes('emergency') || specialSituation.includes('failure') : false);
    
    // Create communication object
    const communication: CrewCommunication = {
      scenario_id: scenarioId,
      type: 'crew',
      sender: crewMember,
      message: message.trim(),
      is_important: isImportant,
    };
    
    return communication;
  } catch (error) {
    console.error('Error generating crew communication:', error);
    throw new Error('Failed to generate crew communication');
  }
}

/**
 * Saves a crew communication to Supabase
 */
export async function saveCrewCommunication(communication: CrewCommunication): Promise<string> {
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
    console.error('Error saving crew communication:', error);
    throw new Error('Failed to save crew communication');
  }
}

/**
 * Generates and saves a crew communication
 */
export async function generateAndSaveCrewCommunication(params: CrewCommunicationParams): Promise<string> {
  const communication = await generateCrewMessage(params);
  return saveCrewCommunication(communication);
}

/**
 * Generates a crew response to an ATC communication
 */
export async function generateCrewResponseToATC(
  scenarioId: string,
  aircraftCallsign: string,
  atcMessage: string,
  currentPhase: CrewCommunicationParams['currentPhase'],
  currentAltitude?: number,
  currentHeading?: number
): Promise<string> {
  const params: CrewCommunicationParams = {
    scenarioId,
    aircraftCallsign,
    currentPhase,
    crewMember: 'Captain',
    currentAltitude,
    currentHeading,
    replyToATC: atcMessage,
  };
  
  return generateAndSaveCrewCommunication(params);
} 