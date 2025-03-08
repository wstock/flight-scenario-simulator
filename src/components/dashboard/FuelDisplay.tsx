"use client";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGasPump, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

interface FuelDisplayProps {
  initialFuel?: number;
  maxFuel?: number;
  fuelBurnRate?: number;
  className?: string;
}

/**
 * FuelDisplay component shows the current aircraft fuel level
 * with visual indicators for remaining fuel percentage
 */
export default function FuelDisplay({
  initialFuel = 15000,
  maxFuel = 20000,
  fuelBurnRate = 10, // lbs per second
  className = '',
}: FuelDisplayProps) {
  const [fuel, setFuel] = useState(initialFuel);
  const [isLow, setIsLow] = useState(false);
  
  // Simulate fuel consumption
  useEffect(() => {
    const interval = setInterval(() => {
      setFuel(current => {
        const newFuel = Math.max(0, current - fuelBurnRate);
        // Set low fuel warning at 20% remaining
        setIsLow(newFuel < maxFuel * 0.2);
        return newFuel;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [fuelBurnRate, maxFuel]);

  // Calculate fuel percentage
  const fuelPercentage = Math.round((fuel / maxFuel) * 100);
  
  // Format fuel with commas
  const formattedFuel = Math.round(fuel).toLocaleString();
  
  // Determine fuel indicator color based on remaining percentage
  const getFuelColor = () => {
    if (fuelPercentage <= 10) return 'bg-red-500';
    if (fuelPercentage <= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 shadow-lg ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-gray-400 font-medium text-sm">FUEL</h3>
        <div className="text-white">
          {isLow ? (
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 animate-pulse" />
          ) : (
            <FontAwesomeIcon icon={faGasPump} className="text-blue-500" />
          )}
        </div>
      </div>
      
      <div className="mt-2 flex items-end">
        <span className="text-white text-3xl font-bold">{formattedFuel}</span>
        <span className="text-gray-400 ml-1 mb-1 text-sm">LBS</span>
      </div>
      
      <div className="mt-3">
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${getFuelColor()}`} 
            style={{ width: `${fuelPercentage}%` }}
          ></div>
        </div>
        <div className="mt-1 text-xs text-gray-400 flex justify-between">
          <span>0%</span>
          <span>{fuelPercentage}%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
} 