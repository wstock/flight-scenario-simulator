import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/utils/logger';
import { db } from '@/lib/db';

const logger = createApiLogger('CommunicationsRoute');

/**
 * GET handler for retrieving communications for a scenario
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const scenarioId = url.searchParams.get('scenarioId');
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit') || '50') : 50;
    
    if (!scenarioId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Scenario ID is required' 
        },
        { status: 400 }
      );
    }
    
    logger.info(`Getting communications for scenario ${scenarioId}...`);
    
    // For now, return mock data since we don't have the actual table
    // In a real implementation, this would query the database
    const mockCommunications = [
      {
        id: 'comm-1',
        scenario_id: scenarioId,
        sender: 'ATC',
        message: 'Flight 123, cleared for takeoff runway 27L.',
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        created_at: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: 'comm-2',
        scenario_id: scenarioId,
        sender: 'PILOT',
        message: 'Cleared for takeoff runway 27L, Flight 123.',
        timestamp: new Date(Date.now() - 280000).toISOString(), // 4.6 minutes ago
        created_at: new Date(Date.now() - 280000).toISOString()
      },
      {
        id: 'comm-3',
        scenario_id: scenarioId,
        sender: 'ATC',
        message: 'Flight 123, contact departure on 125.7.',
        timestamp: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
        created_at: new Date(Date.now() - 180000).toISOString()
      },
      {
        id: 'comm-4',
        scenario_id: scenarioId,
        sender: 'PILOT',
        message: 'Switching to departure 125.7, Flight 123.',
        timestamp: new Date(Date.now() - 170000).toISOString(), // 2.8 minutes ago
        created_at: new Date(Date.now() - 170000).toISOString()
      }
    ];
    
    logger.info(`Successfully retrieved communications for scenario ${scenarioId}`);
    
    return NextResponse.json({
      success: true,
      data: mockCommunications.slice(0, limit)
    });
    
  } catch (error) {
    console.error('API route error getting communications:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve communications' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for adding a new communication to a scenario
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId, sender, message } = body;
    
    if (!scenarioId || !sender || !message) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Scenario ID, sender, and message are required' 
        },
        { status: 400 }
      );
    }
    
    logger.info(`Adding communication for scenario ${scenarioId}...`);
    
    // For now, just return success since we don't have the actual table
    // In a real implementation, this would insert into the database
    const newCommunication = {
      id: `comm-${Date.now()}`,
      scenario_id: scenarioId,
      sender,
      message,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    logger.info(`Successfully added communication for scenario ${scenarioId}`);
    
    return NextResponse.json({
      success: true,
      data: newCommunication
    });
    
  } catch (error) {
    console.error('API route error adding communication:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add communication' 
      },
      { status: 500 }
    );
  }
} 