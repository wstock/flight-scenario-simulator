"use client";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';

interface ScenarioTimeDisplayProps {
  initialTime?: Date;
  timeScale?: number;
  className?: string;
}

/**
 * ScenarioTimeDisplay component shows the current scenario time
 * with accelerated time simulation
 */
export default function ScenarioTimeDisplay({
  initialTime = new Date(),
  timeScale = 1, // 1 = real-time, 2 = 2x speed, etc.
  className = '',
}: ScenarioTimeDisplayProps) {
  const [scenarioTime, setScenarioTime] = useState(initialTime);
  
  // Simulate time progression
  useEffect(() => {
    const interval = setInterval(() => {
      setScenarioTime(current => {
        const newTime = new Date(current);
        // Add seconds based on timeScale
        newTime.setSeconds(newTime.getSeconds() + timeScale);
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeScale]);

  // Format time as HH:MM:SS
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // Format date as DD MMM YYYY
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 shadow-lg ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-gray-400 font-medium text-sm">SCENARIO TIME</h3>
        <div className="text-white">
          <FontAwesomeIcon icon={faClock} className="text-blue-500" />
          {timeScale > 1 && (
            <span className="ml-1 text-xs text-yellow-500">{timeScale}x</span>
          )}
        </div>
      </div>
      
      <div className="mt-2">
        <div className="text-white text-3xl font-bold font-mono">
          {formatTime(scenarioTime)}
        </div>
        <div className="text-gray-400 text-sm mt-1">
          {formatDate(scenarioTime)}
        </div>
      </div>
    </div>
  );
} 