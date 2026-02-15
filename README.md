# 🎨 fiGif - In-Browser GIF Editor

A powerful, privacy-focused GIF editor that runs entirely in your browser. No uploads, no backend - all processing happens locally on your machine.

## ✨ Features

### Currently Implemented

- ✅ **Upload GIFs** - Drag & drop or click to browse
- ✅ **Frame-by-frame viewing** - Navigate through individual frames
- ✅ **Playback controls** - Play, pause, and scrub through your GIF
- ✅ **Frame manipulation**
  - Duplicate frames
  - Delete frames
  - Reverse animation
- ✅ **Speed controls** - Make GIFs faster or slower
- ✅ **Zoom & pan** - View GIFs at different zoom levels
- ✅ **Export** - Download edited GIFs

### Coming Soon

- 🚧 Crop & resize tools
- 🚧 Filters & effects (grayscale, brightness, contrast, etc.)
- 🚧 Text overlays
- 🚧 Stickers & emojis
- 🚧 Advanced frame reordering (drag & drop)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/figif.git
cd figif

# Install dependencies
npm install
```

### Available Scripts

#### Development

```bash
# Start development server with HMR at http://localhost:5173
npm run dev
```

#### Building

```bash
# Build for production (runs TypeScript compiler + Vite build)
npm run build

# Preview production build locally
npm run preview
```

#### Code Quality

```bash
# Run ESLint on all TypeScript files
npm run lint

# Husky git hooks are automatically set up on install
npm run prepare
```

#### Storybook

```bash
# Start Storybook dev server at http://localhost:6006
npm run storybook

# Build Storybook for production
npm run build-storybook
```

#### Testing

```bash
# Run Storybook component tests with Vitest
npm run test-storybook

# Run tests with interactive UI
npm run test-storybook:ui

# Run tests with coverage report
npm run test-storybook:coverage
```

## 💻 Development Workflow

### Component Development with Storybook

1. Start Storybook: `npm run storybook`
2. Create/edit components in `src/components/`
3. Create stories in `src/components/*.stories.tsx`
4. View and test components in isolation at `http://localhost:6006`
5. Write component tests alongside stories
6. Run tests: `npm run test-storybook`

### Code Quality Checks

The project uses automated code quality checks:

- **Pre-commit hooks** (via Husky) automatically run on `git commit`
- **ESLint** fixes TypeScript/React issues
- **Stylelint** fixes CSS formatting
- Only properly formatted code can be committed

### Making Changes

1. Make your changes to the code
2. Stage your changes: `git add .`
3. Commit: `git commit -m "your message"`
   - Pre-commit hooks automatically run linters
   - If linting fails, fix issues and try again
4. Push to GitHub: `git push`
   - GitHub Actions automatically builds and deploys to Pages

## 🏗️ Tech Stack

### Core Technologies

- **React 19** - Modern UI framework with latest features
- **TypeScript** - Type-safe development with strict type checking
- **Vite** - Lightning-fast build tool and dev server with HMR
- **HTML5 Canvas** - High-performance frame manipulation and rendering

### GIF Processing

- **gifuct-js** - Fast, efficient GIF decoding library
- **modern-gif** - Modern GIF encoding with optimization
- **upng-js** - PNG compression utilities

### Advanced Features

- **@imgly/background-removal** - AI-powered background removal

## 🛠️ Development Tools

### Build & Development

- **Vite** - Ultra-fast development server with Hot Module Replacement (HMR)
  - Optimized production builds with code splitting
  - Environment variable support
  - TypeScript out-of-the-box
- **PostCSS** with **Autoprefixer** - Automatic vendor prefixing for cross-browser CSS compatibility

### Code Quality & Linting

- **ESLint** - JavaScript/TypeScript linting with recommended rules
  - React Hooks rules for proper hook usage
  - React Refresh integration for fast refresh during development
  - Storybook-specific linting rules
- **Stylelint** - CSS linting with standard configuration
- **TypeScript Compiler** - Strict type checking and compilation

### Git Hooks & Pre-commit

- **Husky** - Git hooks management for enforcing code quality
- **lint-staged** - Run linters on staged files before commit
  - Automatically runs ESLint on `.ts` and `.tsx` files
  - Automatically runs Stylelint on `.css` files

### Component Development & Documentation

- **Storybook** - Isolated component development and living documentation
  - **Framework**: React with Vite integration
  - **Addons**:
    - `@storybook/addon-docs` - Auto-generated component documentation
    - `@storybook/addon-a11y` - Accessibility testing and validation
    - `@storybook/addon-vitest` - Component testing integration
    - `@chromatic-com/storybook` - Visual regression testing support
    - `@storybook/addon-onboarding` - Guided Storybook introduction
  - **Purpose**: Develop UI components in isolation, document usage patterns, and test edge cases
  - Stories available for key components like `FileUpload`, `CanvasZoomControls`, and `StorageIndicator`

### Testing & Quality Assurance

- **Vitest** - Fast, Vite-native test runner with instant feedback
  - **Browser Testing**: Playwright integration for real browser testing
  - **Coverage**: V8 coverage provider for code coverage reports
  - **Storybook Integration**: Test stories as component tests
  - **UI Mode**: Interactive testing interface for debugging
- **Playwright** - End-to-end testing in Chromium browser environment

### CI/CD

- **GitHub Actions** - Automated deployment pipeline
  - Builds on every push to `main` branch
  - Uploads artifacts to GitHub Pages
  - Environment variable injection for build metadata

## 📁 Project Structure

```
figif/
├── src/
│   ├── components/       # React components
│   │   ├── FileUpload.tsx       # Drag-drop upload
│   │   ├── CanvasEditor.tsx     # Frame display & editing
│   │   └── Timeline.tsx         # Frame navigation
│   ├── hooks/           # Custom React hooks
│   │   ├── useGifDecoder.ts     # GIF decoding logic
│   │   ├── useGifEncoder.ts     # GIF encoding logic
│   │   └── useFrameManager.ts   # Frame state management
│   ├── utils/           # Utility functions
│   │   ├── gifParser.ts         # GIF parsing helpers
│   │   └── gifGenerator.ts      # GIF generation helpers
│   ├── types/           # TypeScript definitions
│   │   └── gif.types.ts
│   ├── App.tsx          # Main application
│   └── main.tsx         # Entry point
└── package.json
```

## 🌐 Deploying to GitHub Pages

### Option 1: Manual Deployment

```bash
# Build the project
npm run build

# The dist/ folder contains your static site
# Upload it to GitHub Pages
```

### Option 2: Automated with GitHub Actions

1. Update `vite.config.ts` to set the base path to your repository name:

```typescript
export default defineConfig({
  base: '/your-repo-name/',
  plugins: [react()],
})
```

2. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
      - uses: actions/deploy-pages@v4
```

3. Push to GitHub and enable Pages in repository settings

## 🔒 Privacy

All GIF processing happens in your browser using JavaScript. Your files never leave your computer - they're not uploaded to any server.

## 📝 License

MIT License - feel free to use this project however you like!

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 🙏 Acknowledgments

- [gifuct-js](https://github.com/matt-way/gifuct-js) for GIF decoding
- [modern-gif](https://github.com/qq15725/modern-gif) for GIF encoding
