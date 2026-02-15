# Storybook Testing Documentation

This project uses [Storybook](https://storybook.js.org/) for component development and testing. Storybook provides an isolated environment to develop, test, and document UI components.

## 🚀 Getting Started

### Running Storybook

Start the Storybook development server:

```bash
npm run storybook
```

This will open Storybook at [http://localhost:6006](http://localhost:6006)

### Building Storybook

Build a static version of Storybook for deployment:

```bash
npm run build-storybook
```

The built files will be in `storybook-static/`

## 🧪 Running Tests

### Run All Tests

Execute all Storybook tests using Vitest:

```bash
npm run test-storybook
```

### Interactive Test UI

Run tests with an interactive UI for debugging:

```bash
npm run test-storybook:ui
```

### Coverage Reports

Generate test coverage reports:

```bash
npm run test-storybook:coverage
```

## 📦 What's Included

### Testing Addons

1. **@storybook/addon-vitest** - Integration with Vitest for running story-based tests
2. **@storybook/addon-a11y** - Accessibility testing to catch a11y violations
3. **@storybook/addon-docs** - Auto-generated documentation for components
4. **@chromatic-com/storybook** - Visual regression testing support

### Test Utilities

The project uses `storybook/test` which provides:

- `expect` - Assertion library
- `userEvent` - Simulate user interactions
- `within` - Query elements within a scope
- `fn` - Create mock functions for callbacks

## 📝 Example Stories with Tests

### CanvasZoomControls

Location: [`src/components/CanvasZoomControls.stories.tsx`](src/components/CanvasZoomControls.stories.tsx)

**Stories:**
- Default, ZoomedOut, ZoomedIn, MaxZoom - Visual states
- ZoomInInteraction, ZoomOutInteraction, ResetZoomInteraction - Button click tests
- SequentialInteractions - Complex multi-step interaction test

**Key Tests:**
```typescript
// Test clicking zoom in button
export const ZoomInInteraction: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const zoomInButton = canvas.getByLabelText('Zoom in');
    await userEvent.click(zoomInButton);
    await expect(args.onZoomIn).toHaveBeenCalled();
  },
};
```

### StorageIndicator

Location: [`src/components/StorageIndicator.stories.tsx`](src/components/StorageIndicator.stories.tsx)

**Stories:**
- SmallGIF, MediumGIF, LargeGIF, VeryLargeGIF - Different data sizes
- EstimatedSize - Without original file size
- NoData, PartialData - Edge cases
- DisplayAllIndicators - DOM verification
- ByteFormattingTest - Format validation

**Key Tests:**
```typescript
// Test all indicators are displayed
export const DisplayAllIndicators: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Current Frame:')).toBeInTheDocument();
    await expect(canvas.getByText('Raw Storage:')).toBeInTheDocument();
    await expect(canvas.getByText('Original GIF:')).toBeInTheDocument();
  },
};
```

### FileUpload

Location: [`src/components/FileUpload.stories.tsx`](src/components/FileUpload.stories.tsx)

**Stories:**
- Default, Loading - Visual states
- ClickInteraction - Click to upload test
- FileSelectionInteraction - File input test
- MultipleFileTypes - Test different image formats
- DragStateTest - Drag and drop visual feedback
- LoadingStateTest, AccessibilityTest - State and a11y verification

**Key Tests:**
```typescript
// Test file selection
export const FileSelectionInteraction: Story = {
  play: async ({ args, canvasElement }) => {
    const file = new File(['fake image content'], 'test-image.png', {
      type: 'image/png',
    });
    const fileInput = canvasElement.querySelector('input[type="file"]');
    await userEvent.upload(fileInput, file);
    await expect(args.onFileSelect).toHaveBeenCalledWith(file);
  },
};
```

## ✍️ Writing Your Own Stories

### Basic Story Structure

```typescript
import type { Meta, StoryObj } from '@storybook/react-vite';
import { YourComponent } from './YourComponent';

const meta = {
  title: 'Components/YourComponent',
  component: YourComponent,
  parameters: {
    layout: 'centered', // or 'fullscreen', 'padded'
  },
  tags: ['autodocs'],
} satisfies Meta<typeof YourComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Your component props
  },
};
```

### Adding Interaction Tests

```typescript
import { expect, userEvent, within, fn } from 'storybook/test';

export const WithInteraction: Story = {
  args: {
    onClick: fn(), // Mock function to spy on
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Find elements
    const button = canvas.getByRole('button');

    // Simulate user actions
    await userEvent.click(button);

    // Assertions
    await expect(args.onClick).toHaveBeenCalled();
    await expect(button).toHaveTextContent('Clicked');
  },
};
```

### Testing Patterns

#### 1. Testing Component Rendering
```typescript
await expect(canvas.getByText('Hello')).toBeInTheDocument();
```

#### 2. Testing User Interactions
```typescript
await userEvent.click(button);
await userEvent.type(input, 'text');
await userEvent.hover(element);
```

#### 3. Testing Callbacks
```typescript
args: { onClick: fn() }
// ... in play function:
await expect(args.onClick).toHaveBeenCalled();
await expect(args.onClick).toHaveBeenCalledTimes(2);
await expect(args.onClick).toHaveBeenCalledWith(expectedValue);
```

#### 4. Testing CSS Classes
```typescript
await expect(element).toHaveClass('active');
await expect(element).not.toHaveClass('disabled');
```

#### 5. Testing Attributes
```typescript
await expect(input).toHaveAttribute('type', 'file');
await expect(input).toHaveAttribute('accept', 'image/*');
```

## 🎯 Best Practices

### 1. Story Naming
- Use descriptive names: `Default`, `Loading`, `WithError`
- Use interaction suffix for test stories: `ClickInteraction`, `FormSubmitInteraction`

### 2. Visual vs. Test Stories
- Create visual stories for design review
- Create separate test stories for complex interactions
- Use the `play` function for automated tests

### 3. Accessibility
- Use semantic queries: `getByRole`, `getByLabelText`
- Test keyboard navigation
- Verify ARIA attributes
- Check the a11y addon panel for violations

### 4. Test Coverage
- Test happy paths (normal usage)
- Test edge cases (empty data, missing props)
- Test error states
- Test loading states
- Test accessibility

### 5. Organize Stories
- Group related stories together
- Use consistent naming conventions
- Add documentation comments above stories
- Use `parameters` to customize story display

## 🔍 Debugging Tests

### Using the Vitest UI

The Vitest UI provides a visual interface for debugging:

```bash
npm run test-storybook:ui
```

Features:
- See all tests in a tree view
- Filter tests by name or file
- View test results in real-time
- Inspect test errors with stack traces

### Console Debugging

Add debug statements in your play functions:

```typescript
play: async ({ args, canvasElement }) => {
  console.log('Args:', args);
  const canvas = within(canvasElement);
  const button = canvas.getByRole('button');
  console.log('Button:', button);
  // ...
}
```

### Storybook Dev Tools

In the Storybook UI:
- **Actions** panel - See callback invocations
- **Controls** panel - Adjust props dynamically
- **Accessibility** panel - Check a11y violations
- **Interactions** panel - Step through play function execution

## 📚 Additional Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Writing Stories](https://storybook.js.org/docs/writing-stories)
- [Interaction Testing](https://storybook.js.org/docs/writing-tests/interaction-testing)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)

## 🤝 Contributing

When adding new components:

1. Create a `.stories.tsx` file alongside your component
2. Add visual stories for different states
3. Add interaction tests for user behaviors
4. Test accessibility with semantic queries
5. Document props with JSDoc comments
6. Run tests before committing: `npm run test-storybook`

## 📊 Current Test Coverage

Run coverage reports to see which components have tests:

```bash
npm run test-storybook:coverage
```

### Components with Stories

✅ CanvasZoomControls - 8 stories, interaction tests
✅ StorageIndicator - 11 stories, rendering tests
✅ FileUpload - 9 stories, interaction & accessibility tests

### Next Components to Test

Consider adding stories for:
- CropOverlay
- Timeline
- PreviewModal
- ExportModal
- Sidebar controls (FrameControls, PaddingControls, etc.)
- Layout components

---

**Happy Testing! 🎉**
