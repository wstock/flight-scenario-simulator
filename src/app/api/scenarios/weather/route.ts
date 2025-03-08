import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET handler for retrieving weather conditions for a scenario
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
    
    console.log(`API route: Getting weather conditions for scenario ${scenarioId}...`);
    
    // For now, return mock data since we don't have the actual table
    // In a real implementation, this would query the database
    const mockWeatherData = {
      id: 'weather-1',
      scenario_id: scenarioId,
      weather_data: {
        visibility: 10, // miles
        wind_speed: 15, // knots
        wind_direction: 270, // degrees
        temperature: 22, // celsius
        precipitation: 'none', // none, light, moderate, heavy
        cloud_cover: 'scattered', // clear, few, scattered, broken, overcast
        turbulence: 'light', // none, light, moderate, severe
        icing: 'none', // none, light, moderate, severe
        thunderstorms: false,
        ceiling: 25000 // feet
      }
    };
    
    console.log(`API route: Successfully retrieved weather conditions for scenario ${scenarioId}`);
    
    return NextResponse.json({
      success: true,
      data: mockWeatherData
    });
    
  } catch (error) {
    console.error('API route error getting weather conditions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve weather conditions' 
      },
      { status: 500 }
    );
  }
} 