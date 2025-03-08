"use client";

import AltitudeDisplay from './AltitudeDisplay';
import FuelDisplay from './FuelDisplay';
import HeadingDisplay from './HeadingDisplay';
import ScenarioTimeDisplay from './ScenarioTimeDisplay';

interface InformationDashboardProps {
  className?: string;
}

/**
 * InformationDashboard component combines all dashboard information displays
 * into a single responsive grid layout
 */
export default function InformationDashboard({
  className = '',
}: InformationDashboardProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      <AltitudeDisplay 
        initialAltitude={10000}
        targetAltitude={15000}
      />
      
      <FuelDisplay 
        initialFuel={15000}
        maxFuel={20000}
        fuelBurnRate={10}
      />
      
      <HeadingDisplay 
        initialHeading={90}
        targetHeading={180}
        turnRate={3}
      />
      
      <ScenarioTimeDisplay 
        initialTime={new Date()}
        timeScale={1}
      />
    </div>
  );
} 