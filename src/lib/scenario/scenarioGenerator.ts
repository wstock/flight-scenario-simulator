import { generateAnthropicResponse } from '@/lib/anthropic';
import { supabase } from '@/lib/supabase';

export interface ScenarioParams {
  aircraft: string;
  departure: string;
  arrival: string;
  weather: 'clear' | 'rain' | 'snow' | 'fog' | 'thunderstorm';
  complexity: 'low' | 'medium' | 'high';
  duration: number; // in minutes
}

export interface Waypoint {
  name: string;
  position_x: number;
  position_y: number;
  sequence: number;
  is_active?: boolean;
  is_passed?: boolean;
  eta?: string;
}

export interface WeatherCell {
  intensity: 'light' | 'moderate' | 'heavy';
  position: {
    x: number;
    y: number;
  };
  size: number;
}

export interface Decision {
  title: string;
  description: string;
  time_limit?: number;
  is_urgent: boolean;
  options: Array<{
    text: string;
    consequences: string;
    is_recommended?: boolean;
  }>;
  trigger_condition: string;
}

export interface Communication {
  type: 'atc' | 'crew' | 'system';
  sender: string;
  message: string;
  is_important?: boolean;
  trigger_condition: string;
}

export interface Scenario {
  id?: string;
  title: string;
  description: string;
  aircraft: string;
  departure: string;
  arrival: string;
  initial_altitude: number;
  initial_heading: number;
  initial_fuel: number;
  max_fuel: number;
  fuel_burn_rate: number;
  waypoints: Waypoint[];
  weather_cells: WeatherCell[];
  decisions: Decision[];
  communications: Communication[];
}

/**
 * Generates a flight scenario using Anthropic API based on provided parameters
 */
export async function generateScenario(params: ScenarioParams): Promise<Scenario> {
  const prompt = `
    Generate a detailed flight scenario for a ${params.aircraft} flying from ${params.departure} to ${params.arrival}.
    The weather conditions are ${params.weather} and the scenario complexity should be ${params.complexity}.
    The scenario should last approximately ${params.duration} minutes.
    
    Please provide the scenario in the following JSON format:
    
    {
      "title": "Brief title of the scenario",
      "description": "Detailed description of the scenario setup",
      "aircraft": "${params.aircraft}",
      "departure": "${params.departure}",
      "arrival": "${params.arrival}",
      "initial_altitude": number (in feet),
      "initial_heading": number (in degrees),
      "initial_fuel": number (in pounds),
      "max_fuel": number (in pounds),
      "fuel_burn_rate": number (in pounds per minute),
      "waypoints": [
        {
          "name": "Waypoint identifier",
          "position_x": number (between -1 and 1, relative to center of display),
          "position_y": number (between -1 and 1, relative to center of display),
          "sequence": number (order in flight path),
          "is_active": boolean (optional),
          "is_passed": boolean (optional),
          "eta": "HH:MM" (optional)
        }
      ],
      "weather_cells": [
        {
          "intensity": "light" | "moderate" | "heavy",
          "position": {
            "x": number (between -1 and 1),
            "y": number (between -1 and 1)
          },
          "size": number (between 0 and 1)
        }
      ],
      "decisions": [
        {
          "title": "Brief decision title",
          "description": "Detailed description of the decision to be made",
          "time_limit": number (in seconds, optional),
          "is_urgent": boolean,
          "options": [
            {
              "text": "Option text",
              "consequences": "Description of what happens if this option is chosen",
              "is_recommended": boolean (optional)
            }
          ],
          "trigger_condition": "Description of when this decision should be triggered"
        }
      ],
      "communications": [
        {
          "type": "atc" | "crew" | "system",
          "sender": "Name or identifier of sender",
          "message": "The communication message",
          "is_important": boolean (optional),
          "trigger_condition": "Description of when this communication should be triggered"
        }
      ]
    }
    
    Make sure the scenario is realistic and challenging, with appropriate waypoints, weather conditions, decisions, and communications based on the complexity level.
    For ${params.complexity} complexity, include at least ${params.complexity === 'low' ? '1-2' : params.complexity === 'medium' ? '3-4' : '5-6'} decision points.
    The weather should reflect ${params.weather} conditions with appropriate weather cells.
    Include realistic communications between ATC and crew throughout the flight.
  `;

  try {
    // Generate scenario using Anthropic API
    const response = await generateAnthropicResponse([
      { role: 'user', content: prompt }
    ]);

    // Parse JSON from response
    const scenarioData = extractJsonFromResponse(response);
    
    return scenarioData as Scenario;
  } catch (error) {
    console.error('Error generating scenario:', error);
    throw new Error('Failed to generate scenario');
  }
}

/**
 * Extracts JSON from a text response
 */
function extractJsonFromResponse(response: string): any {
  try {
    // Try to parse the entire response as JSON
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
    throw new Error('No valid JSON found in response');
  }
}

/**
 * Saves a generated scenario to Supabase
 */
export async function saveScenario(scenario: Scenario): Promise<string> {
  try {
    // First, insert the main scenario record
    const { data: scenarioData, error: scenarioError } = await supabase
      .from('scenarios')
      .insert({
        title: scenario.title,
        description: scenario.description,
        aircraft: scenario.aircraft,
        departure: scenario.departure,
        arrival: scenario.arrival,
        initial_altitude: scenario.initial_altitude,
        initial_heading: scenario.initial_heading,
        initial_fuel: scenario.initial_fuel,
        max_fuel: scenario.max_fuel,
        fuel_burn_rate: scenario.fuel_burn_rate,
      })
      .select('id')
      .single();

    if (scenarioError) throw scenarioError;
    
    const scenarioId = scenarioData.id;
    
    // Insert waypoints
    if (scenario.waypoints && scenario.waypoints.length > 0) {
      const waypointsWithScenarioId = scenario.waypoints.map(waypoint => ({
        ...waypoint,
        scenario_id: scenarioId,
      }));
      
      const { error: waypointsError } = await supabase
        .from('waypoints')
        .insert(waypointsWithScenarioId);
      
      if (waypointsError) throw waypointsError;
    }
    
    // Insert weather cells
    if (scenario.weather_cells && scenario.weather_cells.length > 0) {
      const { error: weatherError } = await supabase
        .from('weather_conditions')
        .insert({
          scenario_id: scenarioId,
          weather_data: scenario.weather_cells,
        });
      
      if (weatherError) throw weatherError;
    }
    
    // Insert decisions
    if (scenario.decisions && scenario.decisions.length > 0) {
      for (const decision of scenario.decisions) {
        // Insert decision
        const { data: decisionData, error: decisionError } = await supabase
          .from('decisions')
          .insert({
            scenario_id: scenarioId,
            title: decision.title,
            description: decision.description,
            time_limit: decision.time_limit,
            is_urgent: decision.is_urgent,
            trigger_condition: decision.trigger_condition,
            is_active: false, // Initially inactive
          })
          .select('id')
          .single();
        
        if (decisionError) throw decisionError;
        
        // Insert decision options
        if (decision.options && decision.options.length > 0) {
          const optionsWithDecisionId = decision.options.map(option => ({
            decision_id: decisionData.id,
            scenario_id: scenarioId,
            text: option.text,
            consequences: option.consequences,
            is_recommended: option.is_recommended || false,
          }));
          
          const { error: optionsError } = await supabase
            .from('decision_options')
            .insert(optionsWithDecisionId);
          
          if (optionsError) throw optionsError;
        }
      }
    }
    
    // Insert communications
    if (scenario.communications && scenario.communications.length > 0) {
      const communicationsWithScenarioId = scenario.communications.map(comm => ({
        scenario_id: scenarioId,
        type: comm.type,
        sender: comm.sender,
        message: comm.message,
        is_important: comm.is_important || false,
        trigger_condition: comm.trigger_condition,
        is_sent: false, // Initially not sent
      }));
      
      const { error: commsError } = await supabase
        .from('communications_queue')
        .insert(communicationsWithScenarioId);
      
      if (commsError) throw commsError;
    }
    
    return scenarioId;
  } catch (error) {
    console.error('Error saving scenario:', error);
    throw new Error('Failed to save scenario');
  }
}

/**
 * Generates a flight scenario using Anthropic API based on a natural language prompt
 * This function can be called from both client and server components
 */
export async function generateScenarioFromPrompt(promptText: string): Promise<string> {
  const prompt = `
    Generate a detailed flight scenario based on the following description: "${promptText}".
    
    Please provide the scenario in the following JSON format:
    
    {
      "title": "Brief title of the scenario",
      "description": "Detailed description of the scenario setup",
      "aircraft": "Aircraft type (e.g., Boeing 737, Airbus A320)",
      "departure": "Departure airport code and name",
      "arrival": "Arrival airport code and name",
      "initial_altitude": number (in feet),
      "initial_heading": number (in degrees),
      "initial_fuel": number (in pounds),
      "max_fuel": number (in pounds),
      "fuel_burn_rate": number (in pounds per minute),
      "waypoints": [
        {
          "name": "Waypoint identifier",
          "position_x": number (between -1 and 1, relative to center of display),
          "position_y": number (between -1 and 1, relative to center of display),
          "sequence": number (order in flight path),
          "is_active": boolean (optional),
          "is_passed": boolean (optional),
          "eta": "HH:MM" (optional)
        }
      ],
      "weather_cells": [
        {
          "intensity": "light" | "moderate" | "heavy",
          "position": {
            "x": number (between -1 and 1),
            "y": number (between -1 and 1)
          },
          "size": number (between 0 and 1)
        }
      ],
      "decisions": [
        {
          "title": "Brief decision title",
          "description": "Detailed description of the decision to be made",
          "time_limit": number (in seconds, optional),
          "is_urgent": boolean,
          "options": [
            {
              "text": "Option text",
              "consequences": "Description of what happens if this option is chosen",
              "is_recommended": boolean (optional)
            }
          ],
          "trigger_condition": "Description of when this decision should be triggered"
        }
      ],
      "communications": [
        {
          "type": "atc" | "crew" | "system",
          "sender": "Name or identifier of sender",
          "message": "The communication message",
          "is_important": boolean (optional),
          "trigger_condition": "Description of when this communication should be triggered"
        }
      ]
    }
    
    Make sure the scenario is realistic and challenging, with appropriate waypoints, weather conditions, decisions, and communications.
    Include at least 3-4 decision points that are relevant to the scenario.
    Include realistic communications between ATC and crew throughout the flight.
    If the prompt mentions specific weather conditions, make sure to include appropriate weather cells.
    If the prompt mentions a specific airport or location, use realistic waypoints and routes for that area.
    If the prompt mentions a specific aircraft type, use realistic parameters for that aircraft.
    If the prompt doesn't specify certain details, use your judgment to create a coherent and realistic scenario.
  `;

  try {
    // Generate scenario using Anthropic API via the anthropic.ts module
    // which handles client/server environment differences
    const response = await generateAnthropicResponse([
      { role: 'user', content: prompt }
    ]);

    // Parse JSON from response
    const scenarioData = extractJsonFromResponse(response);
    
    // Save the scenario to the database
    const scenarioId = await saveScenario(scenarioData);
    
    return scenarioId;
  } catch (error) {
    console.error('Error generating scenario from prompt:', error);
    throw new Error('Failed to generate scenario from prompt');
  }
} 