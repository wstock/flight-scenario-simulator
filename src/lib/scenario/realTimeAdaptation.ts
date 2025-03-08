import { supabase } from '@/lib/supabase';
import { generateAnthropicResponse } from '@/lib/anthropic';
import { activateDecisionNode } from './decisionTree';
import { simulateContinuousChanges } from './parameterSimulation';

export interface ScenarioTiming {
  id?: string;
  scenario_id: string;
  start_time: string;
  last_update_time: string;
  is_paused: boolean;
  elapsed_seconds: number;
  created_at?: string;
}

/**
 * Gets the current scenario timing
 */
export async function getScenarioTiming(scenarioId: string): Promise<ScenarioTiming | null> {
  try {
    const { data, error } = await supabase
      .from('active_scenarios')
      .select('*')
      .eq('scenario_id', scenarioId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting scenario timing:', error);
    throw new Error('Failed to get scenario timing');
  }
}

/**
 * Updates the scenario timing
 */
export async function updateScenarioTiming(
  scenarioId: string,
  elapsedSeconds: number,
  isPaused: boolean = false
): Promise<ScenarioTiming> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('active_scenarios')
      .update({
        last_update_time: now,
        elapsed_seconds: elapsedSeconds,
        is_paused: isPaused,
      })
      .eq('scenario_id', scenarioId)
      .select('*')
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error updating scenario timing:', error);
    throw new Error('Failed to update scenario timing');
  }
}

/**
 * Pauses a scenario
 */
export async function pauseScenario(scenarioId: string): Promise<ScenarioTiming> {
  try {
    const timing = await getScenarioTiming(scenarioId);
    if (!timing) {
      throw new Error('No active scenario found');
    }
    
    return updateScenarioTiming(scenarioId, timing.elapsed_seconds, true);
  } catch (error) {
    console.error('Error pausing scenario:', error);
    throw new Error('Failed to pause scenario');
  }
}

/**
 * Resumes a scenario
 */
export async function resumeScenario(scenarioId: string): Promise<ScenarioTiming> {
  try {
    const timing = await getScenarioTiming(scenarioId);
    if (!timing) {
      throw new Error('No active scenario found');
    }
    
    return updateScenarioTiming(scenarioId, timing.elapsed_seconds, false);
  } catch (error) {
    console.error('Error resuming scenario:', error);
    throw new Error('Failed to resume scenario');
  }
}

/**
 * Processes a scenario tick, updating parameters and triggering events
 */
export async function processScenarioTick(scenarioId: string, secondsElapsed: number = 1): Promise<void> {
  try {
    // Get current timing
    const timing = await getScenarioTiming(scenarioId);
    if (!timing || timing.is_paused) {
      return; // Scenario is not active or is paused
    }
    
    // Update elapsed time
    const newElapsedSeconds = timing.elapsed_seconds + secondsElapsed;
    await updateScenarioTiming(scenarioId, newElapsedSeconds, false);
    
    // Simulate continuous parameter changes
    await simulateContinuousChanges(scenarioId, secondsElapsed);
    
    // Check for time-based triggers
    await checkTimeTriggers(scenarioId, newElapsedSeconds);
    
    // Check for communications to send
    await checkCommunicationsTriggers(scenarioId, newElapsedSeconds);
  } catch (error) {
    console.error('Error processing scenario tick:', error);
    throw new Error('Failed to process scenario tick');
  }
}

/**
 * Checks for time-based triggers
 */
async function checkTimeTriggers(scenarioId: string, elapsedSeconds: number): Promise<void> {
  try {
    // Check for decision nodes that should be triggered based on time
    const { data, error } = await supabase
      .from('decision_nodes')
      .select('*')
      .eq('scenario_id', scenarioId)
      .eq('is_active', false)
      .not('trigger_time', 'is', null)
      .lte('trigger_time', elapsedSeconds);
    
    if (error) throw error;
    
    // Activate any nodes that should be triggered
    for (const node of data || []) {
      await activateDecisionNode(node.id);
    }
  } catch (error) {
    console.error('Error checking time triggers:', error);
    throw new Error('Failed to check time triggers');
  }
}

/**
 * Checks for communications that should be sent
 */
async function checkCommunicationsTriggers(scenarioId: string, elapsedSeconds: number): Promise<void> {
  try {
    // Check for communications that should be sent based on time
    const { data, error } = await supabase
      .from('communications_queue')
      .select('*')
      .eq('scenario_id', scenarioId)
      .eq('is_sent', false)
      .not('trigger_time', 'is', null)
      .lte('trigger_time', elapsedSeconds);
    
    if (error) throw error;
    
    // Send any communications that should be triggered
    for (const comm of data || []) {
      // Mark as sent
      await supabase
        .from('communications_queue')
        .update({ is_sent: true })
        .eq('id', comm.id);
      
      // Copy to actual communications
      await supabase
        .from('communications')
        .insert({
          scenario_id: comm.scenario_id,
          type: comm.type,
          sender: comm.sender,
          message: comm.message,
          is_important: comm.is_important,
        });
    }
  } catch (error) {
    console.error('Error checking communications triggers:', error);
    throw new Error('Failed to check communications triggers');
  }
}

/**
 * Adapts the scenario difficulty based on user performance
 */
export async function adaptScenarioDifficulty(scenarioId: string): Promise<void> {
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
    if (!stateData) return; // No state to adapt
    
    // Get decision history
    const { data: decisionsData, error: decisionsError } = await supabase
      .from('decision_responses')
      .select(`
        id,
        decision_id,
        option_id,
        created_at,
        decisions:decision_id (
          id,
          title,
          description,
          decision_options (
            id,
            text,
            consequences,
            is_recommended
          )
        )
      `)
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (decisionsError) throw decisionsError;
    
    // Calculate performance metrics
    let recommendedChoices = 0;
    let totalChoices = decisionsData?.length || 0;
    
    for (const decision of decisionsData || []) {
      // Use type assertion to handle the nested structure
      const decisionData = decision.decisions as any;
      const options = decisionData?.decision_options || [];
      const selectedOption = options.find((opt: any) => opt.id === decision.option_id);
      
      if (selectedOption?.is_recommended) {
        recommendedChoices++;
      }
    }
    
    const performanceRatio = totalChoices > 0 ? recommendedChoices / totalChoices : 0.5;
    
    // Build context for AI to adapt difficulty
    const prompt = `
      You are a flight scenario adaptation engine. Based on the user's performance, suggest adaptations to the scenario difficulty.
      
      Current scenario state:
      - Safety score: ${stateData.current_safety_score}/100
      - Efficiency score: ${stateData.current_efficiency_score}/100
      - Passenger comfort score: ${stateData.current_passenger_comfort_score}/100
      - Time deviation: ${stateData.time_deviation} minutes
      - Fuel remaining: ${stateData.fuel_remaining} pounds
      
      User performance:
      - Recommended choices made: ${recommendedChoices}/${totalChoices}
      - Performance ratio: ${performanceRatio}
      
      Please suggest adaptations in JSON format:
      
      {
        "difficulty_adjustment": "increase" | "decrease" | "maintain",
        "time_pressure_adjustment": "increase" | "decrease" | "maintain",
        "communication_frequency_adjustment": "increase" | "decrease" | "maintain",
        "weather_intensity_adjustment": "increase" | "decrease" | "maintain",
        "explanation": "Detailed explanation of the adaptations"
      }
      
      Make sure the adaptations are appropriate for the user's performance level.
    `;
    
    // Generate adaptations using Anthropic API
    const response = await generateAnthropicResponse([
      { role: 'user', content: prompt }
    ]);
    
    // Parse the response
    const adaptations = JSON.parse(extractJsonFromResponse(response));
    
    // Apply adaptations
    await applyAdaptations(scenarioId, adaptations);
  } catch (error) {
    console.error('Error adapting scenario difficulty:', error);
    throw new Error('Failed to adapt scenario difficulty');
  }
}

/**
 * Applies scenario adaptations
 */
async function applyAdaptations(scenarioId: string, adaptations: any): Promise<void> {
  try {
    // Store the adaptations for reference
    await supabase
      .from('scenario_adaptations')
      .insert({
        scenario_id: scenarioId,
        adaptations,
      });
    
    // Apply difficulty adjustment to future decisions
    if (adaptations.difficulty_adjustment !== 'maintain') {
      // Get pending decisions
      const { data: nodesData, error: nodesError } = await supabase
        .from('decision_nodes')
        .select('*')
        .eq('scenario_id', scenarioId)
        .eq('is_active', false)
        .is('decision_id', 'not.null');
      
      if (nodesError) throw nodesError;
      
      // Adjust time limits based on difficulty
      for (const node of nodesData || []) {
        if (node.decision_id) {
          const { data: decisionData, error: decisionError } = await supabase
            .from('decisions')
            .select('*')
            .eq('id', node.decision_id)
            .single();
          
          if (decisionError) continue;
          
          let timeLimit = decisionData.time_limit;
          if (timeLimit && adaptations.time_pressure_adjustment !== 'maintain') {
            // Adjust time limit
            const factor = adaptations.time_pressure_adjustment === 'increase' ? 0.8 : 1.2;
            timeLimit = Math.round(timeLimit * factor);
            
            await supabase
              .from('decisions')
              .update({ time_limit: timeLimit })
              .eq('id', node.decision_id);
          }
        }
      }
    }
    
    // Apply weather intensity adjustment
    if (adaptations.weather_intensity_adjustment !== 'maintain') {
      const { data: weatherData, error: weatherError } = await supabase
        .from('weather_conditions')
        .select('weather_data')
        .eq('scenario_id', scenarioId)
        .single();
      
      if (!weatherError && weatherData && weatherData.weather_data) {
        const weatherCells = weatherData.weather_data;
        
        // Adjust weather intensity
        const adjustedCells = weatherCells.map((cell: any) => {
          if (adaptations.weather_intensity_adjustment === 'increase') {
            // Increase intensity
            if (cell.intensity === 'light') cell.intensity = 'moderate';
            else if (cell.intensity === 'moderate') cell.intensity = 'heavy';
            
            // Slightly increase size
            cell.size = Math.min(1, cell.size * 1.2);
          } else {
            // Decrease intensity
            if (cell.intensity === 'heavy') cell.intensity = 'moderate';
            else if (cell.intensity === 'moderate') cell.intensity = 'light';
            
            // Slightly decrease size
            cell.size = Math.max(0.1, cell.size * 0.8);
          }
          
          return cell;
        });
        
        await supabase
          .from('weather_conditions')
          .update({ weather_data: adjustedCells })
          .eq('scenario_id', scenarioId);
      }
    }
    
    // Apply communication frequency adjustment
    if (adaptations.communication_frequency_adjustment !== 'maintain') {
      // This would adjust the timing of future communications
      // For simplicity, we're not implementing this fully
      console.log(`Communication frequency adjustment: ${adaptations.communication_frequency_adjustment}`);
    }
  } catch (error) {
    console.error('Error applying adaptations:', error);
    throw new Error('Failed to apply adaptations');
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