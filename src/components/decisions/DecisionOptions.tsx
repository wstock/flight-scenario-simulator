"use client";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCircle } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';

interface DecisionOption {
  id: string;
  text: string;
  consequences?: string;
  isRecommended?: boolean;
}

interface Decision {
  id: string;
  title: string;
  description: string;
  options: DecisionOption[];
  timeLimit?: number; // Time limit in seconds
  isUrgent?: boolean;
}

interface DecisionPayload {
  id: string;
  scenario_id: string;
  is_active: boolean;
}

interface DecisionData {
  id: string;
  title: string;
  description: string;
  time_limit?: number;
  is_urgent?: boolean;
  decision_options: Array<{
    id: string;
    text: string;
    consequences?: string;
    is_recommended?: boolean;
  }>;
}

interface DecisionOptionsProps {
  className?: string;
  scenarioId?: string;
  onDecisionMade?: (decisionId: string, optionId: string) => void;
}

/**
 * DecisionOptions component presents decision options dynamically
 * based on the current scenario state
 */
export default function DecisionOptions({
  className = '',
  scenarioId,
  onDecisionMade,
}: DecisionOptionsProps) {
  const [currentDecision, setCurrentDecision] = useState<Decision | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  // Set up Supabase real-time subscription for decision updates
  useEffect(() => {
    if (!scenarioId) {
      // Generate demo decision if no scenario ID
      generateDemoDecision();
      return;
    }
    
    // Subscribe to decision updates
    const channel = supabase
      .channel(`decisions-${scenarioId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'decisions',
          filter: `scenario_id=eq.${scenarioId} AND is_active=eq.true`,
        },
        (payload) => {
          if (payload.new) {
            const newDecision = payload.new as DecisionPayload;
            fetchDecision(newDecision.id);
          } else if (payload.old && !payload.new) {
            // Decision was removed or deactivated
            setCurrentDecision(null);
            setSelectedOption(null);
            setTimeRemaining(null);
          }
        }
      )
      .subscribe();
    
    // Initial fetch of active decision
    fetchActiveDecision();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [scenarioId]);
  
  // Timer for decision time limit
  useEffect(() => {
    if (!currentDecision?.timeLimit) return;
    
    setTimeRemaining(currentDecision.timeLimit);
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentDecision]);
  
  // Handle time expiration
  useEffect(() => {
    if (timeRemaining === 0) {
      toast.error('Time expired for this decision!');
      // You could automatically select a default option here
      // or just let the user know they're out of time
    }
  }, [timeRemaining]);
  
  // Fetch active decision
  const fetchActiveDecision = async () => {
    if (!scenarioId) return;
    
    try {
      const { data, error } = await supabase
        .from('decisions')
        .select('id')
        .eq('scenario_id', scenarioId)
        .eq('is_active', true)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          throw error;
        }
        return; // No active decision
      }
      
      if (data) {
        fetchDecision(data.id);
      }
    } catch (error) {
      console.error('Error fetching active decision:', error);
    }
  };
  
  // Fetch decision details
  const fetchDecision = async (decisionId: string) => {
    try {
      const { data, error } = await supabase
        .from('decisions')
        .select(`
          id,
          title,
          description,
          time_limit,
          is_urgent,
          decision_options (
            id,
            text,
            consequences,
            is_recommended
          )
        `)
        .eq('id', decisionId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const decisionData = data as DecisionData;
        const formattedDecision: Decision = {
          id: decisionData.id,
          title: decisionData.title,
          description: decisionData.description,
          timeLimit: decisionData.time_limit,
          isUrgent: decisionData.is_urgent,
          options: decisionData.decision_options.map(opt => ({
            id: opt.id,
            text: opt.text,
            consequences: opt.consequences,
            isRecommended: opt.is_recommended,
          })),
        };
        
        setCurrentDecision(formattedDecision);
        setSelectedOption(null);
        
        // Reset timer if there's a time limit
        if (decisionData.time_limit) {
          setTimeRemaining(decisionData.time_limit);
        } else {
          setTimeRemaining(null);
        }
      }
    } catch (error) {
      console.error('Error fetching decision details:', error);
    }
  };
  
  // Generate demo decision for preview
  const generateDemoDecision = () => {
    const demoDecision: Decision = {
      id: 'demo-1',
      title: 'Weather Deviation',
      description: 'Turbulence reported ahead. ATC has offered a 20° right deviation or climb to FL280.',
      options: [
        {
          id: 'opt-1',
          text: 'Accept 20° right deviation',
          consequences: 'Adds 10 minutes to flight time, smoother ride',
          isRecommended: true,
        },
        {
          id: 'opt-2',
          text: 'Request climb to FL280',
          consequences: 'May encounter light chop during climb, but potentially smoother afterward',
        },
        {
          id: 'opt-3',
          text: 'Maintain current course and altitude',
          consequences: 'Passengers will experience moderate to severe turbulence',
        },
      ],
      timeLimit: 30,
      isUrgent: true,
    };
    
    setCurrentDecision(demoDecision);
    setTimeRemaining(demoDecision.timeLimit || null);
  };
  
  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };
  
  // Submit decision
  const handleSubmitDecision = async () => {
    if (!currentDecision || !selectedOption) return;
    
    try {
      if (scenarioId) {
        // Record decision in database
        await supabase
          .from('decision_responses')
          .insert({
            decision_id: currentDecision.id,
            option_id: selectedOption,
            scenario_id: scenarioId,
            response_time: currentDecision.timeLimit ? (currentDecision.timeLimit - (timeRemaining || 0)) : null,
          });
      }
      
      // Call the callback if provided
      if (onDecisionMade) {
        onDecisionMade(currentDecision.id, selectedOption);
      }
      
      toast.success('Decision submitted successfully');
      
      // Clear the current decision (in a real app, the backend would push a new state)
      if (!scenarioId) {
        setCurrentDecision(null);
        setSelectedOption(null);
        setTimeRemaining(null);
      }
    } catch (error) {
      console.error('Error submitting decision:', error);
      toast.error('Failed to submit decision');
    }
  };
  
  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // If no decision is active
  if (!currentDecision) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 shadow-lg ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gray-400 font-medium text-sm">DECISIONS</h3>
        </div>
        <div className="flex items-center justify-center h-40 text-gray-500">
          No active decisions at this time
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-gray-800 rounded-lg p-4 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-400 font-medium text-sm">DECISION REQUIRED</h3>
        {timeRemaining !== null && (
          <div className={`text-sm font-mono ${
            timeRemaining < 10 ? 'text-red-500 animate-pulse' : 'text-gray-300'
          }`}>
            {formatTimeRemaining(timeRemaining)}
          </div>
        )}
      </div>
      
      <div className={`mb-4 p-3 rounded ${
        currentDecision.isUrgent ? 'bg-red-900/30 border border-red-700/50' : 'bg-gray-700/50'
      }`}>
        <h4 className="text-white font-medium mb-1">{currentDecision.title}</h4>
        <p className="text-gray-300 text-sm">{currentDecision.description}</p>
      </div>
      
      <div className="space-y-3 mb-4">
        {currentDecision.options.map((option) => (
          <div 
            key={option.id}
            className={`p-3 rounded cursor-pointer transition-colors ${
              selectedOption === option.id
                ? 'bg-blue-900/50 border border-blue-700'
                : 'bg-gray-700/30 border border-gray-700 hover:bg-gray-700/50'
            }`}
            onClick={() => handleOptionSelect(option.id)}
          >
            <div className="flex items-start">
              <div className="mr-2 mt-1 text-lg">
                {selectedOption === option.id ? (
                  <FontAwesomeIcon icon={faCheckCircle} className="text-blue-500" />
                ) : (
                  <FontAwesomeIcon icon={faCircle} className="text-gray-500" />
                )}
              </div>
              <div>
                <div className="text-white font-medium">
                  {option.text}
                  {option.isRecommended && (
                    <span className="ml-2 text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  )}
                </div>
                {option.consequences && (
                  <p className="text-gray-400 text-sm mt-1">{option.consequences}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-end">
        <button
          className={`px-4 py-2 rounded font-medium ${
            selectedOption
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-600 text-gray-300 cursor-not-allowed'
          }`}
          disabled={!selectedOption}
          onClick={handleSubmitDecision}
        >
          Submit Decision
        </button>
      </div>
    </div>
  );
} 