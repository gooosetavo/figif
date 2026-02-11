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
# Navigate to project directory
cd ~/workspace/figif

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **gifuct-js** - Fast GIF decoding
- **modern-gif** - Modern GIF encoding
- **HTML5 Canvas** - Frame manipulation

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
