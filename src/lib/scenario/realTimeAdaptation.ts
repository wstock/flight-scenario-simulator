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
    const response = await fetch(`/api/scenarios/timing?scenarioId=${scenarioId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get scenario timing');
    }
    
    return data.timing;
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
    const response = await fetch('/api/scenarios/timing', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenarioId,
        elapsedSeconds,
        isPaused
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update scenario timing');
    }
    
    return data.timing;
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
 * Processes a tick for real-time scenario adaptation
 */
export async function processScenarioTick(scenarioId: string, secondsElapsed: number): Promise<void> {
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
    try {
      await simulateContinuousChanges(scenarioId, secondsElapsed);
    } catch (error) {
      console.warn(`Error simulating continuous changes, continuing with scenario: ${error}`);
      // Continue with the scenario even if parameter simulation fails
    }
    
    // Check for time-based triggers
    await checkTimeTriggers(scenarioId, newElapsedSeconds);
    
    // Check for communications to send
    await checkCommunicationsTriggers(scenarioId, newElapsedSeconds);
  } catch (error) {
    console.error('Error processing scenario tick:', error);
    // Don't throw here, just log the error
    console.warn('Continuing scenario despite error');
  }
}

/**
 * Checks for time-based triggers
 */
async function checkTimeTriggers(scenarioId: string, elapsedSeconds: number): Promise<void> {
  try {
    // Check for decision nodes that should be triggered based on time
    const response = await fetch(`/api/scenarios/decision-nodes?scenarioId=${scenarioId}&isActive=false&triggerTime=${elapsedSeconds}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to check time triggers');
    }
    
    // Activate any nodes that should be triggered
    for (const node of result.data || []) {
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
    const response = await fetch(`/api/scenarios/communications/queue?scenarioId=${scenarioId}&triggerTime=${elapsedSeconds}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to check communications triggers');
    }
    
    // Send any communications that should be triggered
    for (const comm of result.data || []) {
      // Mark as sent
      await fetch(`/api/scenarios/communications/queue/${comm.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_sent: true
        }),
      });
      
      // Copy to actual communications
      await fetch('/api/scenarios/communications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioId: comm.scenario_id,
          sender: comm.sender,
          message: comm.message,
          isImportant: comm.is_important,
        }),
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
    const stateResponse = await fetch(`/api/scenarios/state?scenarioId=${scenarioId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!stateResponse.ok) {
      throw new Error(`HTTP error! status: ${stateResponse.status}`);
    }
    
    const stateResult = await stateResponse.json();
    
    if (!stateResult.success || !stateResult.data) {
      return; // No state to adapt
    }
    
    const stateData = stateResult.data;
    
    // Get decision history
    const decisionsResponse = await fetch(`/api/scenarios/decisions/responses?scenarioId=${scenarioId}&limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!decisionsResponse.ok) {
      throw new Error(`HTTP error! status: ${decisionsResponse.status}`);
    }
    
    const decisionsResult = await decisionsResponse.json();
    
    if (!decisionsResult.success) {
      throw new Error(decisionsResult.error || 'Failed to get decision responses');
    }
    
    const decisionsData = decisionsResult.data || [];
    
    // Calculate performance metrics
    let recommendedChoices = 0;
    let totalChoices = decisionsData.length || 0;
    
    for (const decision of decisionsData) {
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
    await fetch('/api/scenarios/adaptations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenarioId,
        adaptations,
      }),
    });
    
    // Apply difficulty adjustment to future decisions
    if (adaptations.difficulty_adjustment !== 'maintain') {
      // Get pending decisions
      const nodesResponse = await fetch(`/api/scenarios/decision-nodes?scenarioId=${scenarioId}&isActive=false`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!nodesResponse.ok) {
        throw new Error(`HTTP error! status: ${nodesResponse.status}`);
      }
      
      const nodesResult = await nodesResponse.json();
      
      if (!nodesResult.success) {
        throw new Error(nodesResult.error || 'Failed to get decision nodes');
      }
      
      // Adjust time limits based on difficulty
      for (const node of nodesResult.data || []) {
        if (node.decision_id) {
          const decisionResponse = await fetch(`/api/scenarios/decisions/${node.decision_id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!decisionResponse.ok) continue;
          
          const decisionResult = await decisionResponse.json();
          
          if (!decisionResult.success) continue;
          
          const decisionData = decisionResult.data;
          
          let timeLimit = decisionData.time_limit;
          if (timeLimit && adaptations.time_pressure_adjustment !== 'maintain') {
            // Adjust time limit
            const factor = adaptations.time_pressure_adjustment === 'increase' ? 0.8 : 1.2;
            timeLimit = Math.round(timeLimit * factor);
            
            await fetch(`/api/scenarios/decisions/${node.decision_id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                timeLimit
              }),
            });
          }
        }
      }
    }
    
    // Apply weather intensity adjustment
    if (adaptations.weather_intensity_adjustment !== 'maintain') {
      const weatherResponse = await fetch(`/api/scenarios/weather?scenarioId=${scenarioId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (weatherResponse.ok) {
        const weatherResult = await weatherResponse.json();
        
        if (weatherResult.success && weatherResult.data && weatherResult.data.weather_data) {
          const weatherCells = weatherResult.data.weather_data;
          
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
          
          await fetch(`/api/scenarios/weather`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              scenarioId,
              weatherData: adjustedCells
            }),
          });
        }
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