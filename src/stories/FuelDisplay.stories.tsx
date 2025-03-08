import type { Meta, StoryObj } from '@storybook/react';
import FuelDisplay from '../components/dashboard/FuelDisplay';

const meta: Meta<typeof FuelDisplay> = {
  title: 'Dashboard/FuelDisplay',
  component: FuelDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    initialFuel: {
      control: { type: 'number' },
      description: 'Initial fuel in pounds',
    },
    maxFuel: {
      control: { type: 'number' },
      description: 'Maximum fuel capacity in pounds',
    },
    fuelBurnRate: {
      control: { type: 'number' },
      description: 'Fuel burn rate in pounds per second',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FuelDisplay>;

// Base story with default values
export const Default: Story = {
  args: {
    initialFuel: 15000,
    maxFuel: 20000,
    fuelBurnRate: 10,
  },
};

// Story showing low fuel state
export const LowFuel: Story = {
  args: {
    initialFuel: 3000,
    maxFuel: 20000,
    fuelBurnRate: 10,
  },
};

// Story showing critical fuel state
export const CriticalFuel: Story = {
  args: {
    initialFuel: 1500,
    maxFuel: 20000,
    fuelBurnRate: 10,
  },
};

// Story with custom styling
export const CustomStyling: Story = {
  args: {
    initialFuel: 15000,
    maxFuel: 20000,
    fuelBurnRate: 10,
    className: 'bg-blue-900 border border-blue-700 w-64',
  },
}; 