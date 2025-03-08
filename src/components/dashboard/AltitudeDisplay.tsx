"use client";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlane } from '@fortawesome/free-solid-svg-icons';

interface AltitudeDisplayProps {
  initialAltitude?: number;
  targetAltitude?: number;
  className?: string;
}

/**
 * AltitudeDisplay component shows the current aircraft altitude
 * with visual indicators for climbing/descending
 */
export default function AltitudeDisplay({
  initialAltitude = 10000,
  targetAltitude,
  className = '',
}: AltitudeDisplayProps) {
  const [altitude, setAltitude] = useState(initialAltitude);
  const [trend, setTrend] = useState<'climbing' | 'descending' | 'level'>('level');

  // Simulate altitude changes
  useEffect(() => {
    // Only change altitude if there's a target
    if (targetAltitude !== undefined) {
      const interval = setInterval(() => {
        setAltitude(current => {
          // Determine if we need to climb, descend, or maintain level
          if (current < targetAltitude - 100) {
            setTrend('climbing');
            return current + 100;
          } else if (current > targetAltitude + 100) {
            setTrend('descending');
            return current - 100;
          } else {
            setTrend('level');
            return targetAltitude;
          }
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [targetAltitude]);

  // Format altitude with commas
  const formattedAltitude = altitude.toLocaleString();

  // Determine trend indicator color and direction
  const getTrendIndicator = () => {
    switch (trend) {
      case 'climbing':
        return <FontAwesomeIcon icon={faPlane} className="text-green-500 transform rotate-45" />;
      case 'descending':
        return <FontAwesomeIcon icon={faPlane} className="text-red-500 transform -rotate-45" />;
      default:
        return <FontAwesomeIcon icon={faPlane} className="text-blue-500" />;
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 shadow-lg ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-gray-400 font-medium text-sm">ALTITUDE</h3>
        <div className="text-white">{getTrendIndicator()}</div>
      </div>
      
      <div className="mt-2 flex items-end">
        <span className="text-white text-3xl font-bold">{formattedAltitude}</span>
        <span className="text-gray-400 ml-1 mb-1 text-sm">FT</span>
      </div>
      
      {targetAltitude && targetAltitude !== altitude && (
        <div className="mt-1 text-xs text-gray-400">
          Target: {targetAltitude.toLocaleString()} FT
        </div>
      )}
    </div>
  );
} 