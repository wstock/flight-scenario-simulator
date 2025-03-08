"use client";

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { generateScenarioFromPrompt } from '@/lib/scenario/scenarioGenerator';

interface ScenarioGeneratorProps {
  className?: string;
}

export default function ScenarioGenerator({ className = '' }: ScenarioGeneratorProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScenarioId, setGeneratedScenarioId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast.error('Please enter a scenario description');
      return;
    }
    
    try {
      setIsGenerating(true);
      toast.info('Generating scenario... This may take a moment.');
      
      console.log('ScenarioGenerator: Starting scenario generation with prompt:', prompt.substring(0, 50) + '...');
      
      // Generate the scenario using the API
      const scenarioId = await generateScenarioFromPrompt(prompt);
      
      console.log('ScenarioGenerator: Successfully generated scenario with ID:', scenarioId);
      
      setGeneratedScenarioId(scenarioId);
      toast.success('Scenario generated successfully!');
      
      // Store the ID in localStorage for demo purposes
      localStorage.setItem('lastGeneratedScenarioId', scenarioId);
      
    } catch (error) {
      console.error('ScenarioGenerator: Error generating scenario:', error);
      
      // Provide more specific error message if available
      let errorMessage = 'Failed to generate scenario. Please try again.';
      
      if (error instanceof Error) {
        // Extract the most useful part of the error message
        const message = error.message;
        
        if (message.includes('JSON')) {
          errorMessage = 'Error parsing AI response. Please try again with a different prompt.';
        } else if (message.includes('API')) {
          errorMessage = 'API error: ' + message.replace('API error: ', '');
        } else {
          errorMessage = `Error: ${message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleActivateScenario = () => {
    if (generatedScenarioId) {
      // Store active scenario ID in localStorage for demo purposes
      localStorage.setItem('activeScenarioId', generatedScenarioId);
      router.push('/simulator');
    }
  };

  const handleViewScenarios = () => {
    router.push('/scenarios');
  };

  return (
    <div className={`bg-neutral-800 rounded-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold mb-4">Generate Flight Scenario</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium mb-2">
            Describe your scenario
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., Thunderstorms on approach at Malaga, Engine failure during cruise over the Atlantic, Bird strike during takeoff at JFK..."
            className="w-full h-32 px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isGenerating}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className={`px-6 py-3 rounded-lg font-medium ${
              isGenerating || !prompt.trim()
                ? 'bg-neutral-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors`}
          >
            {isGenerating ? (
              <span className="flex items-center">
                <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></span>
                Generating...
              </span>
            ) : (
              'Generate Scenario'
            )}
          </button>
          
          <button
            type="button"
            onClick={handleViewScenarios}
            className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 rounded-lg font-medium transition-colors"
          >
            View All Scenarios
          </button>
        </div>
      </form>
      
      {generatedScenarioId && (
        <div className="mt-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-2">Scenario Generated!</h3>
          <p className="mb-4">Your scenario has been created and is ready to use.</p>
          <button
            onClick={handleActivateScenario}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
          >
            Start Scenario Now
          </button>
        </div>
      )}
    </div>
  );
} 