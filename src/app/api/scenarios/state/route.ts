import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET handler for retrieving scenario state
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
    
    console.log(`API route: Getting state for scenario ${scenarioId}...`);
    
    // For now, return mock data since we don't have the actual table
    // In a real implementation, this would query the database
    const mockState = {
      id: 'state-1',
      scenario_id: scenarioId,
      current_safety_score: 85,
      current_efficiency_score: 75,
      current_passenger_comfort_score: 90,
      time_deviation: 5, // minutes
      fuel_remaining: 12000, // pounds
      created_at: new Date().toISOString()
    };
    
    console.log(`API route: Successfully retrieved state for scenario ${scenarioId}`);
    
    return NextResponse.json({
      success: true,
      data: mockState
    });
    
  } catch (error) {
    console.error('API route error getting scenario state:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve scenario state' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new scenario state
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      scenarioId, 
      safetyScore, 
      efficiencyScore, 
      passengerComfortScore, 
      timeDeviation, 
      fuelRemaining 
    } = body;
    
    if (!scenarioId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Scenario ID is required' 
        },
        { status: 400 }
      );
    }
    
    console.log(`API route: Creating state for scenario ${scenarioId}...`);
    
    // For now, just return success since we don't have the actual table
    // In a real implementation, this would insert into the database
    const newState = {
      id: `state-${Date.now()}`,
      scenario_id: scenarioId,
      current_safety_score: safetyScore || 100,
      current_efficiency_score: efficiencyScore || 100,
      current_passenger_comfort_score: passengerComfortScore || 100,
      time_deviation: timeDeviation || 0,
      fuel_remaining: fuelRemaining || 15000,
      created_at: new Date().toISOString()
    };
    
    console.log(`API route: Successfully created state for scenario ${scenarioId}`);
    
    return NextResponse.json({
      success: true,
      data: newState
    });
    
  } catch (error) {
    console.error('API route error creating scenario state:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create scenario state' 
      },
      { status: 500 }
    );
  }
} 