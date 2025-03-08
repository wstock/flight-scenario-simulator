import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET handler for retrieving scenario parameters
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const scenarioId = url.searchParams.get('scenarioId');
    
    if (!scenarioId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Scenario ID is required' 
        },
        { status: 400 }
      );
    }
    
    console.log(`API route: Getting parameters for scenario ${scenarioId}...`);
    
    // Check if the scenario exists
    const scenario = await (db as any).scenario.findUnique({
      where: { id: scenarioId },
      select: { 
        id: true,
        initial_altitude: true,
        initial_heading: true,
        initial_fuel: true,
        fuel_burn_rate: true
      }
    });
    
    if (!scenario) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Scenario with ID ${scenarioId} not found` 
        },
        { status: 404 }
      );
    }
    
    // Return the parameters
    const parameters = {
      scenario_id: scenarioId,
      latitude: 37.6213, // Default values
      longitude: -122.3790,
      altitude: scenario.initial_altitude,
      heading: scenario.initial_heading,
      speed: 250, // Default speed in knots
      vertical_speed: 0, // Default vertical speed
      fuel: scenario.initial_fuel,
      fuel_burn_rate: scenario.fuel_burn_rate
    };
    
    console.log(`API route: Successfully retrieved parameters for scenario ${scenarioId}`);
    
    return NextResponse.json({ 
      success: true, 
      parameters 
    });
  } catch (error) {
    console.error('API route: Error getting scenario parameters:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get scenario parameters' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating scenario parameters
 */
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    const { scenarioId, changes } = data;
    
    if (!scenarioId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Scenario ID is required' 
        },
        { status: 400 }
      );
    }
    
    if (!changes) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Parameter changes are required' 
        },
        { status: 400 }
      );
    }
    
    console.log(`API route: Updating parameters for scenario ${scenarioId}...`);
    
    // Check if the scenario exists
    const scenario = await (db as any).scenario.findUnique({
      where: { id: scenarioId },
      select: { id: true }
    });
    
    if (!scenario) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Scenario with ID ${scenarioId} not found` 
        },
        { status: 404 }
      );
    }
    
    // In a real implementation, we would update the parameters in the database
    // For now, we'll just return the updated parameters
    
    // Get the current parameters (in a real implementation, this would come from the database)
    const currentParameters = {
      scenario_id: scenarioId,
      latitude: 37.6213,
      longitude: -122.3790,
      altitude: 30000,
      heading: 270,
      speed: 250,
      vertical_speed: 0,
      fuel: 15000,
      fuel_burn_rate: 50
    };
    
    // Apply the changes
    const updatedParameters = {
      ...currentParameters,
      ...changes
    };
    
    console.log(`API route: Successfully updated parameters for scenario ${scenarioId}`);
    
    return NextResponse.json({ 
      success: true, 
      parameters: updatedParameters 
    });
  } catch (error) {
    console.error('API route: Error updating scenario parameters:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update scenario parameters' 
      },
      { status: 500 }
    );
  }
} 