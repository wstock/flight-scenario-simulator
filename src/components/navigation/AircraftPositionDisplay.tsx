"use client";

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlane } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '@/lib/supabase';

interface Position {
  latitude: number;
  longitude: number;
}

interface AircraftPositionDisplayProps {
  initialPosition?: Position;
  heading?: number;
  range?: number; // Display range in nautical miles
  className?: string;
  scenarioId?: string;
}

/**
 * AircraftPositionDisplay component shows the current aircraft position
 * on a navigation display style interface
 */
export default function AircraftPositionDisplay({
  initialPosition = { latitude: 37.6213, longitude: -122.3790 }, // SFO
  heading = 0,
  range = 40, // 40nm range
  className = '',
  scenarioId,
}: AircraftPositionDisplayProps) {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [displayHeading, setDisplayHeading] = useState(heading);
  
  // Set up Supabase real-time subscription for position updates
  useEffect(() => {
    if (!scenarioId) return;
    
    // Subscribe to position updates
    const channel = supabase
      .channel(`aircraft-position-${scenarioId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'aircraft_positions',
          filter: `scenario_id=eq.${scenarioId}`,
        },
        (payload) => {
          if (payload.new) {
            setPosition({
              latitude: payload.new.latitude,
              longitude: payload.new.longitude,
            });
            setDisplayHeading(payload.new.heading || displayHeading);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [scenarioId, displayHeading]);
  
  // For demo purposes, simulate aircraft movement
  useEffect(() => {
    if (scenarioId) return; // Don't simulate if using real data
    
    const interval = setInterval(() => {
      setPosition(current => {
        // Simple simulation - move slightly in the direction of heading
        const headingRad = (displayHeading * Math.PI) / 180;
        const speed = 0.01; // Degrees per second
        
        return {
          latitude: current.latitude + Math.cos(headingRad) * speed,
          longitude: current.longitude + Math.sin(headingRad) * speed,
        };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [displayHeading, scenarioId]);

  // Calculate display elements
  const compassRotation = `rotate(${-displayHeading}deg)`;
  
  // Generate range rings (10nm, 20nm, etc.)
  const rangeRings = Array.from({ length: Math.floor(range / 10) }, (_, i) => (i + 1) * 10);
  
  return (
    <div className={`bg-gray-900 rounded-lg p-4 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-400 font-medium text-sm">NAVIGATION DISPLAY</h3>
        <div className="text-white text-sm">
          <span>RNG {range}NM</span>
        </div>
      </div>
      
      <div className="relative w-full aspect-square bg-black rounded-full overflow-hidden border border-gray-700">
        {/* Compass rose */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: compassRotation }}
        >
          {/* Cardinal directions */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-gray-400">N</div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">E</div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400">S</div>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">W</div>
          
          {/* Compass lines */}
          <div className="absolute h-full w-[1px] bg-gray-700"></div>
          <div className="absolute w-full h-[1px] bg-gray-700"></div>
          <div className="absolute h-full w-[1px] bg-gray-700 rotate-45"></div>
          <div className="absolute w-full h-[1px] bg-gray-700 rotate-45"></div>
        </div>
        
        {/* Range rings */}
        {rangeRings.map((ringRange) => (
          <div 
            key={ringRange}
            className="absolute rounded-full border border-gray-700"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${(ringRange / range) * 100}%`,
              height: `${(ringRange / range) * 100}%`,
            }}
          >
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] text-gray-500">
              {ringRange}
            </span>
          </div>
        ))}
        
        {/* Aircraft symbol - always in center for ND display */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-500">
          <FontAwesomeIcon 
            icon={faPlane} 
            className="text-xl"
            style={{ transform: `rotate(${displayHeading}deg)` }}
          />
        </div>
        
        {/* Position readout */}
        <div className="absolute bottom-2 left-2 text-[10px] text-gray-400">
          <div>LAT: {position.latitude.toFixed(4)}°</div>
          <div>LON: {position.longitude.toFixed(4)}°</div>
        </div>
        
        {/* Heading readout */}
        <div className="absolute bottom-2 right-2 text-[10px] text-gray-400">
          <div>HDG: {displayHeading.toFixed(0).padStart(3, '0')}°</div>
        </div>
      </div>
    </div>
  );
} 