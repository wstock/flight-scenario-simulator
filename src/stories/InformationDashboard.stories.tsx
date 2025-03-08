import type { Meta, StoryObj } from '@storybook/react';
import InformationDashboard from '../components/dashboard/InformationDashboard';

const meta: Meta<typeof InformationDashboard> = {
  title: 'Dashboard/InformationDashboard',
  component: InformationDashboard,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof InformationDashboard>;

// Base story with default values
export const Default: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900 min-h-screen">
        <Story />
      </div>
    ),
  ],
};

// Story with custom styling
export const CustomStyling: Story = {
  args: {
    className: 'p-4 bg-blue-950 rounded-lg',
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-900 min-h-screen">
        <Story />
      </div>
    ),
  ],
}; 