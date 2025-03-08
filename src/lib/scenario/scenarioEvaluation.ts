import { supabase } from '@/lib/supabase';
import { generateAnthropicResponse } from '@/lib/anthropic';

export interface ScenarioEvaluation {
  id?: string;
  scenario_id: string;
  safety_score: number;
  efficiency_score: number;
  passenger_comfort_score: number;
  overall_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  recommendations: string[];
  created_at?: string;
}

/**
 * Evaluates a completed scenario
 */
export async function evaluateScenario(scenarioId: string): Promise<ScenarioEvaluation> {
  try {
    // Get scenario data
    const { data: scenarioData, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();
    
    if (scenarioError) throw scenarioError;
    
    // Get final scenario state
    const { data: stateData, error: stateError } = await supabase
      .from('scenario_states')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (stateError) throw stateError;
    
    // Get all decision responses
    const { data: decisionsData, error: decisionsError } = await supabase
      .from('decision_responses')
      .select(`
        id,
        decision_id,
        option_id,
        created_at,
        decisions:decision_id (
          id,
          title,
          description
        ),
        decision_options:option_id (
          id,
          text,
          consequences,
          is_recommended
        )
      `)
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: true });
    
    if (decisionsError) throw decisionsError;
    
    // Get all communications
    const { data: communicationsData, error: communicationsError } = await supabase
      .from('communications')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: true });
    
    if (communicationsError) throw communicationsError;
    
    // Calculate basic metrics
    let recommendedChoices = 0;
    const totalChoices = decisionsData?.length || 0;
    
    for (const decision of decisionsData || []) {
      // Use type assertions to handle the nested structure
      const decisionOption = decision.decision_options as any;
      if (decisionOption?.is_recommended) {
        recommendedChoices++;
      }
    }
    
    const recommendedRatio = totalChoices > 0 ? recommendedChoices / totalChoices : 0;
    
    // Build context for AI evaluation
    const prompt = `
      You are a flight scenario evaluation system. Based on the user's performance in a flight scenario, provide a comprehensive evaluation.
      
      Scenario: ${scenarioData.title}
      Description: ${scenarioData.description}
      
      Final state:
      - Safety score: ${stateData.current_safety_score}/100
      - Efficiency score: ${stateData.current_efficiency_score}/100
      - Passenger comfort score: ${stateData.current_passenger_comfort_score}/100
      - Time deviation: ${stateData.time_deviation} minutes
      - Fuel remaining: ${stateData.fuel_remaining} pounds
      
      Decision history:
      ${decisionsData?.map((d, i) => {
        // Use type assertions to handle the nested structure
        const decision = d.decisions as any;
        const option = d.decision_options as any;
        return `
          ${i+1}. ${decision?.title}
          - Selected: ${option?.text}
          - Was recommended: ${option?.is_recommended ? 'Yes' : 'No'}
        `;
      }).join('') || 'No decisions recorded'}
      
      Communication history:
      ${communicationsData?.map((c, i) => `
        ${i+1}. From: ${c.sender}
        - Message: ${c.message}
      `).join('') || 'No communications recorded'}
      
      Performance metrics:
      - Recommended choices: ${recommendedChoices}/${totalChoices} (${Math.round(recommendedRatio * 100)}%)
      
      Please provide a comprehensive evaluation in JSON format:
      
      {
        "safety_score": number (0-100),
        "efficiency_score": number (0-100),
        "passenger_comfort_score": number (0-100),
        "overall_score": number (0-100),
        "strengths": [
          "strength 1",
          "strength 2",
          ...
        ],
        "areas_for_improvement": [
          "area 1",
          "area 2",
          ...
        ],
        "recommendations": [
          "recommendation 1",
          "recommendation 2",
          ...
        ]
      }
      
      Base your evaluation on the final state, decision history, and communication patterns. Be fair but thorough in your assessment.
    `;
    
    // Generate evaluation using Anthropic API
    const response = await generateAnthropicResponse([
      { role: 'user', content: prompt }
    ]);
    
    // Parse the response
    const evaluation = JSON.parse(extractJsonFromResponse(response));
    
    // Create evaluation record
    const evaluationRecord: ScenarioEvaluation = {
      scenario_id: scenarioId,
      safety_score: evaluation.safety_score,
      efficiency_score: evaluation.efficiency_score,
      passenger_comfort_score: evaluation.passenger_comfort_score,
      overall_score: evaluation.overall_score,
      strengths: evaluation.strengths,
      areas_for_improvement: evaluation.areas_for_improvement,
      recommendations: evaluation.recommendations
    };
    
    // Save evaluation to database
    const { data: savedEvaluation, error: saveError } = await supabase
      .from('scenario_evaluations')
      .insert(evaluationRecord)
      .select('*')
      .single();
    
    if (saveError) throw saveError;
    
    return savedEvaluation;
  } catch (error) {
    console.error('Error evaluating scenario:', error);
    throw new Error('Failed to evaluate scenario');
  }
}

/**
 * Gets a scenario evaluation
 */
export async function getScenarioEvaluation(scenarioId: string): Promise<ScenarioEvaluation | null> {
  try {
    const { data, error } = await supabase
      .from('scenario_evaluations')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting scenario evaluation:', error);
    throw new Error('Failed to get scenario evaluation');
  }
}

/**
 * Generates a detailed performance report
 */
export async function generatePerformanceReport(scenarioId: string): Promise<string> {
  try {
    // Get evaluation
    const evaluation = await getScenarioEvaluation(scenarioId);
    if (!evaluation) {
      throw new Error('No evaluation found for this scenario');
    }
    
    // Get scenario data
    const { data: scenarioData, error: scenarioError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();
    
    if (scenarioError) throw scenarioError;
    
    // Get all decision responses
    const { data: decisionsData, error: decisionsError } = await supabase
      .from('decision_responses')
      .select(`
        id,
        decision_id,
        option_id,
        created_at,
        decisions:decision_id (
          id,
          title,
          description
        ),
        decision_options:option_id (
          id,
          text,
          consequences,
          is_recommended
        )
      `)
      .eq('scenario_id', scenarioId)
      .order('created_at', { ascending: true });
    
    if (decisionsError) throw decisionsError;
    
    // Build context for AI report generation
    const prompt = `
      You are a flight scenario evaluation system. Generate a detailed performance report for a pilot who has completed a flight scenario.
      
      Scenario: ${scenarioData.title}
      Description: ${scenarioData.description}
      
      Evaluation scores:
      - Safety: ${evaluation.safety_score}/100
      - Efficiency: ${evaluation.efficiency_score}/100
      - Passenger Comfort: ${evaluation.passenger_comfort_score}/100
      - Overall: ${evaluation.overall_score}/100
      
      Strengths:
      ${evaluation.strengths.map(s => `- ${s}`).join('\n')}
      
      Areas for improvement:
      ${evaluation.areas_for_improvement.map(a => `- ${a}`).join('\n')}
      
      Recommendations:
      ${evaluation.recommendations.map(r => `- ${r}`).join('\n')}
      
      Decision history:
      ${decisionsData?.map((d, i) => {
        // Use type assertions to handle the nested structure
        const decision = d.decisions as any;
        const option = d.decision_options as any;
        return `
          ${i+1}. ${decision?.title}
          - Selected: ${option?.text}
          - Was recommended: ${option?.is_recommended ? 'Yes' : 'No'}
        `;
      }).join('') || 'No decisions recorded'}
      
      Please generate a detailed, professional performance report in markdown format. The report should include:
      
      1. An executive summary
      2. Detailed analysis of performance in key areas (safety, efficiency, passenger comfort)
      3. Decision analysis with specific feedback on critical decisions
      4. Recommendations for improvement
      5. Conclusion
      
      Make the report detailed, constructive, and actionable. Use a professional tone appropriate for pilot performance evaluation.
    `;
    
    // Generate report using Anthropic API
    const response = await generateAnthropicResponse([
      { role: 'user', content: prompt }
    ]);
    
    return response;
  } catch (error) {
    console.error('Error generating performance report:', error);
    throw new Error('Failed to generate performance report');
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