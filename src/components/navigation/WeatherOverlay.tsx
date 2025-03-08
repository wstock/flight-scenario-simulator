"use client";

import { useState, useEffect } from 'react';

interface WeatherCell {
  intensity: 'light' | 'moderate' | 'heavy';
  position: {
    x: number; // -1 to 1 relative to center
    y: number; // -1 to 1 relative to center
  };
  size: number; // Size in relative units (0-1)
}

interface WeatherCondition {
  visibility: number; // miles
  wind_speed: number; // knots
  wind_direction: number; // degrees
  temperature: number; // celsius
  precipitation: string; // none, light, moderate, heavy
  cloud_cover: string; // clear, few, scattered, broken, overcast
  turbulence: string; // none, light, moderate, severe
  icing: string; // none, light, moderate, severe
  thunderstorms: boolean;
  ceiling: number; // feet
}

interface WeatherData {
  id: string;
  scenario_id: string;
  weather_data: WeatherCondition | WeatherCell[];
}

interface WeatherOverlayProps {
  className?: string;
  scenarioId?: string;
  heading?: number;
  range?: number; // Display range in nautical miles
}

/**
 * WeatherOverlay component shows weather conditions on the navigation display
 */
export default function WeatherOverlay({
  className = '',
  scenarioId,
  heading = 0,
  range = 40,
}: WeatherOverlayProps) {
  const [weatherCells, setWeatherCells] = useState<WeatherCell[]>([]);
  
  // Set up polling for weather updates (replacing Supabase subscription)
  useEffect(() => {
    if (!scenarioId) {
      // Generate demo weather if no scenario ID
      generateDemoWeather();
      return;
    }
    
    // Initial fetch of weather data
    fetchWeatherData();
    
    // Set up polling interval to check for updates
    const intervalId = setInterval(() => {
      fetchWeatherData();
    }, 5000); // Poll every 5 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, [scenarioId]);
  
  // Fetch initial weather data
  const fetchWeatherData = async () => {
    if (!scenarioId) return;
    
    try {
      const response = await fetch(`/api/scenarios/weather?scenarioId=${scenarioId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching weather data: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Extract weather data from the response
        const weatherData = result.data.weather_data;
        
        if (Array.isArray(weatherData)) {
          // If it's already an array of weather cells, use it directly
          setWeatherCells(weatherData as WeatherCell[]);
        } else if (weatherData && typeof weatherData === 'object') {
          // If it's a weather condition object, generate cells based on the conditions
          console.log('Weather data is a condition object:', weatherData);
          
          // Generate weather cells based on the weather conditions
          const cells = generateWeatherCellsFromCondition(weatherData as WeatherCondition);
          setWeatherCells(cells);
        } else {
          console.error('Weather data is not a valid format:', weatherData);
          setWeatherCells([]);
        }
      } else {
        // Set empty array if no weather data
        setWeatherCells([]);
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherCells([]);
    }
  };
  
  // Generate weather cells from a weather condition object
  const generateWeatherCellsFromCondition = (condition: WeatherCondition): WeatherCell[] => {
    const cells: WeatherCell[] = [];
    
    // Only generate cells if there's some form of precipitation or thunderstorms
    if (condition.precipitation !== 'none' || condition.thunderstorms) {
      // Create different patterns based on conditions
      
      // For precipitation
      if (condition.precipitation !== 'none') {
        const intensity = condition.precipitation as 'light' | 'moderate' | 'heavy';
        
        // Number of cells based on intensity
        const cellCount = intensity === 'light' ? 3 : 
                          intensity === 'moderate' ? 6 : 9;
        
        // Generate random cells
        for (let i = 0; i < cellCount; i++) {
          // Random position within the display range
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * 0.8; // max 80% from center
          
          cells.push({
            intensity,
            position: {
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance
            },
            size: 0.1 + (Math.random() * 0.15) // Size between 0.1 and 0.25
          });
        }
      }
      
      // Add thunderstorm cells if present
      if (condition.thunderstorms) {
        // Add 2-3 thunderstorm cells (represented as 'heavy')
        const thunderCount = 2 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < thunderCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * 0.7; // max 70% from center
          
          cells.push({
            intensity: 'heavy',
            position: {
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance
            },
            size: 0.2 + (Math.random() * 0.15) // Size between 0.2 and 0.35
          });
        }
      }
    }
    
    return cells;
  };
  
  // Generate demo weather cells for preview
  const generateDemoWeather = () => {
    const demoWeather: WeatherCell[] = [
      {
        intensity: 'light',
        position: { x: 0.3, y: 0.2 },
        size: 0.15,
      },
      {
        intensity: 'moderate',
        position: { x: -0.4, y: -0.3 },
        size: 0.2,
      },
      {
        intensity: 'heavy',
        position: { x: 0.1, y: -0.5 },
        size: 0.25,
      },
    ];
    
    setWeatherCells(demoWeather);
  };
  
  // Get color based on weather intensity
  const getWeatherColor = (intensity: WeatherCell['intensity']) => {
    switch (intensity) {
      case 'light':
        return 'rgba(0, 255, 0, 0.3)'; // Green with transparency
      case 'moderate':
        return 'rgba(255, 255, 0, 0.4)'; // Yellow with transparency
      case 'heavy':
        return 'rgba(255, 0, 0, 0.5)'; // Red with transparency
      default:
        return 'rgba(0, 255, 0, 0.3)';
    }
  };
  
  // Calculate rotation to keep weather fixed relative to ground
  const compassRotation = `rotate(${-heading}deg)`;
  
  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Weather cells container - rotates with compass */}
      <div 
        className="absolute inset-0"
        style={{ transform: compassRotation }}
      >
        {Array.isArray(weatherCells) && weatherCells.map((cell, index) => (
          <div
            key={index}
            className="absolute rounded-full blur-sm"
            style={{
              backgroundColor: getWeatherColor(cell.intensity),
              width: `${cell.size * 100}%`,
              height: `${cell.size * 100}%`,
              top: `${50 + cell.position.y * 50}%`,
              left: `${50 + cell.position.x * 50}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>
    </div>
  );
} 