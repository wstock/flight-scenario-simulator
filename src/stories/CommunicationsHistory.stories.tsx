import type { Meta, StoryObj } from '@storybook/react';
import CommunicationsHistory from '../components/communications/CommunicationsHistory';

const meta: Meta<typeof CommunicationsHistory> = {
  title: 'Communications/CommunicationsHistory',
  component: CommunicationsHistory,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
    scenarioId: {
      control: { type: 'text' },
      description: 'ID of the scenario for real-time updates',
    },
    maxItems: {
      control: { type: 'number', min: 5, max: 100 },
      description: 'Maximum number of communications to display',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CommunicationsHistory>;

// Base story with default values
export const Default: Story = {
  args: {
    maxItems: 50,
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900" style={{ width: '500px', height: '600px' }}>
        <div className="w-full h-full">
          <Story />
        </div>
      </div>
    ),
  ],
};

// Story with fewer items
export const FewerItems: Story = {
  args: {
    maxItems: 5,
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900" style={{ width: '500px', height: '400px' }}>
        <div className="w-full h-full">
          <Story />
        </div>
      </div>
    ),
  ],
};

// Story with custom styling
export const CustomStyling: Story = {
  args: {
    maxItems: 50,
    className: 'border border-blue-500 h-full',
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900" style={{ width: '500px', height: '600px' }}>
        <div className="w-full h-full">
          <Story />
        </div>
      </div>
    ),
  ],
}; 