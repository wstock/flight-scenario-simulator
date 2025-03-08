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
    initialAltitude: {
      control: { type: 'number' },
      description: 'Initial altitude in feet',
    },
    targetAltitude: {
      control: { type: 'number' },
      description: 'Target altitude in feet',
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
    initialAltitude: 10000,
  },
};

// Story showing climbing to target altitude
export const Climbing: Story = {
  args: {
    initialAltitude: 10000,
    targetAltitude: 15000,
  },
};

// Story showing descending to target altitude
export const Descending: Story = {
  args: {
    initialAltitude: 20000,
    targetAltitude: 15000,
  },
};

// Story with custom styling
export const CustomStyling: Story = {
  args: {
    initialAltitude: 12500,
    className: 'bg-blue-900 border border-blue-700 w-64',
  },
}; 