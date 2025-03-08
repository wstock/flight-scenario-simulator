import type { Meta, StoryObj } from '@storybook/react';
import WeatherOverlay from '../components/navigation/WeatherOverlay';
import AircraftPositionDisplay from '../components/navigation/AircraftPositionDisplay';

const meta: Meta<typeof WeatherOverlay> = {
  title: 'Navigation/WeatherOverlay',
  component: WeatherOverlay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    heading: {
      control: { type: 'number', min: 0, max: 359 },
      description: 'Aircraft heading in degrees',
    },
    range: {
      control: { type: 'number', min: 10, max: 100, step: 10 },
      description: 'Display range in nautical miles',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
    scenarioId: {
      control: { type: 'text' },
      description: 'ID of the scenario for real-time updates',
    },
  },
};

export default meta;
type Story = StoryObj<typeof WeatherOverlay>;

// Base story with default values
export const Default: Story = {
  args: {
    heading: 0,
    range: 40,
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900" style={{ width: '400px', height: '400px' }}>
        <div className="relative w-full h-full">
          <AircraftPositionDisplay 
            heading={0}
            range={40}
          />
          <Story />
        </div>
      </div>
    ),
  ],
};

// Story with different heading
export const HeadingEast: Story = {
  args: {
    heading: 90,
    range: 40,
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900" style={{ width: '400px', height: '400px' }}>
        <div className="relative w-full h-full">
          <AircraftPositionDisplay 
            heading={90}
            range={40}
          />
          <Story />
        </div>
      </div>
    ),
  ],
};

// Story with different range
export const ExtendedRange: Story = {
  args: {
    heading: 0,
    range: 80,
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900" style={{ width: '400px', height: '400px' }}>
        <div className="relative w-full h-full">
          <AircraftPositionDisplay 
            heading={0}
            range={80}
          />
          <Story />
        </div>
      </div>
    ),
  ],
}; 