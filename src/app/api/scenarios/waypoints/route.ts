import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/utils/logger';
import { db } from '@/lib/db';

const logger = createApiLogger('WaypointsRoute');

/**
 * GET handler for retrieving waypoints for a scenario
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
    
    logger.info(`Getting waypoints for scenario ${scenarioId}...`);
    
    // For now, return mock data since we don't have the actual table
    // In a real implementation, this would query the database
    const mockWaypoints = [
      {
        id: 'waypoint-1',
        scenario_id: scenarioId,
        name: 'KORD',
        description: 'Chicago O\'Hare International Airport',
        latitude: 41.9786,
        longitude: -87.9048,
        altitude: 668,
        sequence: 1
      },
      {
        id: 'waypoint-2',
        scenario_id: scenarioId,
        name: 'KMDW',
        description: 'Chicago Midway International Airport',
        latitude: 41.7868,
        longitude: -87.7522,
        altitude: 620,
        sequence: 2
      },
      {
        id: 'waypoint-3',
        scenario_id: scenarioId,
        name: 'KPWK',
        description: 'Chicago Executive Airport',
        latitude: 42.1142,
        longitude: -87.9015,
        altitude: 647,
        sequence: 3
      }
    ];
    
    logger.info(`Successfully retrieved waypoints for scenario ${scenarioId}`);
    
    return NextResponse.json({
      success: true,
      data: mockWaypoints
    });
    
  } catch (error) {
    console.error('API route error getting waypoints:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve waypoints' 
      },
      { status: 500 }
    );
  }
} 