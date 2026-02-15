import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { StorageIndicator } from './StorageIndicator';

const meta = {
  title: 'Components/StorageIndicator',
  component: StorageIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    currentFrameSize: {
      control: 'number',
      description: 'Size of the current frame in bytes',
    },
    totalSize: {
      control: 'number',
      description: 'Total size of all frames in bytes',
    },
    originalFileSize: {
      control: 'number',
      description: 'Original file size (optional)',
    },
  },
} satisfies Meta<typeof StorageIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Small GIF with a few frames (typical use case)
 */
export const SmallGIF: Story = {
  args: {
    currentFrameSize: 256 * 256 * 4, // 256KB for a 256x256 frame
    totalSize: 256 * 256 * 4 * 10, // 10 frames
    originalFileSize: 85 * 1024, // 85KB compressed
  },
};

/**
 * Medium-sized GIF with moderate number of frames
 */
export const MediumGIF: Story = {
  args: {
    currentFrameSize: 512 * 512 * 4, // 1MB for a 512x512 frame
    totalSize: 512 * 512 * 4 * 30, // 30 frames
    originalFileSize: 450 * 1024, // 450KB compressed
  },
};

/**
 * Large GIF with many frames
 */
export const LargeGIF: Story = {
  args: {
    currentFrameSize: 800 * 600 * 4, // ~1.8MB for a 800x600 frame
    totalSize: 800 * 600 * 4 * 100, // 100 frames
    originalFileSize: 2.5 * 1024 * 1024, // 2.5MB compressed
  },
};

/**
 * Very large GIF showing size warnings
 */
export const VeryLargeGIF: Story = {
  args: {
    currentFrameSize: 1920 * 1080 * 4, // ~8MB for a 1080p frame
    totalSize: 1920 * 1080 * 4 * 200, // 200 frames
    originalFileSize: 15 * 1024 * 1024, // 15MB compressed
  },
};

/**
 * Without original file size (shows estimated size)
 */
export const EstimatedSize: Story = {
  args: {
    currentFrameSize: 500 * 500 * 4,
    totalSize: 500 * 500 * 4 * 20,
    // No originalFileSize - will show estimate
  },
};

/**
 * Component should not render when data is missing
 */
export const NoData: Story = {
  args: {
    // No data provided
  },
  play: async ({ canvasElement }) => {
    // Component should not render anything
    const indicator = canvasElement.querySelector('.storage-indicator');
    await expect(indicator).toBeNull();
  },
};

/**
 * Component should not render with partial data
 */
export const PartialData: Story = {
  args: {
    currentFrameSize: 256 * 256 * 4,
    // Missing totalSize
  },
  play: async ({ canvasElement }) => {
    // Component should not render without complete data
    const indicator = canvasElement.querySelector('.storage-indicator');
    await expect(indicator).toBeNull();
  },
};

/**
 * Test that all three indicators are displayed
 */
export const DisplayAllIndicators: Story = {
  args: {
    currentFrameSize: 256 * 256 * 4,
    totalSize: 256 * 256 * 4 * 10,
    originalFileSize: 85 * 1024,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all three labels are present
    await expect(canvas.getByText('Current Frame:')).toBeInTheDocument();
    await expect(canvas.getByText('Raw Storage:')).toBeInTheDocument();
    await expect(canvas.getByText('Original GIF:')).toBeInTheDocument();
  },
};

/**
 * Test estimated label when original size is not provided
 */
export const EstimatedLabelTest: Story = {
  args: {
    currentFrameSize: 256 * 256 * 4,
    totalSize: 256 * 256 * 4 * 10,
    // No originalFileSize
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show estimated label instead of original
    await expect(canvas.getByText('Est. GIF Size:')).toBeInTheDocument();

    // Should NOT show original label
    const originalLabel = canvas.queryByText('Original GIF:');
    await expect(originalLabel).toBeNull();
  },
};

/**
 * Test that byte formatting is working
 */
export const ByteFormattingTest: Story = {
  args: {
    currentFrameSize: 2 * 1024 * 1024, // 2MB
    totalSize: 50 * 1024 * 1024, // 50MB
    originalFileSize: 1.5 * 1024 * 1024, // 1.5MB
  },
  play: async ({ canvasElement }) => {
    // Query using native DOM methods
    const values = canvasElement.querySelectorAll('.storage-indicator-value');
    await expect(values).toHaveLength(3);

    // Each value should contain a unit
    for (const value of values) {
      const text = value.textContent || '';
      const hasUnit = text.includes('B') || text.includes('KB') ||
                      text.includes('MB') || text.includes('GB');
      await expect(hasUnit).toBe(true);
    }
  },
};
