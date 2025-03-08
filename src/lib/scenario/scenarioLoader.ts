import { supabase } from '@/lib/supabase';
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
 * Loads a scenario from Supabase by ID
 */
export async function loadScenario(scenarioId: string): Promise<Scenario> {
  try {
    // Fetch the main scenario data
    const { data: scenarioData, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();
    
    if (scenarioError) throw scenarioError;
    if (!scenarioData) throw new Error(`Scenario with ID ${scenarioId} not found`);
    
    // Fetch waypoints
    const { data: waypointsData, error: waypointsError } = await supabase
      .from('waypoints')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('sequence', { ascending: true });
    
    if (waypointsError) throw waypointsError;
    
    // Fetch weather conditions
    const { data: weatherData, error: weatherError } = await supabase
      .from('weather_conditions')
      .select('weather_data')
      .eq('scenario_id', scenarioId)
      .single();
    
    if (weatherError && weatherError.code !== 'PGRST116') throw weatherError;
    
    // Fetch decisions
    const { data: decisionsData, error: decisionsError } = await supabase
      .from('decisions')
      .select(`
        id,
        title,
        description,
        time_limit,
        is_urgent,
        trigger_condition,
        decision_options (
          id,
          text,
          consequences,
          is_recommended
        )
      `)
      .eq('scenario_id', scenarioId);
    
    if (decisionsError) throw decisionsError;
    
    // Fetch communications
    const { data: communicationsData, error: communicationsError } = await supabase
      .from('communications_queue')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: true });
    
    if (communicationsError) throw communicationsError;
    
    // Format decisions
    const decisions: Decision[] = decisionsData.map((decision) => ({
      title: decision.title,
      description: decision.description,
      time_limit: decision.time_limit,
      is_urgent: decision.is_urgent,
      trigger_condition: decision.trigger_condition,
      options: decision.decision_options.map((option) => ({
        text: option.text,
        consequences: option.consequences,
        is_recommended: option.is_recommended,
      })),
    }));
    
    // Format communications
    const communications: Communication[] = communicationsData.map((comm) => ({
      type: comm.type,
      sender: comm.sender,
      message: comm.message,
      is_important: comm.is_important,
      trigger_condition: comm.trigger_condition,
    }));
    
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
      waypoints: waypointsData,
      weather_cells: weatherData?.weather_data || [],
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
    const { data, error } = await supabase
      .from('scenarios')
      .select('id, title, description')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
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
    
    // Set initial aircraft position
    await supabase
      .from('aircraft_positions')
      .upsert({
        scenario_id: scenarioId,
        latitude: 37.6213, // Default to SFO
        longitude: -122.3790,
        altitude: scenario.initial_altitude,
        heading: scenario.initial_heading,
        fuel: scenario.initial_fuel,
      });
    
    // Mark first waypoint as active if available
    if (scenario.waypoints.length > 0) {
      const firstWaypoint = scenario.waypoints[0] as DbWaypoint;
      if (firstWaypoint.id) {
        await supabase
          .from('waypoints')
          .update({ is_active: true })
          .eq('id', firstWaypoint.id);
      }
    }
    
    // Set scenario as active
    await supabase
      .from('active_scenarios')
      .upsert({
        scenario_id: scenarioId,
        start_time: new Date().toISOString(),
        is_paused: false,
      });
    
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
    // Deactivate all decisions
    await supabase
      .from('decisions')
      .update({ is_active: false })
      .eq('scenario_id', scenarioId);
    
    // Remove from active scenarios
    await supabase
      .from('active_scenarios')
      .delete()
      .eq('scenario_id', scenarioId);
    
    console.log(`Scenario ${scenarioId} deactivated successfully`);
  } catch (error) {
    console.error('Error deactivating scenario:', error);
    throw new Error('Failed to deactivate scenario');
  }
} 