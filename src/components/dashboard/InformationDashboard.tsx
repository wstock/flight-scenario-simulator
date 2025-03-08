"use client";

import AltitudeDisplay from './AltitudeDisplay';
import FuelDisplay from './FuelDisplay';
import HeadingDisplay from './HeadingDisplay';
import ScenarioTimeDisplay from './ScenarioTimeDisplay';

interface InformationDashboardProps {
  className?: string;
  altitude?: number;
  fuel?: number;
  heading?: number;
  scenarioId?: string;
}

/**
 * InformationDashboard component combines all dashboard information displays
 * into a single responsive grid layout
 */
export default function InformationDashboard({
  className = '',
  altitude = 10000,
  fuel = 15000,
  heading = 90,
  scenarioId,
}: InformationDashboardProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      <AltitudeDisplay 
        altitude={altitude}
      />
      
      <FuelDisplay 
        fuel={fuel}
      />
      
      <HeadingDisplay 
        heading={heading}
      />
      
      {scenarioId ? (
        <ScenarioTimeDisplay 
          scenarioId={scenarioId}
        />
      ) : (
        <div className="bg-neutral-800 rounded-lg p-4 flex flex-col items-center">
          <span className="text-sm text-neutral-400 mb-1">Scenario Time</span>
          <span className="text-2xl font-bold">00:00:00</span>
        </div>
      )}
    </div>
  );
} 