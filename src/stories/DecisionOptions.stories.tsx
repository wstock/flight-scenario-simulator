import type { Meta, StoryObj } from '@storybook/react';
import DecisionOptions from '../components/decisions/DecisionOptions';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const meta: Meta<typeof DecisionOptions> = {
  title: 'Decisions/DecisionOptions',
  component: DecisionOptions,
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
    onDecisionMade: {
      action: 'decisionMade',
      description: 'Callback when a decision is made',
    },
  },
  decorators: [
    (Story) => (
      <>
        <Story />
        <ToastContainer position="bottom-right" />
      </>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DecisionOptions>;

// Base story with default values (demo decision)
export const Default: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900" style={{ width: '600px' }}>
        <div className="w-full">
          <Story />
        </div>
      </div>
    ),
  ],
};

// Story with no active decision
export const NoActiveDecision: Story = {
  args: {
    scenarioId: 'non-existent-id', // This will cause no decision to be found
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900" style={{ width: '600px' }}>
        <div className="w-full">
          <Story />
        </div>
      </div>
    ),
  ],
};

// Story with custom styling
export const CustomStyling: Story = {
  args: {
    className: 'border border-blue-500',
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900" style={{ width: '600px' }}>
        <div className="w-full">
          <Story />
        </div>
      </div>
    ),
  ],
}; 