import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createApiLogger } from '@/lib/utils/logger';

const logger = createApiLogger('ScenarioRoute');

// Use correct config exports for Next.js 15+
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

/**
 * GET handler for retrieving a specific scenario by ID
 * Using the exact parameter style required by Next.js
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Ensure params are properly awaited when accessed
    const { id } = context.params;
    logger.info(`Loading scenario ${id}...`);
    
    // Fetch the main scenario data
    const scenarioData = await (db as any).scenario.findUnique({
      where: { id },
      include: {
        waypoints: {
          orderBy: { sequence: 'asc' }
        },
        weatherConditions: true,
        decisions: {
          include: {
            options: true
          }
        },
        communicationQueue: true
      }
    });
    
    if (!scenarioData) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Scenario with ID ${id} not found` 
        },
        { status: 404 }
      );
    }
    
    // Format weather cells
    const weatherCells = (scenarioData.weatherConditions || []).map((wc: any) => {
      try {
        return JSON.parse(wc.weather_data.toString());
      } catch (e) {
        logger.error('Error parsing weather data:', e);
        return {
          intensity: 'light',
          position: { x: 0, y: 0 },
          size: 1
        };
      }
    });
    
    // Prepare the response
    const scenario = {
      id: scenarioData.id,
      title: scenarioData.title,
      description: scenarioData.description,
      aircraft: scenarioData.aircraft,
      departure: scenarioData.departure,
      arrival: scenarioData.arrival,
      initial_altitude: scenarioData.initial_altitude,
      initial_heading: scenarioData.initial_heading,
      initial_fuel: scenarioData.initial_fuel,
      max_fuel: scenarioData.max_fuel,
      fuel_burn_rate: scenarioData.fuel_burn_rate,
      waypoints: scenarioData.waypoints,
      weather_cells: weatherCells,
      decisions: scenarioData.decisions.map((decision: any) => ({
        title: decision.title,
        description: decision.description,
        time_limit: decision.time_limit || undefined,
        is_urgent: decision.is_urgent,
        trigger_condition: decision.trigger_condition,
        options: (decision.options || []).map((option: any) => ({
          text: option.text,
          consequences: option.consequences,
          is_recommended: option.is_recommended || false,
        })),
      })),
      communications: scenarioData.communicationQueue.map((comm: any) => ({
        type: comm.type,
        sender: comm.sender,
        message: comm.message,
        is_important: comm.is_important || false,
        trigger_condition: comm.trigger_condition,
      })),
    };
    
    logger.info(`Successfully loaded scenario ${id}`);
    
    return NextResponse.json({ 
      success: true, 
      scenario 
    });
  } catch (error) {
    logger.error('Error loading scenario:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load scenario' 
      },
      { status: 500 }
    );
  }
} 