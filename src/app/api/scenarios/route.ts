import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Scenario } from '@/lib/scenario/scenarioGenerator';

export async function POST(req: NextRequest) {
  try {
    const scenario = await req.json();
    
    console.log('API route: Saving scenario to database...');
    
    // First, insert the main scenario record
    const scenarioRecord = await prisma.scenario.create({
      data: {
        title: scenario.title,
        description: scenario.description,
        aircraft: scenario.aircraft,
        departure: scenario.departure,
        arrival: scenario.arrival,
        initial_altitude: scenario.initial_altitude,
        initial_heading: scenario.initial_heading,
        initial_fuel: scenario.initial_fuel,
        max_fuel: scenario.max_fuel,
        fuel_burn_rate: scenario.fuel_burn_rate,
      },
    });
    
    const scenarioId = scenarioRecord.id;
    console.log(`API route: Created scenario with ID: ${scenarioId}`);
    
    // Insert waypoints
    if (scenario.waypoints && scenario.waypoints.length > 0) {
      console.log(`API route: Adding ${scenario.waypoints.length} waypoints...`);
      
      await prisma.waypoint.createMany({
        data: scenario.waypoints.map(waypoint => ({
          scenario_id: scenarioId,
          name: waypoint.name,
          position_x: waypoint.position_x,
          position_y: waypoint.position_y,
          sequence: waypoint.sequence,
          is_active: waypoint.is_active || false,
          is_passed: waypoint.is_passed || false,
          eta: waypoint.eta,
        })),
      });
    }
    
    // Insert weather cells
    if (scenario.weather_cells && scenario.weather_cells.length > 0) {
      console.log(`API route: Adding weather conditions...`);
      
      await prisma.weatherCondition.create({
        data: {
          scenario_id: scenarioId,
          weather_data: scenario.weather_cells,
        },
      });
    }
    
    // Insert decisions
    if (scenario.decisions && scenario.decisions.length > 0) {
      console.log(`API route: Adding ${scenario.decisions.length} decisions...`);
      
      for (const decision of scenario.decisions) {
        // Insert decision
        const decisionRecord = await prisma.decision.create({
          data: {
            scenario_id: scenarioId,
            title: decision.title,
            description: decision.description,
            time_limit: decision.time_limit,
            is_urgent: decision.is_urgent,
            trigger_condition: decision.trigger_condition,
            is_active: false, // Initially inactive
          },
        });
        
        // Insert decision options
        if (decision.options && decision.options.length > 0) {
          await prisma.decisionOption.createMany({
            data: decision.options.map(option => ({
              decision_id: decisionRecord.id,
              scenario_id: scenarioId,
              text: option.text,
              consequences: option.consequences,
              is_recommended: option.is_recommended || false,
            })),
          });
        }
      }
    }
    
    // Insert communications
    if (scenario.communications && scenario.communications.length > 0) {
      console.log(`API route: Adding ${scenario.communications.length} communications...`);
      
      await prisma.communicationQueue.createMany({
        data: scenario.communications.map(comm => ({
          scenario_id: scenarioId,
          type: comm.type,
          sender: comm.sender,
          message: comm.message,
          is_important: comm.is_important || false,
          trigger_condition: comm.trigger_condition,
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