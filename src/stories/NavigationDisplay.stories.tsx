import type { Meta, StoryObj } from '@storybook/react';
import NavigationDisplay from '../components/navigation/NavigationDisplay';

const meta: Meta<typeof NavigationDisplay> = {
  title: 'Navigation/NavigationDisplay',
  component: NavigationDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    initialHeading: {
      control: { type: 'number', min: 0, max: 359 },
      description: 'Initial aircraft heading in degrees',
    },
    initialRange: {
      control: { type: 'select', options: [20, 40, 80, 160] },
      description: 'Initial display range in nautical miles',
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
type Story = StoryObj<typeof NavigationDisplay>;

// Base story with default values
export const Default: Story = {
  args: {
    initialHeading: 0,
    initialRange: 40,
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900" style={{ width: '500px' }}>
        <Story />
      </div>
    ),
  ],
};

// Story with different heading
export const HeadingEast: Story = {
  args: {
    initialHeading: 90,
    initialRange: 40,
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900" style={{ width: '500px' }}>
        <Story />
      </div>
    ),
  ],
};

// Story with extended range
export const ExtendedRange: Story = {
  args: {
    initialHeading: 0,
    initialRange: 80,
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900" style={{ width: '500px' }}>
        <Story />
      </div>
    ),
  ],
};

// Story with custom styling
export const CustomStyling: Story = {
  args: {
    initialHeading: 45,
    initialRange: 40,
    className: 'border border-blue-500',
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900" style={{ width: '500px' }}>
        <Story />
      </div>
    ),
  ],
}; 