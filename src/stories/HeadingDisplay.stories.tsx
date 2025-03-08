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
    heading: {
      control: { type: 'number', min: 0, max: 359 },
      description: 'Current heading in degrees',
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
    heading: 0,
  },
};

// Story with East heading
export const East: Story = {
  args: {
    heading: 90,
  },
};

// Story with South heading
export const South: Story = {
  args: {
    heading: 180,
  },
};

// Story with West heading
export const West: Story = {
  args: {
    heading: 270,
  },
};

// Story with custom styling
export const CustomStyling: Story = {
  args: {
    heading: 45,
    className: 'bg-blue-900 border border-blue-700 w-64',
  },
}; 