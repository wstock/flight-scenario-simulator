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
    console.log(`Loading scenario ${scenarioId}...`);
    
    const response = await fetch(`/api/scenarios/${scenarioId}`, {
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
      throw new Error(data.error || 'Failed to load scenario');
    }
    
    return data.scenario;
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
    console.log(`Activating scenario ${scenarioId}...`);
    
    const response = await fetch('/api/scenarios', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: scenarioId,
        action: 'activate'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to activate scenario');
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
    console.log(`Deactivating scenario ${scenarioId}...`);
    
    const response = await fetch('/api/scenarios', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: scenarioId,
        action: 'deactivate'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to deactivate scenario');
    }
    
    console.log(`Scenario ${scenarioId} deactivated successfully`);
  } catch (error) {
    console.error('Error deactivating scenario:', error);
    throw new Error('Failed to deactivate scenario');
  }
} 