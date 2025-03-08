"use client";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationArrow } from '@fortawesome/free-solid-svg-icons';

interface HeadingDisplayProps {
  initialHeading?: number;
  targetHeading?: number;
  turnRate?: number;
  className?: string;
}

/**
 * HeadingDisplay component shows the current aircraft heading
 * with visual compass indicator
 */
export default function HeadingDisplay({
  initialHeading = 0,
  targetHeading,
  turnRate = 3, // degrees per second
  className = '',
}: HeadingDisplayProps) {
  const [heading, setHeading] = useState(initialHeading);
  const [turning, setTurning] = useState<'left' | 'right' | 'none'>('none');
  
  // Normalize heading to 0-359 range
  const normalizeHeading = (hdg: number): number => {
    return ((hdg % 360) + 360) % 360;
  };
  
  // Simulate heading changes
  useEffect(() => {
    if (targetHeading !== undefined) {
      const interval = setInterval(() => {
        setHeading(current => {
          const normalizedCurrent = normalizeHeading(current);
          const normalizedTarget = normalizeHeading(targetHeading);
          
          // Calculate shortest turn direction
          let diff = normalizedTarget - normalizedCurrent;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          
          // Determine turn direction
          if (Math.abs(diff) < turnRate) {
            setTurning('none');
            return normalizedTarget;
          } else if (diff > 0) {
            setTurning('right');
            return normalizeHeading(current + turnRate);
          } else {
            setTurning('left');
            return normalizeHeading(current - turnRate);
          }
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [targetHeading, turnRate]);

  // Format heading with leading zeros
  const formattedHeading = heading.toFixed(0).padStart(3, '0');
  
  // Calculate compass rotation
  const compassRotation = `rotate(${-heading}deg)`;
  
  // Get cardinal direction
  const getCardinalDirection = () => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 shadow-lg ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-gray-400 font-medium text-sm">HEADING</h3>
        <div className="text-white">
          <span className="text-blue-500 text-xs">{getCardinalDirection()}</span>
        </div>
      </div>
      
      <div className="mt-2 flex items-center justify-center">
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Compass ring */}
          <div className="absolute inset-0 border-2 border-gray-600 rounded-full"></div>
          
          {/* Cardinal directions */}
          <div className="absolute inset-0" style={{ transform: compassRotation }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-xs text-gray-400">N</div>
            <div className="absolute right-0 top-1/2 translate-x-1 -translate-y-1/2 text-xs text-gray-400">E</div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-xs text-gray-400">S</div>
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 text-xs text-gray-400">W</div>
          </div>
          
          {/* Heading indicator */}
          <FontAwesomeIcon 
            icon={faLocationArrow} 
            className={`text-2xl ${
              turning === 'left' ? 'text-yellow-500' : 
              turning === 'right' ? 'text-yellow-500' : 
              'text-blue-500'
            }`}
          />
        </div>
      </div>
      
      <div className="mt-2 flex items-center justify-center">
        <span className="text-white text-3xl font-bold">{formattedHeading}°</span>
      </div>
      
      {targetHeading !== undefined && targetHeading !== heading && (
        <div className="mt-1 text-xs text-gray-400 text-center">
          Target: {targetHeading.toFixed(0).padStart(3, '0')}°
        </div>
      )}
    </div>
  );
} 