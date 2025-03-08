import type { Meta, StoryObj } from '@storybook/react';
import AltitudeDisplay from '../components/dashboard/AltitudeDisplay';

const meta: Meta<typeof AltitudeDisplay> = {
  title: 'Dashboard/AltitudeDisplay',
  component: AltitudeDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    altitude: {
      control: { type: 'number' },
      description: 'Current altitude in feet',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AltitudeDisplay>;

// Base story with default values
export const Default: Story = {
  args: {
    altitude: 10000,
  },
};

// Story with high altitude
export const HighAltitude: Story = {
  args: {
    altitude: 35000,
  },
};

// Story with low altitude
export const LowAltitude: Story = {
  args: {
    altitude: 2500,
  },
};

// Story with custom styling
export const CustomStyling: Story = {
  args: {
    altitude: 12500,
    className: 'bg-blue-900 border border-blue-700 w-64',
  },
}; 