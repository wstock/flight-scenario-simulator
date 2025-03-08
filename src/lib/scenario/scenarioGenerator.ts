import { generateAnthropicResponse } from '@/lib/anthropic';
import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/db';

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
          // Sanitize the JSON string before parsing
          const sanitized = sanitizeJsonString(match[0]);
          console.log('Found JSON-like structure, attempting to parse sanitized JSON...');
          return JSON.parse(sanitized);
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
          // Sanitize the JSON string before parsing
          const sanitized = sanitizeJsonString(match);
          console.log('Trying to parse largest JSON block (sanitized)...');
          return JSON.parse(sanitized);
        } catch (error) {
          console.error('Failed to parse JSON block:', error);
          // Continue to the next match
        }
      }
    }
    
    // Last resort: try to manually construct a valid JSON object
    try {
      console.log('Attempting to manually construct JSON from response...');
      const manualJson = constructJsonFromText(response);
      if (manualJson) {
        return manualJson;
      }
    } catch (manualError) {
      console.error('Failed to manually construct JSON:', manualError);
    }
    
    // If we get here, we couldn't find valid JSON
    console.error('Response content that failed to parse:', response);
    throw new Error('No valid JSON found in response');
  }
}

/**
 * Sanitizes a JSON string to fix common issues
 */
function sanitizeJsonString(jsonString: string): string {
  // Replace any trailing commas in arrays or objects
  let sanitized = jsonString.replace(/,\s*([\]}])/g, '$1');
  
  // Fix unescaped quotes within strings
  sanitized = sanitized.replace(/(?<=:\s*")(.+?)(?="[\s,}])/g, (match) => {
    return match.replace(/(?<!\\)"/g, '\\"');
  });
  
  // Fix missing quotes around property names
  sanitized = sanitized.replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
  
  return sanitized;
}

/**
 * Attempts to construct a valid JSON object from text by extracting key-value pairs
 */
function constructJsonFromText(text: string): any | null {
  const result: Record<string, any> = {};
  
  // Extract title
  const titleMatch = text.match(/title["\s:]+([^"]+)/i);
  if (titleMatch) result.title = titleMatch[1].trim();
  
  // Extract description
  const descMatch = text.match(/description["\s:]+([^"]+)/i);
  if (descMatch) result.description = descMatch[1].trim();
  
  // Extract aircraft
  const aircraftMatch = text.match(/aircraft["\s:]+([^"]+)/i);
  if (aircraftMatch) result.aircraft = aircraftMatch[1].trim();
  
  // Extract departure and arrival
  const departureMatch = text.match(/departure["\s:]+([^"]+)/i);
  if (departureMatch) result.departure = departureMatch[1].trim();
  
  const arrivalMatch = text.match(/arrival["\s:]+([^"]+)/i);
  if (arrivalMatch) result.arrival = arrivalMatch[1].trim();
  
  // Extract numeric values
  const altitudeMatch = text.match(/initial_altitude["\s:]+(\d+)/i);
  if (altitudeMatch) result.initial_altitude = parseInt(altitudeMatch[1]);
  
  const headingMatch = text.match(/initial_heading["\s:]+(\d+)/i);
  if (headingMatch) result.initial_heading = parseInt(headingMatch[1]);
  
  const fuelMatch = text.match(/initial_fuel["\s:]+(\d+)/i);
  if (fuelMatch) result.initial_fuel = parseInt(fuelMatch[1]);
  
  const maxFuelMatch = text.match(/max_fuel["\s:]+(\d+)/i);
  if (maxFuelMatch) result.max_fuel = parseInt(maxFuelMatch[1]);
  
  const burnRateMatch = text.match(/fuel_burn_rate["\s:]+(\d+)/i);
  if (burnRateMatch) result.fuel_burn_rate = parseInt(burnRateMatch[1]);
  
  // Set default values for required fields if missing
  if (!result.title) result.title = "Generated Scenario";
  if (!result.description) result.description = "Automatically generated flight scenario";
  if (!result.aircraft) result.aircraft = "Boeing 737-800";
  if (!result.departure) result.departure = "EGLL (London Heathrow)";
  if (!result.arrival) result.arrival = "EGCC (Manchester)";
  if (!result.initial_altitude) result.initial_altitude = 30000;
  if (!result.initial_heading) result.initial_heading = 360;
  if (!result.initial_fuel) result.initial_fuel = 15000;
  if (!result.max_fuel) result.max_fuel = 20000;
  if (!result.fuel_burn_rate) result.fuel_burn_rate = 50;
  
  // Add empty arrays for collections
  result.waypoints = [];
  result.weather_cells = [];
  result.decisions = [];
  result.communications = [];
  
  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Saves a generated scenario to the database
 */
export async function saveScenario(scenario: Scenario): Promise<string> {
  try {
    console.log('Saving scenario to database using Prisma...');
    
    // First, insert the main scenario record
    const scenarioRecord = await prisma.scenario.create({
      data: {
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
      },
    });
    
    const scenarioId = scenarioRecord.id;
    console.log(`Created scenario with ID: ${scenarioId}`);
    
    // Insert waypoints
    if (scenario.waypoints && scenario.waypoints.length > 0) {
      console.log(`Adding ${scenario.waypoints.length} waypoints...`);
      
      await prisma.waypoint.createMany({
        data: scenario.waypoints.map(waypoint => ({
          scenario_id: scenarioId,
          name: waypoint.name,
          position_x: waypoint.position_x,
          position_y: waypoint.position_y,
          sequence: waypoint.sequence,
          is_active: waypoint.is_active || false,
          is_passed: waypoint.is_passed || false,
          eta: waypoint.eta,
        })),
      });
    }
    
    // Insert weather cells
    if (scenario.weather_cells && scenario.weather_cells.length > 0) {
      console.log(`Adding weather conditions...`);
      
      await prisma.weatherCondition.create({
        data: {
          scenario_id: scenarioId,
          weather_data: scenario.weather_cells,
        },
      });
    }
    
    // Insert decisions
    if (scenario.decisions && scenario.decisions.length > 0) {
      console.log(`Adding ${scenario.decisions.length} decisions...`);
      
      for (const decision of scenario.decisions) {
        // Insert decision
        const decisionRecord = await prisma.decision.create({
          data: {
            scenario_id: scenarioId,
            title: decision.title,
            description: decision.description,
            time_limit: decision.time_limit,
            is_urgent: decision.is_urgent,
            trigger_condition: decision.trigger_condition,
            is_active: false, // Initially inactive
          },
        });
        
        // Insert decision options
        if (decision.options && decision.options.length > 0) {
          await prisma.decisionOption.createMany({
            data: decision.options.map(option => ({
              decision_id: decisionRecord.id,
              scenario_id: scenarioId,
              text: option.text,
              consequences: option.consequences,
              is_recommended: option.is_recommended || false,
            })),
          });
        }
      }
    }
    
    // Insert communications
    if (scenario.communications && scenario.communications.length > 0) {
      console.log(`Adding ${scenario.communications.length} communications...`);
      
      await prisma.communicationQueue.createMany({
        data: scenario.communications.map(comm => ({
          scenario_id: scenarioId,
          type: comm.type,
          sender: comm.sender,
          message: comm.message,
          is_important: comm.is_important || false,
          trigger_condition: comm.trigger_condition,
          is_sent: false, // Initially not sent
        })),
      });
    }
    
    console.log('Successfully saved scenario to database');
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