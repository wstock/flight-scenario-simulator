"use client";

import React, { useState, useEffect } from 'react';
import { getScenarioTiming } from '@/lib/scenario/realTimeAdaptation';

export interface ScenarioTimeDisplayProps {
  scenarioId: string;
}

/**
 * ScenarioTimeDisplay component shows the current scenario time
 * with accelerated time simulation
 */
export default function ScenarioTimeDisplay({ scenarioId }: ScenarioTimeDisplayProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  useEffect(() => {
    const fetchTiming = async () => {
      try {
        const timing = await getScenarioTiming(scenarioId);
        if (timing) {
          setElapsedSeconds(timing.elapsed_seconds);
          setIsPaused(timing.is_paused);
        }
      } catch (error) {
        console.error('Error fetching scenario timing:', error);
      }
    };
    
    fetchTiming();
    
    // Set up polling interval to update time
    const interval = setInterval(fetchTiming, 5000);
    
    return () => clearInterval(interval);
  }, [scenarioId]);
  
  // Format time as HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };
  
  return (
    <div className="bg-neutral-800 rounded-lg p-4 flex flex-col items-center">
      <span className="text-sm text-neutral-400 mb-1">Scenario Time</span>
      <span className="text-2xl font-bold">{formatTime(elapsedSeconds)}</span>
      {isPaused && <span className="text-xs text-yellow-500 mt-1">PAUSED</span>}
    </div>
  );
} 