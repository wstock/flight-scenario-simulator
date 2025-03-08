import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET handler for listing scenarios
 */
export async function GET(req: NextRequest) {
  try {
    console.log('API route: Listing scenarios...');
    
    const scenarios = await (db as any).scenario.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    console.log(`API route: Found ${scenarios.length} scenarios`);
    
    return NextResponse.json({ 
      success: true, 
      scenarios 
    });
  } catch (error) {
    console.error('API route: Error listing scenarios:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to list scenarios' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for saving a new scenario
 */
export async function POST(req: NextRequest) {
  try {
    console.log('API route: Saving scenario to database...');
    
    // Parse the request body
    const data = await req.json();
    
    // Validate required fields
    if (!data.title) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Scenario title is required' 
        },
        { status: 400 }
      );
    }
    
    // Create the main scenario record
    const scenario = await (db as any).scenario.create({
      data: {
        title: data.title,
        description: data.description || '',
        aircraft: data.aircraft || 'Boeing 737-800',
        departure: data.departure || 'KJFK',
        arrival: data.arrival || 'KLAX',
        initial_altitude: data.initial_altitude || 30000,
        initial_heading: data.initial_heading || 270,
        initial_fuel: data.initial_fuel || 15000,
        max_fuel: data.max_fuel || 20000,
        fuel_burn_rate: data.fuel_burn_rate || 50,
      }
    });
    
    console.log(`API route: Created scenario with ID: ${scenario.id}`);
    
    // Create waypoints if provided
    if (data.waypoints && Array.isArray(data.waypoints)) {
      for (const waypoint of data.waypoints) {
        await (db as any).waypoint.create({
          data: {
            scenario_id: scenario.id,
            name: waypoint.name || 'Waypoint',
            position_x: waypoint.position_x || 0,
            position_y: waypoint.position_y || 0,
            sequence: waypoint.sequence || 0,
            is_active: waypoint.is_active || false,
            is_passed: waypoint.is_passed || false,
            eta: waypoint.eta || null,
          }
        });
      }
    }
    
    // Create weather conditions if provided
    if (data.weather_cells && Array.isArray(data.weather_cells)) {
      await (db as any).weatherCondition.create({
        data: {
          scenario_id: scenario.id,
          weather_data: data.weather_cells
        }
      });
    }
    
    // Create decisions if provided
    if (data.decisions && Array.isArray(data.decisions)) {
      for (const decision of data.decisions) {
        const createdDecision = await (db as any).decision.create({
          data: {
            scenario_id: scenario.id,
            title: decision.title || 'Decision',
            description: decision.description || '',
            time_limit: decision.time_limit || null,
            is_urgent: decision.is_urgent || false,
            trigger_condition: decision.trigger_condition || '',
            is_active: false,
            is_completed: false,
          }
        });
        
        // Create decision options if provided
        if (decision.options && Array.isArray(decision.options)) {
          for (const option of decision.options) {
            await (db as any).decisionOption.create({
              data: {
                decision_id: createdDecision.id,
                scenario_id: scenario.id,
                text: option.text || 'Option',
                consequences: option.consequences || '',
                is_recommended: option.is_recommended || false,
                is_selected: false,
              }
            });
          }
        }
      }
    }
    
    // Create communications if provided
    if (data.communications && Array.isArray(data.communications)) {
      for (const comm of data.communications) {
        await (db as any).communicationQueue.create({
          data: {
            scenario_id: scenario.id,
            type: comm.type || 'atc',
            sender: comm.sender || 'ATC',
            message: comm.message || '',
            is_important: comm.is_important || false,
            trigger_condition: comm.trigger_condition || '',
            is_sent: false,
          }
        });
      }
    }
    
    console.log('API route: Successfully saved scenario to database');
    
    return NextResponse.json({ 
      success: true, 
      id: scenario.id 
    });
  } catch (error) {
    console.error('API route: Error saving scenario:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save scenario' 
      },
      { status: 500 }
    );
  }
} 