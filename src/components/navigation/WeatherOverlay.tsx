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

interface WeatherData {
  weather_data: WeatherCell[];
  scenario_id: string;
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
      
      if (result.success && result.data && result.data.weather_data) {
        // Make sure we're working with an array of weather cells
        const weatherData = result.data.weather_data;
        
        if (Array.isArray(weatherData)) {
          setWeatherCells(weatherData as WeatherCell[]);
        } else {
          console.error('Weather data is not an array:', weatherData);
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