import { supabase } from '@/lib/supabase';
import { generateAnthropicResponse } from '@/lib/anthropic';

export interface AircraftParameters {
  id?: string;
  scenario_id: string;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  speed: number;
  vertical_speed: number; // feet per minute
  fuel: number;
  fuel_burn_rate: number; // pounds per minute
  created_at?: string;
}

export interface ParameterChange {
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  vertical_speed?: number | null;
  fuel_burn_rate?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  fuel?: number | null;
}

/**
 * Gets the current aircraft parameters
 */
export async function getCurrentParameters(scenarioId: string): Promise<AircraftParameters | null> {
  try {
    const { data, error } = await supabase
      .from('aircraft_positions')
      .select('*')
      .eq('scenario_id', scenarioId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting current parameters:', error);
    throw new Error('Failed to get current parameters');
  }
}

/**
 * Updates aircraft parameters
 */
export async function updateParameters(
  scenarioId: string,
  changes: ParameterChange
): Promise<AircraftParameters> {
  try {
    // Get current parameters
    const currentParams = await getCurrentParameters(scenarioId);
    if (!currentParams) {
      throw new Error('No current parameters found');
    }
    
    // Apply changes
    const updateData: any = {};
    if (changes.altitude !== undefined) updateData.altitude = changes.altitude;
    if (changes.heading !== undefined) updateData.heading = changes.heading;
    if (changes.speed !== undefined) updateData.speed = changes.speed;
    if (changes.vertical_speed !== undefined) updateData.vertical_speed = changes.vertical_speed;
    if (changes.fuel_burn_rate !== undefined) updateData.fuel_burn_rate = changes.fuel_burn_rate;
    if (changes.latitude !== undefined) updateData.latitude = changes.latitude;
    if (changes.longitude !== undefined) updateData.longitude = changes.longitude;
    if (changes.fuel !== undefined) updateData.fuel = changes.fuel;
    
    // Update in database
    const { data, error } = await supabase
      .from('aircraft_positions')
      .update(updateData)
      .eq('scenario_id', scenarioId)
      .select('*')
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error updating parameters:', error);
    throw new Error('Failed to update parameters');
  }
}

/**
 * Simulates parameter changes based on a decision
 */
export async function simulateParameterChanges(
  scenarioId: string,
  decisionId: string,
  optionId: string
): Promise<ParameterChange> {
  try {
    // Get the decision and option details
    const { data: decisionData, error: decisionError } = await supabase
      .from('decisions')
      .select(`
        id,
        title,
        description,
        decision_options (
          id,
          text,
          consequences
        )
      `)
      .eq('id', decisionId)
      .single();
    
    if (decisionError) throw decisionError;
    
    // Get the selected option
    const selectedOption = decisionData.decision_options.find((opt: any) => opt.id === optionId);
    if (!selectedOption) throw new Error('Selected option not found');
    
    // Get current aircraft parameters
    const currentParams = await getCurrentParameters(scenarioId);
    if (!currentParams) {
      throw new Error('No current parameters found');
    }
    
    // Build context for AI to simulate parameter changes
    const prompt = `
      You are a flight simulator parameter calculator. Based on the user's decision, calculate how the aircraft parameters should change.
      
      Current aircraft parameters:
      - Latitude: ${currentParams.latitude}
      - Longitude: ${currentParams.longitude}
      - Altitude: ${currentParams.altitude} feet
      - Heading: ${currentParams.heading} degrees
      - Speed: ${currentParams.speed || 'Unknown'} knots
      - Vertical speed: ${currentParams.vertical_speed || 'Unknown'} feet per minute
      - Fuel: ${currentParams.fuel} pounds
      - Fuel burn rate: ${currentParams.fuel_burn_rate} pounds per minute
      
      Decision made: ${decisionData.title}
      Decision description: ${decisionData.description}
      Selected option: ${selectedOption.text}
      Consequences: ${selectedOption.consequences}
      
      Please calculate the parameter changes in JSON format:
      
      {
        "altitude": number or null (new altitude in feet),
        "heading": number or null (new heading in degrees),
        "speed": number or null (new speed in knots),
        "vertical_speed": number or null (new vertical speed in feet per minute),
        "fuel_burn_rate": number or null (new fuel burn rate in pounds per minute)
      }
      
      Only include parameters that should change as a result of this decision. Use null for parameters that should not change.
      Make sure the changes are realistic and follow from the decision made and its consequences.
    `;
    
    // Generate the parameter changes using Anthropic API
    const response = await generateAnthropicResponse([
      { role: 'user', content: prompt }
    ]);
    
    // Parse the response
    const paramChanges = JSON.parse(extractJsonFromResponse(response));
    
    return paramChanges;
  } catch (error) {
    console.error('Error simulating parameter changes:', error);
    throw new Error('Failed to simulate parameter changes');
  }
}

/**
 * Simulates and applies parameter changes
 */
export async function simulateAndApplyChanges(
  scenarioId: string,
  decisionId: string,
  optionId: string
): Promise<AircraftParameters> {
  try {
    // Simulate parameter changes
    const changes = await simulateParameterChanges(scenarioId, decisionId, optionId);
    
    // Apply changes
    const updatedParams = await updateParameters(scenarioId, changes);
    
    return updatedParams;
  } catch (error) {
    console.error('Error simulating and applying changes:', error);
    throw new Error('Failed to simulate and apply changes');
  }
}

/**
 * Simulates continuous parameter changes over time
 */
export async function simulateContinuousChanges(scenarioId: string, elapsedSeconds: number): Promise<AircraftParameters> {
  try {
    // Get current parameters
    const currentParams = await getCurrentParameters(scenarioId);
    if (!currentParams) {
      throw new Error('No current parameters found');
    }
    
    // Calculate new fuel level based on burn rate
    const fuelBurnPerSecond = currentParams.fuel_burn_rate / 60;
    const fuelBurned = fuelBurnPerSecond * elapsedSeconds;
    const newFuel = Math.max(0, currentParams.fuel - fuelBurned);
    
    // Calculate new position based on speed and heading
    let newLatitude = currentParams.latitude;
    let newLongitude = currentParams.longitude;
    
    if (currentParams.speed) {
      // Convert speed from knots to degrees per second (very approximate)
      const speedDegPerSecond = currentParams.speed / 3600 / 60;
      
      // Calculate new position based on heading
      const headingRad = (currentParams.heading * Math.PI) / 180;
      newLatitude = currentParams.latitude + Math.cos(headingRad) * speedDegPerSecond * elapsedSeconds;
      newLongitude = currentParams.longitude + Math.sin(headingRad) * speedDegPerSecond * elapsedSeconds;
    }
    
    // Calculate new altitude based on vertical speed
    let newAltitude = currentParams.altitude;
    if (currentParams.vertical_speed) {
      const altitudeChangePerSecond = currentParams.vertical_speed / 60;
      newAltitude = currentParams.altitude + altitudeChangePerSecond * elapsedSeconds;
    }
    
    // Apply changes
    const changes: ParameterChange = {
      fuel: newFuel,
      latitude: newLatitude,
      longitude: newLongitude,
      altitude: newAltitude,
    };
    
    const updatedParams = await updateParameters(scenarioId, changes);
    
    return updatedParams;
  } catch (error) {
    console.error('Error simulating continuous changes:', error);
    throw new Error('Failed to simulate continuous changes');
  }
}

/**
 * Extracts JSON from a text response
 */
function extractJsonFromResponse(response: string): string {
  try {
    // Try to parse the entire response as JSON
    JSON.parse(response);
    return response;
  } catch (e) {
    // If that fails, try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        JSON.parse(jsonMatch[0]);
        return jsonMatch[0];
      } catch (innerError) {
        throw new Error('Failed to parse JSON from response');
      }
    }
    throw new Error('No valid JSON found in response');
  }
} 