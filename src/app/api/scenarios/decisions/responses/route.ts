import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/utils/logger';
import { db } from '@/lib/db';

const logger = createApiLogger('ResponsesRoute');

/**
 * GET handler for retrieving decision responses for a scenario
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const scenarioId = url.searchParams.get('scenarioId');
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit') || '5') : 5;
    
    if (!scenarioId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Scenario ID is required' 
        },
        { status: 400 }
      );
    }
    
    logger.info(`Getting decision responses for scenario ${scenarioId}...`);
    
    // For now, return mock data since we don't have the actual table
    // In a real implementation, this would query the database
    const mockResponses = [
      {
        id: 'response-1',
        scenario_id: scenarioId,
        decision_id: 'decision-1',
        option_id: 'option-1',
        created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        decisions: {
          id: 'decision-1',
          title: 'Weather Decision',
          description: 'How do you want to handle the approaching storm?',
          decision_options: [
            {
              id: 'option-1',
              text: 'Divert to alternate airport',
              consequences: 'Safer but less efficient',
              is_recommended: true
            },
            {
              id: 'option-2',
              text: 'Continue as planned',
              consequences: 'More efficient but potentially less safe',
              is_recommended: false
            }
          ]
        }
      },
      {
        id: 'response-2',
        scenario_id: scenarioId,
        decision_id: 'decision-2',
        option_id: 'option-4',
        created_at: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
        decisions: {
          id: 'decision-2',
          title: 'Fuel Decision',
          description: 'How do you want to handle the fuel situation?',
          decision_options: [
            {
              id: 'option-3',
              text: 'Request priority landing',
              consequences: 'Safer but disrupts traffic flow',
              is_recommended: true
            },
            {
              id: 'option-4',
              text: 'Continue in holding pattern',
              consequences: 'More efficient for ATC but uses more fuel',
              is_recommended: false
            }
          ]
        }
      }
    ];
    
    logger.info(`Successfully retrieved decision responses for scenario ${scenarioId}`);
    
    return NextResponse.json({
      success: true,
      data: mockResponses.slice(0, limit)
    });
    
  } catch (error) {
    console.error('API route error getting decision responses:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve decision responses' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new decision response
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioId, decisionId, optionId } = body;
    
    if (!scenarioId || !decisionId || !optionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Scenario ID, decision ID, and option ID are required' 
        },
        { status: 400 }
      );
    }
    
    logger.info(`Creating decision response for scenario ${scenarioId}...`);
    
    // For now, just return success since we don't have the actual table
    // In a real implementation, this would insert into the database
    const newResponse = {
      id: `response-${Date.now()}`,
      scenario_id: scenarioId,
      decision_id: decisionId,
      option_id: optionId,
      created_at: new Date().toISOString()
    };
    
    logger.info(`Successfully created decision response for scenario ${scenarioId}`);
    
    return NextResponse.json({
      success: true,
      data: newResponse
    });
    
  } catch (error) {
    console.error('API route error creating decision response:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create decision response' 
      },
      { status: 500 }
    );
  }
} 