"use client";

import { useState, useEffect } from 'react';

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
  
  // Set up polling for waypoint updates (replacing Supabase subscription)
  useEffect(() => {
    if (!scenarioId) {
      // Generate demo waypoints if no scenario ID
      generateDemoWaypoints();
      return;
    }
    
    // Initial fetch of waypoints
    fetchWaypoints();
    
    // Set up polling interval to check for updates
    const intervalId = setInterval(() => {
      fetchWaypoints();
    }, 5000); // Poll every 5 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, [scenarioId]);
  
  // Fetch waypoints data
  const fetchWaypoints = async () => {
    if (!scenarioId) return;
    
    try {
      const response = await fetch(`/api/scenarios/waypoints?scenarioId=${scenarioId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching waypoints: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Transform data to our Waypoint format
        const transformedWaypoints: Waypoint[] = result.data.map((wp: any) => ({
          id: wp.id,
          name: wp.name,
          position: {
            x: typeof wp.position_x === 'number' ? wp.position_x : 0,
            y: typeof wp.position_y === 'number' ? wp.position_y : 0,
          },
          isActive: wp.is_active,
          isPassed: wp.is_passed,
          eta: wp.eta,
        }));
        
        setWaypoints(transformedWaypoints);
        
        // Generate flight path from waypoints with validation
        const path = transformedWaypoints
          .filter(wp => 
            typeof wp.position?.x === 'number' && 
            !isNaN(wp.position.x) && 
            typeof wp.position?.y === 'number' && 
            !isNaN(wp.position.y)
          )
          .map(wp => [
            wp.position.x,
            wp.position.y,
          ]) as [number, number][];
        
        setFlightPath(path);
      } else {
        // Reset to empty if no data
        setWaypoints([]);
        setFlightPath([]);
      }
    } catch (error) {
      console.error('Error fetching waypoints:', error);
      // Reset on error
      setWaypoints([]);
      setFlightPath([]);
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
    
    try {
      // Convert relative coordinates to SVG coordinates (percentage-based)
      const svgPath = flightPath.map((point, index) => {
        // Ensure we have valid numbers
        if (!Array.isArray(point) || point.length !== 2 || 
            typeof point[0] !== 'number' || isNaN(point[0]) || 
            typeof point[1] !== 'number' || isNaN(point[1])) {
          return '';
        }
        
        const x = (point[0] * 50) + 50; // Convert -1...1 to 0...100
        const y = (point[1] * 50) + 50; // Convert -1...1 to 0...100
        
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).filter(Boolean).join(' ');
      
      return svgPath || 'M 0 0'; // Provide a fallback valid path if empty
    } catch (error) {
      console.error('Error generating SVG path:', error);
      return 'M 0 0'; // Default valid path on error
    }
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