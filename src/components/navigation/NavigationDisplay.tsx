"use client";

import { useState, useEffect } from 'react';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import AircraftPositionDisplay from './AircraftPositionDisplay';
import WeatherOverlay from './WeatherOverlay';
import WaypointsDisplay from './WaypointsDisplay';

interface NavigationDisplayProps {
  className?: string;
  scenarioId?: string;
  heading?: number;
  initialHeading?: number;
  initialRange?: number;
  initialPosition?: {
    latitude: number;
    longitude: number;
  };
}

// Simple error boundary fallback component with proper typing
const ErrorFallback = ({ error, componentName }: { error: Error, componentName: string }) => (
  <div className="absolute inset-0 flex items-center justify-center flex-col p-4 bg-gray-900/50 backdrop-blur-sm z-10">
    <p className="text-red-400 text-sm mb-2">Error loading {componentName}</p>
    <p className="text-gray-500 text-xs max-w-xs text-center">{error.message}</p>
  </div>
);

// Create wrapper functions for each component's fallback
const AircraftPositionFallback = ({ error }: FallbackProps) => (
  <ErrorFallback error={error} componentName="Aircraft Position" />
);

const WeatherOverlayFallback = ({ error }: FallbackProps) => (
  <ErrorFallback error={error} componentName="Weather Overlay" />
);

const WaypointsFallback = ({ error }: FallbackProps) => (
  <ErrorFallback error={error} componentName="Waypoints" />
);

/**
 * NavigationDisplay component combines aircraft position, weather, and waypoints
 * into a single navigation display
 */
export default function NavigationDisplay({
  className = '',
  scenarioId,
  heading,
  initialHeading = 0,
  initialRange = 40,
  initialPosition = { latitude: 37.6213, longitude: -122.3790 }, // Default to SFO
}: NavigationDisplayProps) {
  const [currentHeading, setCurrentHeading] = useState(heading || initialHeading);
  const [range, setRange] = useState(initialRange);
  const [hasError, setHasError] = useState(false);
  
  // Update heading from props
  useEffect(() => {
    if (heading !== undefined) {
      setCurrentHeading(heading);
    } else if (initialHeading !== undefined) {
      setCurrentHeading(initialHeading);
    }
  }, [heading, initialHeading]);
  
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

  // Error handler
  const handleError = (error: Error) => {
    console.error("Error in NavigationDisplay component:", error);
    setHasError(true);
  };
  
  // If we've encountered an error, show a simplified display
  if (hasError) {
    return (
      <div className={`bg-gray-900 rounded-lg p-4 shadow-lg h-full overflow-hidden ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gray-400 font-medium text-sm">NAVIGATION DISPLAY</h3>
        </div>
        <div className="relative w-full h-[calc(100%-2rem)] bg-gray-800 flex items-center justify-center">
          <p className="text-red-400">Error loading navigation display</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-gray-900 rounded-lg p-4 shadow-lg h-full flex flex-col overflow-hidden ${className}`}>
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
      
      <div className="relative flex-grow w-full">
        {/* Aircraft position display container */}
        <div className="absolute inset-0 z-0">
          <ErrorBoundary FallbackComponent={AircraftPositionFallback} onError={handleError}>
            <AircraftPositionDisplay 
              heading={currentHeading}
              range={range}
              scenarioId={scenarioId}
              initialPosition={initialPosition}
              className="w-full h-full"
            />
          </ErrorBoundary>
        </div>
        
        {/* Weather overlay container */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <ErrorBoundary FallbackComponent={WeatherOverlayFallback} onError={handleError}>
            <WeatherOverlay 
              heading={currentHeading}
              range={range}
              scenarioId={scenarioId}
            />
          </ErrorBoundary>
        </div>
        
        {/* Waypoints overlay container */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          <ErrorBoundary FallbackComponent={WaypointsFallback} onError={handleError}>
            <WaypointsDisplay 
              heading={currentHeading}
              range={range}
              scenarioId={scenarioId}
            />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
} 