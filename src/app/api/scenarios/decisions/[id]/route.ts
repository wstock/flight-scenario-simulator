import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/utils/logger';
import { db } from '@/lib/db';

const logger = createApiLogger('DynamicRoute');

// Use correct config exports for Next.js 15+
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

/**
 * GET handler for retrieving a specific decision
 * Using the exact parameter style required by Next.js
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the ID directly from the destructured params
    const id = params.id;
    
    logger.info(`Getting decision ${id}...`);
    
    // For now, return mock data since we don't have the actual table
    // In a real implementation, this would query the database
    const mockDecision = {
      id,
      title: 'Weather Decision',
      description: 'How do you want to handle the approaching storm?',
      time_limit: 60, // seconds
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
    };
    
    logger.info(`Successfully retrieved decision ${id}`);
    
    return NextResponse.json({
      success: true,
      data: mockDecision
    });
    
  } catch (error) {
    logger.error('Error getting decision:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve decision' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating a decision
 * Using the exact parameter style required by Next.js
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the ID directly from the destructured params
    const id = params.id;
    const body = await request.json();
    const { timeLimit } = body;
    
    logger.info(`Updating decision ${id}...`);
    
    // For now, just return success since we don't have the actual table
    // In a real implementation, this would update the database
    
    logger.info(`Successfully updated decision ${id}`);
    
    return NextResponse.json({
      success: true,
      data: {
        id,
        time_limit: timeLimit
      }
    });
    
  } catch (error) {
    logger.error('Error updating decision:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update decision' 
      },
      { status: 500 }
    );
  }
} 
