import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Scenario } from '@/lib/scenario/scenarioGenerator';

export async function POST(req: NextRequest) {
  try {
    const scenario = await req.json();
    
    console.log('API route: Saving scenario to database...');
    
    // Validate required fields
    if (!scenario || !scenario.title) {
      console.error('API route: Missing required fields in scenario data');
      return NextResponse.json(
        { 
          error: 'Missing required fields in scenario data',
          message: 'The scenario must include at least a title',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    // First, insert the main scenario record
    const scenarioRecord = await prisma.scenario.create({
      data: {
        title: scenario.title,
        description: scenario.description || 'No description provided',
        aircraft: scenario.aircraft || 'Unknown aircraft',
        departure: scenario.departure || 'Unknown departure',
        arrival: scenario.arrival || 'Unknown arrival',
        initial_altitude: scenario.initial_altitude || 30000,
        initial_heading: scenario.initial_heading || 0,
        initial_fuel: scenario.initial_fuel || 10000,
        max_fuel: scenario.max_fuel || 20000,
        fuel_burn_rate: scenario.fuel_burn_rate || 50,
      },
    });
    
    const scenarioId = scenarioRecord.id;
    console.log(`API route: Created scenario with ID: ${scenarioId}`);
    
    // Insert waypoints
    if (scenario.waypoints && Array.isArray(scenario.waypoints) && scenario.waypoints.length > 0) {
      console.log(`API route: Adding ${scenario.waypoints.length} waypoints...`);
      
      await prisma.waypoint.createMany({
        data: scenario.waypoints.map(waypoint => ({
          scenario_id: scenarioId,
          name: waypoint.name || 'Unnamed waypoint',
          position_x: waypoint.position_x || 0,
          position_y: waypoint.position_y || 0,
          sequence: waypoint.sequence || 0,
          is_active: waypoint.is_active || false,
          is_passed: waypoint.is_passed || false,
          eta: waypoint.eta,
        })),
      });
    }
    
    // Insert weather cells
    if (scenario.weather_cells && Array.isArray(scenario.weather_cells) && scenario.weather_cells.length > 0) {
      console.log(`API route: Adding weather conditions...`);
      
      await prisma.weatherCondition.create({
        data: {
          scenario_id: scenarioId,
          weather_data: scenario.weather_cells,
        },
      });
    }
    
    // Insert decisions
    if (scenario.decisions && Array.isArray(scenario.decisions) && scenario.decisions.length > 0) {
      console.log(`API route: Adding ${scenario.decisions.length} decisions...`);
      
      for (const decision of scenario.decisions) {
        // Insert decision
        const decisionRecord = await prisma.decision.create({
          data: {
            scenario_id: scenarioId,
            title: decision.title || 'Unnamed decision',
            description: decision.description || 'No description provided',
            time_limit: decision.time_limit,
            is_urgent: decision.is_urgent || false,
            trigger_condition: decision.trigger_condition || 'Manual trigger',
            is_active: false, // Initially inactive
          },
        });
        
        // Insert decision options
        if (decision.options && Array.isArray(decision.options) && decision.options.length > 0) {
          await prisma.decisionOption.createMany({
            data: decision.options.map(option => ({
              decision_id: decisionRecord.id,
              scenario_id: scenarioId,
              text: option.text || 'No option text',
              consequences: option.consequences || 'No consequences specified',
              is_recommended: option.is_recommended || false,
            })),
          });
        }
      }
    }
    
    // Insert communications
    if (scenario.communications && Array.isArray(scenario.communications) && scenario.communications.length > 0) {
      console.log(`API route: Adding ${scenario.communications.length} communications...`);
      
      await prisma.communicationQueue.createMany({
        data: scenario.communications.map(comm => ({
          scenario_id: scenarioId,
          type: comm.type || 'system',
          sender: comm.sender || 'System',
          message: comm.message || 'No message content',
          is_important: comm.is_important || false,
          trigger_condition: comm.trigger_condition || 'Manual trigger',
          is_sent: false, // Initially not sent
        })),
      });
    }
    
    console.log('API route: Successfully saved scenario to database');
    return NextResponse.json({ id: scenarioId });
  } catch (error) {
    console.error('API route: Error saving scenario:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save scenario',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 