"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Waypoint {
  id: string;
  name: string;
  position: {
    x: number; // -1 to 1 relative to center
    y: number; // -1 to 1 relative to center
  };
  isActive?: boolean;
  isPassed?: boolean;
  eta?: string; // Estimated time of arrival
}

interface WaypointsDisplayProps {
  className?: string;
  scenarioId?: string;
  heading?: number;
  range?: number; // Display range in nautical miles
}

/**
 * WaypointsDisplay component shows flight path waypoints on the navigation display
 */
export default function WaypointsDisplay({
  className = '',
  scenarioId,
  heading = 0,
  range = 40,
}: WaypointsDisplayProps) {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [flightPath, setFlightPath] = useState<[number, number][]>([]);
  
  // Set up Supabase real-time subscription for waypoint updates
  useEffect(() => {
    if (!scenarioId) {
      // Generate demo waypoints if no scenario ID
      generateDemoWaypoints();
      return;
    }
    
    // Subscribe to waypoint updates
    const channel = supabase
      .channel(`waypoints-${scenarioId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waypoints',
          filter: `scenario_id=eq.${scenarioId}`,
        },
        (payload) => {
          if (payload.new) {
            // Fetch all waypoints to ensure we have the complete set
            fetchWaypoints();
          }
        }
      )
      .subscribe();
    
    // Initial fetch of waypoints
    fetchWaypoints();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [scenarioId]);
  
  // Fetch waypoints data
  const fetchWaypoints = async () => {
    if (!scenarioId) return;
    
    try {
      const { data, error } = await supabase
        .from('waypoints')
        .select('*')
        .eq('scenario_id', scenarioId)
        .order('sequence', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        // Transform data to our Waypoint format
        const transformedWaypoints: Waypoint[] = data.map(wp => ({
          id: wp.id,
          name: wp.name,
          position: {
            x: wp.position_x,
            y: wp.position_y,
          },
          isActive: wp.is_active,
          isPassed: wp.is_passed,
          eta: wp.eta,
        }));
        
        setWaypoints(transformedWaypoints);
        
        // Generate flight path from waypoints
        const path = transformedWaypoints.map(wp => [
          wp.position.x,
          wp.position.y,
        ]) as [number, number][];
        
        setFlightPath(path);
      }
    } catch (error) {
      console.error('Error fetching waypoints:', error);
    }
  };
  
  // Generate demo waypoints for preview
  const generateDemoWaypoints = () => {
    const demoWaypoints: Waypoint[] = [
      {
        id: '1',
        name: 'KSFO',
        position: { x: 0, y: 0 },
        isPassed: true,
      },
      {
        id: '2',
        name: 'OCEAN',
        position: { x: 0.3, y: -0.2 },
        isActive: true,
      },
      {
        id: '3',
        name: 'COAST',
        position: { x: 0.6, y: -0.4 },
        eta: '12:45',
      },
      {
        id: '4',
        name: 'KLAX',
        position: { x: 0.8, y: -0.7 },
        eta: '13:30',
      },
    ];
    
    setWaypoints(demoWaypoints);
    
    // Generate flight path from waypoints
    const path = demoWaypoints.map(wp => [
      wp.position.x,
      wp.position.y,
    ]) as [number, number][];
    
    setFlightPath(path);
  };
  
  // Calculate rotation to keep waypoints fixed relative to ground
  const compassRotation = `rotate(${-heading}deg)`;
  
  // Generate SVG path for flight route
  const generatePathData = () => {
    if (flightPath.length < 2) return '';
    
    // Convert relative coordinates to SVG coordinates (percentage-based)
    const svgPath = flightPath.map((point, index) => {
      const x = (point[0] * 50) + 50; // Convert -1...1 to 0...100
      const y = (point[1] * 50) + 50; // Convert -1...1 to 0...100
      
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    return svgPath;
  };
  
  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Waypoints container - rotates with compass */}
      <div 
        className="absolute inset-0"
        style={{ transform: compassRotation }}
      >
        {/* Flight path line */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d={generatePathData()}
            stroke="rgba(0, 255, 255, 0.6)"
            strokeWidth="1"
            fill="none"
            strokeDasharray="4 2"
          />
        </svg>
        
        {/* Waypoint markers */}
        {waypoints.map((waypoint) => (
          <div
            key={waypoint.id}
            className={`absolute flex flex-col items-center ${
              waypoint.isActive ? 'z-10' : 'z-0'
            }`}
            style={{
              top: `${(waypoint.position.y * 50) + 50}%`,
              left: `${(waypoint.position.x * 50) + 50}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Waypoint symbol */}
            <div 
              className={`w-3 h-3 rounded-full border ${
                waypoint.isPassed ? 'bg-transparent border-gray-500' :
                waypoint.isActive ? 'bg-cyan-500 border-cyan-300 animate-pulse' :
                'bg-cyan-800 border-cyan-600'
              }`}
            />
            
            {/* Waypoint name */}
            <div 
              className={`text-[10px] mt-1 ${
                waypoint.isPassed ? 'text-gray-500' :
                waypoint.isActive ? 'text-cyan-300 font-bold' :
                'text-cyan-600'
              }`}
            >
              {waypoint.name}
            </div>
            
            {/* ETA if available */}
            {waypoint.eta && !waypoint.isPassed && (
              <div className="text-[8px] text-gray-400">
                {waypoint.eta}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 