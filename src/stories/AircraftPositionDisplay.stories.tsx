import type { Meta, StoryObj } from '@storybook/react';
import AircraftPositionDisplay from '../components/navigation/AircraftPositionDisplay';

const meta: Meta<typeof AircraftPositionDisplay> = {
  title: 'Navigation/AircraftPositionDisplay',
  component: AircraftPositionDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    initialPosition: {
      control: 'object',
      description: 'Initial aircraft position (latitude, longitude)',
    },
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
type Story = StoryObj<typeof AircraftPositionDisplay>;

// Base story with default values
export const Default: Story = {
  args: {
    initialPosition: { latitude: 37.6213, longitude: -122.3790 }, // SFO
    heading: 0,
    range: 40,
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900" style={{ width: '400px', height: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

// Story with different heading
export const HeadingEast: Story = {
  args: {
    initialPosition: { latitude: 37.6213, longitude: -122.3790 },
    heading: 90,
    range: 40,
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900" style={{ width: '400px', height: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

// Story with different range
export const ExtendedRange: Story = {
  args: {
    initialPosition: { latitude: 37.6213, longitude: -122.3790 },
    heading: 0,
    range: 80,
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900" style={{ width: '400px', height: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

// Story with custom styling
export const CustomStyling: Story = {
  args: {
    initialPosition: { latitude: 37.6213, longitude: -122.3790 },
    heading: 45,
    range: 40,
    className: 'border border-blue-500',
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900" style={{ width: '400px', height: '400px' }}>
        <Story />
      </div>
    ),
  ],
}; 