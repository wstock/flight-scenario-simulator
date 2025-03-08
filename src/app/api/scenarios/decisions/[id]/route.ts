import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET handler for retrieving a specific decision
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    console.log(`API route: Getting decision ${id}...`);
    
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
    
    console.log(`API route: Successfully retrieved decision ${id}`);
    
    return NextResponse.json({
      success: true,
      data: mockDecision
    });
    
  } catch (error) {
    console.error('API route error getting decision:', error);
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
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    const { timeLimit } = body;
    
    console.log(`API route: Updating decision ${id}...`);
    
    // For now, just return success since we don't have the actual table
    // In a real implementation, this would update the database
    
    console.log(`API route: Successfully updated decision ${id}`);
    
    return NextResponse.json({
      success: true,
      data: {
        id,
        time_limit: timeLimit
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