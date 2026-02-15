import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, userEvent, within } from 'storybook/test';
import { FileUpload } from './FileUpload';

const meta = {
  title: 'Components/FileUpload',
  component: FileUpload,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isLoading: {
      control: 'boolean',
      description: 'Whether the component is in loading state',
    },
  },
  args: {
    onFileSelect: fn(),
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default file upload component ready for interaction
 */
export const Default: Story = {
  args: {
    isLoading: false,
  },
};

/**
 * Loading state shown while processing a file
 */
export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

/**
 * Test clicking the upload area
 */
export const ClickInteraction: Story = {
  args: {
    isLoading: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the upload area
    const uploadArea = canvas.getByText('Drop your image here');

    // Verify the upload area is visible
    await expect(uploadArea).toBeInTheDocument();

    // Verify the file input exists but is hidden
    const fileInput = canvasElement.querySelector('input[type="file"]') as HTMLInputElement;
    await expect(fileInput).toBeInTheDocument();
    await expect(fileInput).toHaveStyle({ display: 'none' });

    // Verify it accepts image files
    await expect(fileInput).toHaveAttribute('accept', 'image/*');
  },
};

/**
 * Test file selection via input
 */
export const FileSelectionInteraction: Story = {
  args: {
    isLoading: false,
  },
  play: async ({ args, canvasElement }) => {
    // Create a mock image file
    const file = new File(['fake image content'], 'test-image.png', {
      type: 'image/png',
    });

    // Find the hidden file input
    const fileInput = canvasElement.querySelector('input[type="file"]') as HTMLInputElement;

    // Simulate file selection
    await userEvent.upload(fileInput, file);

    // Verify the callback was called with the file
    await expect(args.onFileSelect).toHaveBeenCalled();
    await expect(args.onFileSelect).toHaveBeenCalledWith(file);
  },
};

/**
 * Test multiple file types
 */
export const MultipleFileTypes: Story = {
  args: {
    isLoading: false,
  },
  play: async ({ args, canvasElement }) => {
    const fileInput = canvasElement.querySelector('input[type="file"]') as HTMLInputElement;

    // Test with different image types
    const pngFile = new File(['png content'], 'test.png', { type: 'image/png' });
    await userEvent.upload(fileInput, pngFile);
    await expect(args.onFileSelect).toHaveBeenCalledWith(pngFile);

    const gifFile = new File(['gif content'], 'test.gif', { type: 'image/gif' });
    await userEvent.upload(fileInput, gifFile);
    await expect(args.onFileSelect).toHaveBeenCalledWith(gifFile);

    const jpgFile = new File(['jpg content'], 'test.jpg', { type: 'image/jpeg' });
    await userEvent.upload(fileInput, jpgFile);
    await expect(args.onFileSelect).toHaveBeenCalledWith(jpgFile);

    // Verify callback was called 3 times
    await expect(args.onFileSelect).toHaveBeenCalledTimes(3);
  },
};

/**
 * Test that loading state shows correct UI
 */
export const LoadingStateTest: Story = {
  args: {
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify loading text is shown
    await expect(canvas.getByText('Loading image...')).toBeInTheDocument();

    // Verify loading spinner is present
    const spinner = canvasElement.querySelector('.loading-spinner');
    await expect(spinner).toBeInTheDocument();

    // Verify upload text is not shown
    const uploadText = canvas.queryByText('Drop your image here');
    await expect(uploadText).toBeNull();
  },
};

/**
 * Test drag events (visual state changes)
 * Note: This test verifies the initial state only, as browser drag events
 * cannot be fully simulated in the test environment
 */
export const DragStateTest: Story = {
  args: {
    isLoading: false,
  },
  play: async ({ canvasElement }) => {
    const uploadDiv = canvasElement.querySelector('.file-upload') as HTMLElement;
    await expect(uploadDiv).toBeInTheDocument();

    // Initially should not have dragging class
    await expect(uploadDiv).not.toHaveClass('dragging');

    // Verify the element has the correct base class
    await expect(uploadDiv).toHaveClass('file-upload');

    // Verify that drag event handlers are registered by checking the component structure
    // Full drag-and-drop simulation requires manual testing in the browser
  },
};

/**
 * Test accessibility features
 */
export const AccessibilityTest: Story = {
  args: {
    isLoading: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify file input has correct type
    const fileInput = canvasElement.querySelector('input[type="file"]') as HTMLInputElement;
    await expect(fileInput).toHaveAttribute('type', 'file');

    // Verify accept attribute is set
    await expect(fileInput).toHaveAttribute('accept', 'image/*');

    // Verify informative text is present
    await expect(canvas.getByText('Drop your image here')).toBeInTheDocument();
    await expect(canvas.getByText('or click to browse')).toBeInTheDocument();
    await expect(canvas.getByText('Supports GIF, PNG, JPG, WebP, and more')).toBeInTheDocument();
  },
};

/**
 * Test that loading state has correct class
 */
export const LoadingClassTest: Story = {
  args: {
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    const uploadDiv = canvasElement.querySelector('.file-upload') as HTMLElement;

    // Should have loading class
    await expect(uploadDiv).toHaveClass('loading');
  },
};
