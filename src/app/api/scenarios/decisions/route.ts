import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET handler for retrieving active decisions for a scenario
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const scenarioId = url.searchParams.get('scenarioId');
    const isActive = url.searchParams.get('isActive') === 'true';
    
    if (!scenarioId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Scenario ID is required' 
        },
        { status: 400 }
      );
    }
    
    console.log(`API route: Getting ${isActive ? 'active' : 'all'} decisions for scenario ${scenarioId}...`);
    
    // For now, return mock data since we don't have the actual table
    // In a real implementation, this would query the database
    const mockDecisions = [
      {
        id: 'decision-1',
        scenario_id: scenarioId,
        title: 'Weather Decision',
        description: 'How do you want to handle the approaching storm?',
        is_active: isActive,
        trigger_time: 60, // seconds into scenario
        options: [
          {
            id: 'option-1',
            decision_id: 'decision-1',
            text: 'Divert to alternate airport',
            impact: 'SAFETY'
          },
          {
            id: 'option-2',
            decision_id: 'decision-1',
            text: 'Continue as planned',
            impact: 'EFFICIENCY'
          }
        ]
      }
    ];
    
    console.log(`API route: Successfully retrieved decisions for scenario ${scenarioId}`);
    
    return NextResponse.json({
      success: true,
      data: mockDecisions
    });
    
  } catch (error) {
    console.error('API route error getting decisions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve decisions' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating a decision's active status
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId, decisionId, isActive } = body;
    
    if (!scenarioId || !decisionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Scenario ID and Decision ID are required' 
        },
        { status: 400 }
      );
    }
    
    console.log(`API route: Updating decision ${decisionId} for scenario ${scenarioId}...`);
    
    // For now, just return success since we don't have the actual table
    // In a real implementation, this would update the database
    
    console.log(`API route: Successfully updated decision ${decisionId} for scenario ${scenarioId}`);
    
    return NextResponse.json({
      success: true,
      data: {
        id: decisionId,
        scenario_id: scenarioId,
        is_active: isActive
      }
    });
    
  } catch (error) {
    console.error('API route error updating decision:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update decision' 
      },
      { status: 500 }
    );
  }
} 