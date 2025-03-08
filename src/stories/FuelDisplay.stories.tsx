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
    fuel: {
      control: { type: 'number', min: 0, max: 20000 },
      description: 'Current fuel in pounds',
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
    fuel: 15000,
  },
};

// Story with low fuel
export const LowFuel: Story = {
  args: {
    fuel: 2500,
  },
};

// Story with caution fuel level
export const CautionFuel: Story = {
  args: {
    fuel: 5000,
  },
};

// Story with custom styling
export const CustomStyling: Story = {
  args: {
    fuel: 10000,
    className: 'bg-blue-900 border border-blue-700 w-64',
  },
}; 