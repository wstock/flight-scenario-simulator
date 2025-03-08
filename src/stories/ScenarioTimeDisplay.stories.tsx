import type { Meta, StoryObj } from '@storybook/react';
import ScenarioTimeDisplay from '../components/dashboard/ScenarioTimeDisplay';
import { useState, useEffect } from 'react';

// Mock component for Storybook since we can't connect to real data
const MockScenarioTimeDisplay = ({ className = '' }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isPaused]);
  
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };
  
  return (
    <div className={`bg-neutral-800 rounded-lg p-4 flex flex-col items-center ${className}`}>
      <span className="text-sm text-neutral-400 mb-1">Scenario Time</span>
      <span className="text-2xl font-bold">{formatTime(elapsedSeconds)}</span>
      {isPaused && <span className="text-xs text-yellow-500 mt-1">PAUSED</span>}
      <button 
        className="mt-2 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
        onClick={() => setIsPaused(!isPaused)}
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>
    </div>
  );
};

const meta: Meta<typeof MockScenarioTimeDisplay> = {
  title: 'Dashboard/ScenarioTimeDisplay',
  component: MockScenarioTimeDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MockScenarioTimeDisplay>;

// Base story with default values
export const Default: Story = {
  args: {},
};

// Story with custom styling
export const CustomStyling: Story = {
  args: {
    className: 'bg-blue-900 border border-blue-700 w-64',
  },
}; 