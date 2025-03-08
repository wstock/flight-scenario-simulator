import { db } from '@/lib/db';
import { Scenario, WeatherCell, Decision, Communication } from './scenarioGenerator';

// Extended Waypoint interface with id for database operations
interface DbWaypoint {
  id: string;
  name: string;
  position_x: number;
  position_y: number;
  sequence: number;
  scenario_id: string;
  is_active?: boolean;
  is_passed?: boolean;
  eta?: string;
}

/**
 * Loads a scenario from the database by ID
 */
export async function loadScenario(scenarioId: string): Promise<Scenario> {
  try {
    // Fetch the main scenario data
    const scenarioData = await (db as any).scenario.findUnique({
      where: { id: scenarioId },
      include: {
        waypoints: {
          orderBy: { sequence: 'asc' }
        },
        weatherConditions: true,
        decisions: {
          include: {
            options: true
          }
        },
        communicationQueue: true
      }
    });
    
    if (!scenarioData) throw new Error(`Scenario with ID ${scenarioId} not found`);
    
    // Format decisions
    const decisions: Decision[] = (scenarioData.decisions || []).map((decision: any) => ({
      title: decision.title,
      description: decision.description,
      time_limit: decision.time_limit || undefined,
      is_urgent: decision.is_urgent,
      trigger_condition: decision.trigger_condition,
      options: (decision.options || []).map((option: any) => ({
        text: option.text,
        consequences: option.consequences,
        is_recommended: option.is_recommended || false,
      })),
    }));
    
    // Format communications
    const communications: Communication[] = (scenarioData.communicationQueue || []).map((comm: any) => ({
      type: comm.type as 'atc' | 'crew' | 'system',
      sender: comm.sender,
      message: comm.message,
      is_important: comm.is_important || false,
      trigger_condition: comm.trigger_condition,
    }));

    // Format weather cells
    const weatherCells: WeatherCell[] = (scenarioData.weatherConditions || []).map((wc: any) => {
      try {
        return JSON.parse(wc.weather_data.toString()) as WeatherCell;
      } catch (e) {
        console.error('Error parsing weather data:', e);
        return {
          intensity: 'light',
          position: { x: 0, y: 0 },
          size: 1
        };
      }
    });
    
    // Assemble the complete scenario
    const scenario: Scenario = {
      id: scenarioId,
      title: scenarioData.title,
      description: scenarioData.description,
      aircraft: scenarioData.aircraft,
      departure: scenarioData.departure,
      arrival: scenarioData.arrival,
      initial_altitude: scenarioData.initial_altitude,
      initial_heading: scenarioData.initial_heading,
      initial_fuel: scenarioData.initial_fuel,
      max_fuel: scenarioData.max_fuel,
      fuel_burn_rate: scenarioData.fuel_burn_rate,
      waypoints: scenarioData.waypoints,
      weather_cells: weatherCells,
      decisions,
      communications,
    };
    
    return scenario;
  } catch (error) {
    console.error('Error loading scenario:', error);
    throw new Error('Failed to load scenario');
  }
}

/**
 * Lists all available scenarios
 */
export async function listScenarios(): Promise<Array<{ id: string; title: string; description: string }>> {
  try {
    const response = await fetch('/api/scenarios', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to list scenarios');
    }
    
    return data.scenarios || [];
  } catch (error) {
    console.error('Error listing scenarios:', error);
    throw new Error('Failed to list scenarios');
  }
}

/**
 * Activates a scenario, setting up initial state
 */
export async function activateScenario(scenarioId: string): Promise<void> {
  try {
    // Load the scenario to get initial values
    const scenario = await loadScenario(scenarioId);
    
    // Update the scenario to mark it as active
    await (db as any).scenario.update({
      where: { id: scenarioId },
      data: { is_active: true }
    });
    
    // Mark first waypoint as active if available
    if (scenario.waypoints.length > 0) {
      const firstWaypoint = scenario.waypoints[0] as DbWaypoint;
      if (firstWaypoint.id) {
        await (db as any).waypoint.update({
          where: { id: firstWaypoint.id },
          data: { is_active: true }
        });
      }
    }
    
    console.log(`Scenario ${scenarioId} activated successfully`);
  } catch (error) {
    console.error('Error activating scenario:', error);
    throw new Error('Failed to activate scenario');
  }
}

/**
 * Deactivates a scenario, cleaning up state
 */
export async function deactivateScenario(scenarioId: string): Promise<void> {
  try {
    // Update the scenario to mark it as inactive
    await (db as any).scenario.update({
      where: { id: scenarioId },
      data: { is_active: false }
    });
    
    // Deactivate all decisions
    await (db as any).decision.updateMany({
      where: { scenario_id: scenarioId },
      data: { is_active: false }
    });
    
    console.log(`Scenario ${scenarioId} deactivated successfully`);
  } catch (error) {
    console.error('Error deactivating scenario:', error);
    throw new Error('Failed to deactivate scenario');
  }
} 