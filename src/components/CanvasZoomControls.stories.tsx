import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, userEvent, within } from 'storybook/test';
import { CanvasZoomControls } from './CanvasZoomControls';

const meta = {
  title: 'Components/CanvasZoomControls',
  component: CanvasZoomControls,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    zoom: {
      control: { type: 'range', min: 0.1, max: 5, step: 0.1 },
      description: 'Current zoom level (1 = 100%)',
    },
  },
  args: {
    onZoomIn: fn(),
    onZoomOut: fn(),
    onZoomReset: fn(),
  },
} satisfies Meta<typeof CanvasZoomControls>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default zoom controls at 100%
 */
export const Default: Story = {
  args: {
    zoom: 1,
  },
};

/**
 * Zoom controls showing 50% zoom level
 */
export const ZoomedOut: Story = {
  args: {
    zoom: 0.5,
  },
};

/**
 * Zoom controls showing 200% zoom level
 */
export const ZoomedIn: Story = {
  args: {
    zoom: 2,
  },
};

/**
 * Very high zoom level at 500%
 */
export const MaxZoom: Story = {
  args: {
    zoom: 5,
  },
};

/**
 * Test clicking the zoom in button
 */
export const ZoomInInteraction: Story = {
  args: {
    zoom: 1,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Find and click the zoom in button
    const zoomInButton = canvas.getByLabelText('Zoom in');
    await userEvent.click(zoomInButton);

    // Verify the callback was called
    await expect(args.onZoomIn).toHaveBeenCalled();
    await expect(args.onZoomIn).toHaveBeenCalledTimes(1);
  },
};

/**
 * Test clicking the zoom out button
 */
export const ZoomOutInteraction: Story = {
  args: {
    zoom: 1,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Find and click the zoom out button
    const zoomOutButton = canvas.getByLabelText('Zoom out');
    await userEvent.click(zoomOutButton);

    // Verify the callback was called
    await expect(args.onZoomOut).toHaveBeenCalled();
    await expect(args.onZoomOut).toHaveBeenCalledTimes(1);
  },
};

/**
 * Test clicking the reset zoom button
 */
export const ResetZoomInteraction: Story = {
  args: {
    zoom: 2.5,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Find and click the reset button (shows zoom percentage)
    const resetButton = canvas.getByText('250%');
    await userEvent.click(resetButton);

    // Verify the callback was called
    await expect(args.onZoomReset).toHaveBeenCalled();
    await expect(args.onZoomReset).toHaveBeenCalledTimes(1);
  },
};

/**
 * Test sequential zoom interactions
 */
export const SequentialInteractions: Story = {
  args: {
    zoom: 1,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Click zoom in twice
    const zoomInButton = canvas.getByLabelText('Zoom in');
    await userEvent.click(zoomInButton);
    await userEvent.click(zoomInButton);

    // Click zoom out once
    const zoomOutButton = canvas.getByLabelText('Zoom out');
    await userEvent.click(zoomOutButton);

    // Click reset
    const resetButton = canvas.getByText('100%');
    await userEvent.click(resetButton);

    // Verify all callbacks were called the correct number of times
    await expect(args.onZoomIn).toHaveBeenCalledTimes(2);
    await expect(args.onZoomOut).toHaveBeenCalledTimes(1);
    await expect(args.onZoomReset).toHaveBeenCalledTimes(1);
  },
};
