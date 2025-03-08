import { NextRequest, NextResponse }
import { createApiLogger } from '@/lib/utils/logger';  const logger = createApiLogger('TimingRoute');
from 'next/server';
import { db } from '@/lib/db';

/**
 * GET handler for retrieving scenario timing
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
    
    logger.info(`Getting timing for scenario ${scenarioId}...`);
    
    // Check if the scenario exists and is active
    const scenario = await (db as any).scenario.findUnique({
      where: { id: scenarioId },
      select: { 
        id: true,
        is_active: true,
        created_at: true
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
    
    if (!scenario.is_active) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Scenario with ID ${scenarioId} is not active` 
        },
        { status: 400 }
      );
    }
    
    // Return the timing information
    const timing = {
      scenario_id: scenarioId,
      start_time: scenario.created_at,
      last_update_time: new Date().toISOString(),
      is_paused: false,
      elapsed_seconds: 0 // Default to 0, this would be updated in a real implementation
    };
    
    logger.info(`Successfully retrieved timing for scenario ${scenarioId}`);
    
    return NextResponse.json({ 
      success: true, 
      timing 
    });
  } catch (error) {
    logger.error('Error getting scenario timing:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get scenario timing' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating scenario timing
 */
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    const { scenarioId, elapsedSeconds, isPaused } = data;
    
    if (!scenarioId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Scenario ID is required' 
        },
        { status: 400 }
      );
    }
    
    logger.info(`Updating timing for scenario ${scenarioId}...`);
    
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
    
    // Update the scenario's active status based on isPaused
    await (db as any).scenario.update({
      where: { id: scenarioId },
      data: { is_active: !isPaused }
    });
    
    // Return the updated timing information
    const timing = {
      scenario_id: scenarioId,
      start_time: new Date().toISOString(),
      last_update_time: new Date().toISOString(),
      is_paused: isPaused || false,
      elapsed_seconds: elapsedSeconds || 0
    };
    
    logger.info(`Successfully updated timing for scenario ${scenarioId}`);
    
    return NextResponse.json({ 
      success: true, 
      timing 
    });
  } catch (error) {
    logger.error('Error updating scenario timing:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update scenario timing' 
      },
      { status: 500 }
    );
  }
} 