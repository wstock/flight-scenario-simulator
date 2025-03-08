import type { Meta, StoryObj } from '@storybook/react';
import ScenarioTimeDisplay from '../components/dashboard/ScenarioTimeDisplay';

const meta: Meta<typeof ScenarioTimeDisplay> = {
  title: 'Dashboard/ScenarioTimeDisplay',
  component: ScenarioTimeDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    initialTime: {
      control: 'date',
      description: 'Initial scenario time',
    },
    timeScale: {
      control: { type: 'number', min: 1, max: 60 },
      description: 'Time acceleration factor (1 = real-time, 2 = 2x speed, etc.)',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ScenarioTimeDisplay>;

// Base story with default values (real-time)
export const Default: Story = {
  args: {
    initialTime: new Date(),
    timeScale: 1,
  },
};

// Story with accelerated time (5x)
export const AcceleratedTime: Story = {
  args: {
    initialTime: new Date(),
    timeScale: 5,
  },
};

// Story with specific initial time
export const CustomTime: Story = {
  args: {
    initialTime: new Date('2023-06-15T14:30:00'),
    timeScale: 1,
  },
};

// Story with custom styling
export const CustomStyling: Story = {
  args: {
    initialTime: new Date(),
    timeScale: 1,
    className: 'bg-blue-900 border border-blue-700 w-64',
  },
}; 