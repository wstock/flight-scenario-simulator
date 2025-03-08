import { createApiLogger } from '@/lib/utils/logger';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const logger = createApiLogger('Decision-nodesRoute');

from 'next/server';
import { db } from '@/lib/db';

/**
 * GET handler for retrieving decision nodes for a scenario
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const scenarioId = url.searchParams.get('scenarioId');
    const isActive = url.searchParams.get('isActive') === 'true';
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
    
    logger.info(`Getting decision nodes for scenario ${scenarioId}...`);
    
    // For now, return mock data since we don't have the actual table
    // In a real implementation, this would query the database
    const mockDecisionNodes = [
      {
        id: 'node-1',
        scenario_id: scenarioId,
        title: 'Engine Failure',
        description: 'The right engine has failed. What action will you take?',
        is_active: false,
        trigger_time: 120, // seconds into scenario
        options: [
          {
            id: 'node-1-option-1',
            node_id: 'node-1',
            text: 'Declare emergency and return to departure airport',
            impact: 'SAFETY'
          },
          {
            id: 'node-1-option-2',
            node_id: 'node-1',
            text: 'Continue to destination on single engine',
            impact: 'EFFICIENCY'
          }
        ]
      },
      {
        id: 'node-2',
        scenario_id: scenarioId,
        title: 'Weather Decision',
        description: 'Thunderstorms reported ahead. How will you proceed?',
        is_active: false,
        trigger_time: 300, // seconds into scenario
        options: [
          {
            id: 'node-2-option-1',
            node_id: 'node-2',
            text: 'Request deviation around weather',
            impact: 'SAFETY'
          },
          {
            id: 'node-2-option-2',
            node_id: 'node-2',
            text: 'Climb to higher altitude',
            impact: 'EFFICIENCY'
          }
        ]
      }
    ];
    
    // Filter based on query parameters
    let filteredNodes = [...mockDecisionNodes];
    
    if (isActive !== undefined) {
      filteredNodes = filteredNodes.filter(node => node.is_active === isActive);
    }
    
    if (triggerTime) {
      // Handle trigger_time filtering based on the query parameter
      // This is a simplified version of what might be more complex logic
      const elapsedSeconds = parseInt(triggerTime);
      filteredNodes = filteredNodes.filter(node => 
        node.trigger_time !== null && node.trigger_time <= elapsedSeconds
      );
    }
    
    logger.info(`Successfully retrieved decision nodes for scenario ${scenarioId}`);
    
    return NextResponse.json({
      success: true,
      data: filteredNodes
    });
    
  } catch (error) {
    console.error('API route error getting decision nodes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve decision nodes' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating a decision node's active status
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId, nodeId, isActive } = body;
    
    if (!scenarioId || !nodeId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Scenario ID and Node ID are required' 
        },
        { status: 400 }
      );
    }
    
    logger.info(`Updating decision node ${nodeId} for scenario ${scenarioId}...`);
    
    // For now, just return success since we don't have the actual table
    // In a real implementation, this would update the database
    
    logger.info(`Successfully updated decision node ${nodeId} for scenario ${scenarioId}`);
    
    return NextResponse.json({
      success: true,
      data: {
        id: nodeId,
        scenario_id: scenarioId,
        is_active: isActive
      }
    });
    
  } catch (error) {
    console.error('API route error updating decision node:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update decision node' 
      },
      { status: 500 }
    );
  }
} 
