import type { Meta, StoryObj } from '@storybook/react';
import HeadingDisplay from '../components/dashboard/HeadingDisplay';

const meta: Meta<typeof HeadingDisplay> = {
  title: 'Dashboard/HeadingDisplay',
  component: HeadingDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    initialHeading: {
      control: { type: 'number', min: 0, max: 359 },
      description: 'Initial heading in degrees',
    },
    targetHeading: {
      control: { type: 'number', min: 0, max: 359 },
      description: 'Target heading in degrees',
    },
    turnRate: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Turn rate in degrees per second',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HeadingDisplay>;

// Base story with default values
export const Default: Story = {
  args: {
    initialHeading: 0,
  },
};

// Story showing turning right
export const TurningRight: Story = {
  args: {
    initialHeading: 0,
    targetHeading: 90,
    turnRate: 3,
  },
};

// Story showing turning left
export const TurningLeft: Story = {
  args: {
    initialHeading: 90,
    targetHeading: 0,
    turnRate: 3,
  },
};

// Story with custom styling
export const CustomStyling: Story = {
  args: {
    initialHeading: 45,
    className: 'bg-blue-900 border border-blue-700 w-64',
  },
}; 