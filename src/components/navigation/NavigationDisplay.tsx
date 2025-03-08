"use client";

import { useState, useEffect } from 'react';
import AircraftPositionDisplay from './AircraftPositionDisplay';
import WeatherOverlay from './WeatherOverlay';
import WaypointsDisplay from './WaypointsDisplay';

interface NavigationDisplayProps {
  className?: string;
  scenarioId?: string;
  initialHeading?: number;
  initialRange?: number;
  initialPosition?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * NavigationDisplay component combines aircraft position, weather, and waypoints
 * into a single navigation display
 */
export default function NavigationDisplay({
  className = '',
  scenarioId,
  initialHeading = 0,
  initialRange = 40,
  initialPosition = { latitude: 37.6213, longitude: -122.3790 }, // Default to SFO
}: NavigationDisplayProps) {
  const [heading, setHeading] = useState(initialHeading);
  const [range, setRange] = useState(initialRange);
  
  // Update heading from props
  useEffect(() => {
    setHeading(initialHeading);
  }, [initialHeading]);
  
  // Update range from props
  useEffect(() => {
    setRange(initialRange);
  }, [initialRange]);
  
  // Range options
  const rangeOptions = [20, 40, 80, 160];
  
  // Handle range change
  const handleRangeChange = () => {
    const currentIndex = rangeOptions.indexOf(range);
    const nextIndex = (currentIndex + 1) % rangeOptions.length;
    setRange(rangeOptions[nextIndex]);
  };
  
  return (
    <div className={`bg-gray-900 rounded-lg p-4 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-400 font-medium text-sm">NAVIGATION DISPLAY</h3>
        <div className="flex space-x-2">
          <button 
            onClick={handleRangeChange}
            className="text-white text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600"
          >
            RNG {range}NM
          </button>
        </div>
      </div>
      
      <div className="relative w-full aspect-square">
        {/* Base aircraft position display */}
        <AircraftPositionDisplay 
          heading={heading}
          range={range}
          scenarioId={scenarioId}
          initialPosition={initialPosition}
          className="w-full h-full"
        />
        
        {/* Weather overlay */}
        <WeatherOverlay 
          heading={heading}
          range={range}
          scenarioId={scenarioId}
        />
        
        {/* Waypoints overlay */}
        <WaypointsDisplay 
          heading={heading}
          range={range}
          scenarioId={scenarioId}
        />
      </div>
    </div>
  );
} 