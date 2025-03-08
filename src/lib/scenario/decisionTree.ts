import { supabase } from '@/lib/supabase';
import { generateAnthropicResponse } from '@/lib/anthropic';
import { generateATCMessage, ATCCommunicationParams } from '@/lib/communications/atcGenerator';
import { generateCrewMessage, CrewCommunicationParams } from '@/lib/communications/crewGenerator';

export interface DecisionNode {
  id: string;
  decision_id: string;
  scenario_id: string;
  parent_node_id?: string;
  option_id?: string;
  is_active: boolean;
  next_nodes?: string[];
  trigger_condition?: string;
  trigger_time?: number; // Time in seconds from scenario start
  communications_to_trigger?: string[]; // IDs of communications to trigger
  parameter_changes?: {
    altitude?: number;
    heading?: number;
    fuel_burn_rate?: number;
    weather?: any;
  };
}

export interface DecisionBranch {
  nodes: DecisionNode[];
  currentNodeId: string | null;
}

/**
 * Loads the decision tree for a scenario
 */
export async function loadDecisionTree(scenarioId: string): Promise<DecisionBranch> {
  try {
    // Fetch all decision nodes for the scenario
    const { data, error } = await supabase
      .from('decision_nodes')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    // Find the active node, if any
    const activeNode = data?.find(node => node.is_active);
    
    return {
      nodes: data || [],
      currentNodeId: activeNode?.id || null,
    };
  } catch (error) {
    console.error('Error loading decision tree:', error);
    throw new Error('Failed to load decision tree');
  }
}

/**
 * Activates a decision node
 */
export async function activateDecisionNode(nodeId: string): Promise<void> {
  try {
    // Get the node details
    const { data: nodeData, error: nodeError } = await supabase
      .from('decision_nodes')
      .select('*')
      .eq('id', nodeId)
      .single();
    
    if (nodeError) throw nodeError;
    
    // Activate the decision associated with this node
    if (nodeData.decision_id) {
      await supabase
        .from('decisions')
        .update({ is_active: true })
        .eq('id', nodeData.decision_id);
    }
    
    // Mark this node as active
    await supabase
      .from('decision_nodes')
      .update({ is_active: true })
      .eq('id', nodeId);
    
    // Trigger any associated communications
    if (nodeData.communications_to_trigger && nodeData.communications_to_trigger.length > 0) {
      for (const commId of nodeData.communications_to_trigger) {
        await supabase
          .from('communications_queue')
          .update({ is_sent: true })
          .eq('id', commId);
        
        // Copy from queue to actual communications
        const { data: commData, error: commError } = await supabase
          .from('communications_queue')
          .select('*')
          .eq('id', commId)
          .single();
        
        if (!commError && commData) {
          await supabase
            .from('communications')
            .insert({
              scenario_id: commData.scenario_id,
              type: commData.type,
              sender: commData.sender,
              message: commData.message,
              is_important: commData.is_important,
            });
        }
      }
    }
    
    // Apply any parameter changes
    if (nodeData.parameter_changes) {
      const changes = nodeData.parameter_changes;
      
      // Update aircraft parameters
      if (changes.altitude !== undefined || changes.heading !== undefined || changes.fuel_burn_rate !== undefined) {
        const updateData: any = {};
        
        if (changes.altitude !== undefined) updateData.altitude = changes.altitude;
        if (changes.heading !== undefined) updateData.heading = changes.heading;
        if (changes.fuel_burn_rate !== undefined) updateData.fuel_burn_rate = changes.fuel_burn_rate;
        
        await supabase
          .from('aircraft_positions')
          .update(updateData)
          .eq('scenario_id', nodeData.scenario_id);
      }
      
      // Update weather if needed
      if (changes.weather) {
        await supabase
          .from('weather_conditions')
          .update({ weather_data: changes.weather })
          .eq('scenario_id', nodeData.scenario_id);
      }
    }
    
    console.log(`Decision node ${nodeId} activated successfully`);
  } catch (error) {
    console.error('Error activating decision node:', error);
    throw new Error('Failed to activate decision node');
  }
}

/**
 * Processes a user decision and advances the scenario
 */
export async function processDecision(
  scenarioId: string,
  decisionId: string,
  optionId: string
): Promise<string | null> {
  try {
    // Record the decision response
    await supabase
      .from('decision_responses')
      .insert({
        scenario_id: scenarioId,
        decision_id: decisionId,
        option_id: optionId,
      });
    
    // Deactivate the current decision
    await supabase
      .from('decisions')
      .update({ is_active: false })
      .eq('id', decisionId);
    
    // Find the current active node
    const { data: currentNodeData, error: currentNodeError } = await supabase
      .from('decision_nodes')
      .select('*')
      .eq('scenario_id', scenarioId)
      .eq('is_active', true)
      .single();
    
    if (currentNodeError && currentNodeError.code !== 'PGRST116') throw currentNodeError;
    
    // Deactivate the current node if it exists
    if (currentNodeData) {
      await supabase
        .from('decision_nodes')
        .update({ is_active: false })
        .eq('id', currentNodeData.id);
    }
    
    // Find the next node based on the decision
    const { data: nextNodeData, error: nextNodeError } = await supabase
      .from('decision_nodes')
      .select('*')
      .eq('scenario_id', scenarioId)
      .eq('parent_node_id', currentNodeData?.id)
      .eq('option_id', optionId)
      .single();
    
    if (nextNodeError && nextNodeError.code !== 'PGRST116') throw nextNodeError;
    
    // If we found a next node, activate it
    if (nextNodeData) {
      await activateDecisionNode(nextNodeData.id);
      return nextNodeData.id;
    }
    
    // If no next node is found, we need to generate one dynamically
    const newNodeId = await generateNextNode(scenarioId, decisionId, optionId, currentNodeData?.id);
    return newNodeId;
  } catch (error) {
    console.error('Error processing decision:', error);
    throw new Error('Failed to process decision');
  }
}

/**
 * Dynamically generates the next scenario node based on the user's decision
 */
async function generateNextNode(
  scenarioId: string,
  decisionId: string,
  optionId: string,
  parentNodeId?: string
): Promise<string | null> {
  try {
    // Get the decision and option details
    const { data: decisionData, error: decisionError } = await supabase
      .from('decisions')
      .select(`
        id,
        title,
        description,
        decision_options (
          id,
          text,
          consequences
        )
      `)
      .eq('id', decisionId)
      .single();
    
    if (decisionError) throw decisionError;
    
    // Get the selected option
    const selectedOption = decisionData.decision_options.find((opt: any) => opt.id === optionId);
    if (!selectedOption) throw new Error('Selected option not found');
    
    // Get current aircraft state
    const { data: aircraftData, error: aircraftError } = await supabase
      .from('aircraft_positions')
      .select('*')
      .eq('scenario_id', scenarioId)
      .single();
    
    if (aircraftError) throw aircraftError;
    
    // Get scenario details
    const { data: scenarioData, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();
    
    if (scenarioError) throw scenarioError;
    
    // Build context for AI to generate the next scenario state
    const prompt = `
      You are a flight scenario engine. Based on the user's decision, generate the next state of the scenario.
      
      Current scenario: ${scenarioData.title}
      ${scenarioData.description}
      
      Current aircraft state:
      - Altitude: ${aircraftData.altitude} feet
      - Heading: ${aircraftData.heading} degrees
      - Fuel: ${aircraftData.fuel} pounds
      
      Decision made: ${decisionData.title}
      Decision description: ${decisionData.description}
      Selected option: ${selectedOption.text}
      Consequences: ${selectedOption.consequences}
      
      Please generate the next state of the scenario in JSON format:
      
      {
        "parameter_changes": {
          "altitude": number or null,
          "heading": number or null,
          "fuel_burn_rate": number or null
        },
        "communications": [
          {
            "type": "atc" or "crew" or "system",
            "sender": "string",
            "message": "string",
            "is_important": boolean
          }
        ],
        "next_decision": {
          "title": "string",
          "description": "string",
          "time_limit": number or null,
          "is_urgent": boolean,
          "options": [
            {
              "text": "string",
              "consequences": "string",
              "is_recommended": boolean
            }
          ],
          "trigger_time": number (seconds from now)
        }
      }
      
      Make sure the response is realistic and follows from the decision made. The parameter changes should reflect the consequences of the decision.
    `;
    
    // Generate the next state using Anthropic API
    const response = await generateAnthropicResponse([
      { role: 'user', content: prompt }
    ]);
    
    // Parse the response
    const nextState = JSON.parse(extractJsonFromResponse(response));
    
    // Create communications
    const communicationIds: string[] = [];
    if (nextState.communications && nextState.communications.length > 0) {
      for (const comm of nextState.communications) {
        const { data: commData, error: commError } = await supabase
          .from('communications_queue')
          .insert({
            scenario_id: scenarioId,
            type: comm.type,
            sender: comm.sender,
            message: comm.message,
            is_important: comm.is_important,
            is_sent: false,
            trigger_condition: 'Generated from decision',
          })
          .select('id')
          .single();
        
        if (commError) throw commError;
        communicationIds.push(commData.id);
      }
    }
    
    // Create next decision if provided
    let nextDecisionId: string | undefined;
    if (nextState.next_decision) {
      const { data: decisionData, error: decisionError } = await supabase
        .from('decisions')
        .insert({
          scenario_id: scenarioId,
          title: nextState.next_decision.title,
          description: nextState.next_decision.description,
          time_limit: nextState.next_decision.time_limit,
          is_urgent: nextState.next_decision.is_urgent,
          is_active: false,
          trigger_condition: 'Generated from previous decision',
        })
        .select('id')
        .single();
      
      if (decisionError) throw decisionError;
      nextDecisionId = decisionData.id;
      
      // Create decision options
      if (nextState.next_decision.options && nextState.next_decision.options.length > 0) {
        const optionsWithIds = nextState.next_decision.options.map((option: any) => ({
          decision_id: nextDecisionId,
          scenario_id: scenarioId,
          text: option.text,
          consequences: option.consequences,
          is_recommended: option.is_recommended || false,
        }));
        
        await supabase
          .from('decision_options')
          .insert(optionsWithIds);
      }
    }
    
    // Create the next decision node
    const { data: nodeData, error: nodeError } = await supabase
      .from('decision_nodes')
      .insert({
        scenario_id: scenarioId,
        decision_id: nextDecisionId,
        parent_node_id: parentNodeId,
        option_id: optionId,
        is_active: true,
        trigger_time: nextState.next_decision?.trigger_time || 0,
        communications_to_trigger: communicationIds,
        parameter_changes: nextState.parameter_changes || {},
      })
      .select('id')
      .single();
    
    if (nodeError) throw nodeError;
    
    // Apply parameter changes immediately
    if (nextState.parameter_changes) {
      const changes = nextState.parameter_changes;
      
      // Update aircraft parameters
      if (changes.altitude !== undefined || changes.heading !== undefined || changes.fuel_burn_rate !== undefined) {
        const updateData: any = {};
        
        if (changes.altitude !== undefined) updateData.altitude = changes.altitude;
        if (changes.heading !== undefined) updateData.heading = changes.heading;
        if (changes.fuel_burn_rate !== undefined) updateData.fuel_burn_rate = changes.fuel_burn_rate;
        
        await supabase
          .from('aircraft_positions')
          .update(updateData)
          .eq('scenario_id', scenarioId);
      }
    }
    
    // If there's a next decision with no trigger time, activate it immediately
    if (nextDecisionId && (!nextState.next_decision.trigger_time || nextState.next_decision.trigger_time === 0)) {
      await supabase
        .from('decisions')
        .update({ is_active: true })
        .eq('id', nextDecisionId);
    }
    
    // Send immediate communications
    for (const commId of communicationIds) {
      await supabase
        .from('communications_queue')
        .update({ is_sent: true })
        .eq('id', commId);
      
      // Copy from queue to actual communications
      const { data: commData, error: commError } = await supabase
        .from('communications_queue')
        .select('*')
        .eq('id', commId)
        .single();
      
      if (!commError && commData) {
        await supabase
          .from('communications')
          .insert({
            scenario_id: commData.scenario_id,
            type: commData.type,
            sender: commData.sender,
            message: commData.message,
            is_important: commData.is_important,
          });
      }
    }
    
    return nodeData.id;
  } catch (error) {
    console.error('Error generating next node:', error);
    throw new Error('Failed to generate next scenario node');
  }
}

/**
 * Extracts JSON from a text response
 */
function extractJsonFromResponse(response: string): string {
  try {
    // Try to parse the entire response as JSON
    JSON.parse(response);
    return response;
  } catch (e) {
    // If that fails, try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        JSON.parse(jsonMatch[0]);
        return jsonMatch[0];
      } catch (innerError) {
        throw new Error('Failed to parse JSON from response');
      }
    }
    throw new Error('No valid JSON found in response');
  }
} 