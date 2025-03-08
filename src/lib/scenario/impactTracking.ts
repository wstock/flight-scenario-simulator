import { supabase } from '@/lib/supabase';
import { generateAnthropicResponse } from '@/lib/anthropic';

export interface DecisionImpact {
  id?: string;
  scenario_id: string;
  decision_id: string;
  option_id: string;
  safety_impact: number; // -10 to 10 scale
  efficiency_impact: number; // -10 to 10 scale
  passenger_comfort_impact: number; // -10 to 10 scale
  time_impact: number; // In minutes (positive = delay, negative = time saved)
  fuel_impact: number; // In pounds (positive = extra consumption, negative = fuel saved)
  description: string;
  created_at?: string;
}

export interface ScenarioState {
  id?: string;
  scenario_id: string;
  current_safety_score: number; // 0-100 scale
  current_efficiency_score: number; // 0-100 scale
  current_passenger_comfort_score: number; // 0-100 scale
  time_deviation: number; // In minutes from scheduled arrival
  fuel_remaining: number; // In pounds
  created_at?: string;
}

/**
 * Calculates the impact of a decision on the scenario
 */
export async function calculateDecisionImpact(
  scenarioId: string,
  decisionId: string,
  optionId: string
): Promise<DecisionImpact> {
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
          consequences,
          is_recommended
        )
      `)
      .eq('id', decisionId)
      .single();
    
    if (decisionError) throw decisionError;
    
    // Get the selected option
    const selectedOption = decisionData.decision_options.find((opt: any) => opt.id === optionId);
    if (!selectedOption) throw new Error('Selected option not found');
    
    // Get current scenario state
    const { data: stateData, error: stateError } = await supabase
      .from('scenario_states')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (stateError && stateError.code !== 'PGRST116') throw stateError;
    
    // Get current aircraft state
    const { data: aircraftData, error: aircraftError } = await supabase
      .from('aircraft_positions')
      .select('*')
      .eq('scenario_id', scenarioId)
      .single();
    
    if (aircraftError) throw aircraftError;
    
    // Get scenario details
    const { data: scenarioData, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();
    
    if (scenarioError) throw scenarioError;
    
    // If we don't have a current state, create an initial one
    let currentState: ScenarioState;
    if (!stateData) {
      currentState = {
        scenario_id: scenarioId,
        current_safety_score: 100,
        current_efficiency_score: 100,
        current_passenger_comfort_score: 100,
        time_deviation: 0,
        fuel_remaining: aircraftData?.fuel || scenarioData?.initial_fuel || 0,
      };
    } else {
      currentState = stateData;
    }
    
    // Build context for AI to calculate the impact
    const prompt = `
      You are a flight scenario impact calculator. Based on the user's decision, calculate the impact on various aspects of the flight.
      
      Current scenario state:
      - Safety score: ${currentState.current_safety_score}/100
      - Efficiency score: ${currentState.current_efficiency_score}/100
      - Passenger comfort score: ${currentState.current_passenger_comfort_score}/100
      - Time deviation: ${currentState.time_deviation} minutes
      - Fuel remaining: ${currentState.fuel_remaining} pounds
      
      Current aircraft state:
      - Altitude: ${aircraftData?.altitude || 'Unknown'} feet
      - Heading: ${aircraftData?.heading || 'Unknown'} degrees
      
      Decision made: ${decisionData.title}
      Decision description: ${decisionData.description}
      Selected option: ${selectedOption.text}
      Consequences: ${selectedOption.consequences}
      Was recommended option: ${selectedOption.is_recommended ? 'Yes' : 'No'}
      
      Please calculate the impact of this decision in JSON format:
      
      {
        "safety_impact": number (-10 to 10, where negative is worse, positive is better),
        "efficiency_impact": number (-10 to 10, where negative is worse, positive is better),
        "passenger_comfort_impact": number (-10 to 10, where negative is worse, positive is better),
        "time_impact": number (in minutes, positive means delay, negative means time saved),
        "fuel_impact": number (in pounds, positive means extra consumption, negative means fuel saved),
        "description": "Detailed explanation of the impacts"
      }
      
      Make sure the impacts are realistic and follow from the decision made and its consequences.
    `;
    
    // Generate the impact using Anthropic API
    const response = await generateAnthropicResponse([
      { role: 'user', content: prompt }
    ]);
    
    // Parse the response
    const impactData = JSON.parse(extractJsonFromResponse(response));
    
    // Create the impact record
    const impact: DecisionImpact = {
      scenario_id: scenarioId,
      decision_id: decisionId,
      option_id: optionId,
      safety_impact: impactData.safety_impact,
      efficiency_impact: impactData.efficiency_impact,
      passenger_comfort_impact: impactData.passenger_comfort_impact,
      time_impact: impactData.time_impact,
      fuel_impact: impactData.fuel_impact,
      description: impactData.description,
    };
    
    return impact;
  } catch (error) {
    console.error('Error calculating decision impact:', error);
    throw new Error('Failed to calculate decision impact');
  }
}

/**
 * Saves a decision impact to the database
 */
export async function saveDecisionImpact(impact: DecisionImpact): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('decision_impacts')
      .insert(impact)
      .select('id')
      .single();
    
    if (error) throw error;
    
    return data.id;
  } catch (error) {
    console.error('Error saving decision impact:', error);
    throw new Error('Failed to save decision impact');
  }
}

/**
 * Updates the scenario state based on a decision impact
 */
export async function updateScenarioState(scenarioId: string, impact: DecisionImpact): Promise<ScenarioState> {
  try {
    // Get current scenario state
    const { data: stateData, error: stateError } = await supabase
      .from('scenario_states')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (stateError && stateError.code !== 'PGRST116') throw stateError;
    
    // Get current aircraft state for fuel
    const { data: aircraftData, error: aircraftError } = await supabase
      .from('aircraft_positions')
      .select('*')
      .eq('scenario_id', scenarioId)
      .single();
    
    if (aircraftError) throw aircraftError;
    
    // Get scenario details for initial values
    const { data: scenarioData, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();
    
    if (scenarioError) throw scenarioError;
    
    // If we don't have a current state, create an initial one
    let currentState: ScenarioState;
    if (!stateData) {
      currentState = {
        scenario_id: scenarioId,
        current_safety_score: 100,
        current_efficiency_score: 100,
        current_passenger_comfort_score: 100,
        time_deviation: 0,
        fuel_remaining: aircraftData?.fuel || scenarioData?.initial_fuel || 0,
      };
    } else {
      currentState = stateData;
    }
    
    // Calculate new state values
    const newState: ScenarioState = {
      scenario_id: scenarioId,
      current_safety_score: Math.max(0, Math.min(100, currentState.current_safety_score + impact.safety_impact)),
      current_efficiency_score: Math.max(0, Math.min(100, currentState.current_efficiency_score + impact.efficiency_impact)),
      current_passenger_comfort_score: Math.max(0, Math.min(100, currentState.current_passenger_comfort_score + impact.passenger_comfort_impact)),
      time_deviation: currentState.time_deviation + impact.time_impact,
      fuel_remaining: currentState.fuel_remaining - impact.fuel_impact,
    };
    
    // Save the new state
    const { data, error } = await supabase
      .from('scenario_states')
      .insert(newState)
      .select('*')
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error updating scenario state:', error);
    throw new Error('Failed to update scenario state');
  }
}

/**
 * Gets the current scenario state
 */
export async function getCurrentScenarioState(scenarioId: string): Promise<ScenarioState | null> {
  try {
    const { data, error } = await supabase
      .from('scenario_states')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting current scenario state:', error);
    throw new Error('Failed to get current scenario state');
  }
}

/**
 * Processes a decision and updates the scenario state
 */
export async function processDecisionImpact(
  scenarioId: string,
  decisionId: string,
  optionId: string
): Promise<{ impact: DecisionImpact; newState: ScenarioState }> {
  try {
    // Calculate the impact
    const impact = await calculateDecisionImpact(scenarioId, decisionId, optionId);
    
    // Save the impact
    await saveDecisionImpact(impact);
    
    // Update the scenario state
    const newState = await updateScenarioState(scenarioId, impact);
    
    return { impact, newState };
  } catch (error) {
    console.error('Error processing decision impact:', error);
    throw new Error('Failed to process decision impact');
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