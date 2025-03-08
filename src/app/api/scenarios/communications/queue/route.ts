import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/utils/logger';
import { db } from '@/lib/db';

const logger = createApiLogger('QueueRoute');

/**
 * GET handler for retrieving communications queue for a scenario
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const scenarioId = url.searchParams.get('scenarioId');
    const triggerTime = url.searchParams.get('triggerTime');
    
    if (!scenarioId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Scenario ID is required' 
        },
        { status: 400 }
      );
    }
    
    logger.info(`Getting communications queue for scenario ${scenarioId}...`);
    
    // For now, return mock data since we don't have the actual table
    // In a real implementation, this would query the database
    const mockCommunicationsQueue = [
      {
        id: 'queue-1',
        scenario_id: scenarioId,
        sender: 'ATC',
        message: 'Flight 123, traffic at your 2 o\'clock, 5 miles, Boeing 737, same altitude.',
        is_important: true,
        is_sent: false,
        trigger_time: 60, // seconds into scenario
        created_at: new Date().toISOString()
      },
      {
        id: 'queue-2',
        scenario_id: scenarioId,
        sender: 'CREW',
        message: 'Captain, we have a passenger with a medical emergency in the main cabin.',
        is_important: true,
        is_sent: false,
        trigger_time: 120, // seconds into scenario
        created_at: new Date().toISOString()
      }
    ];
    
    // Filter based on trigger time if provided
    let filteredQueue = [...mockCommunicationsQueue];
    
    if (triggerTime) {
      const elapsedSeconds = parseInt(triggerTime);
      filteredQueue = filteredQueue.filter(comm => 
        comm.trigger_time !== null && 
        comm.trigger_time <= elapsedSeconds &&
        !comm.is_sent
      );
    }
    
    logger.info(`Successfully retrieved communications queue for scenario ${scenarioId}`);
    
    return NextResponse.json({
      success: true,
      data: filteredQueue
    });
    
  } catch (error) {
    console.error('API route error getting communications queue:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve communications queue' 
      },
      { status: 500 }
    );
  }
} 