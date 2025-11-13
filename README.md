Puzzles Wedding Edition

A single serve webpage containing a few puzzles for my wedding. Built with React and Tailwind CSS.

## 🎮 Features

- **Wedding-Themed Puzzles**: Mixed up categories, A small crossword and a snaking wordsearch
- **Local Storage**: Game progress is automatically saved to your browser
- **Responsive Design**: Works on desktop and mobile devices
- **Interactive Gameplay**: Lots of buttons to help out solvers

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run deploy

# Preview production build
npm run predeploy
```

The built files will be in the `dist/` directory, ready to be served by any static hosting service.

## 📦 Deployment

The application can be deployed to any static hosting service:

### Deploy to GitHub Pages
1. Build the project: `npm run deploy`

### Deploy to any web server
1. Build: `npm run predeploy`
2. Upload the contents of `dist/` to your web server
3. Serve `index.html` as the entry point

## 🛠️ Technologies

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS v4** - Styling
- **Local Storage API** - Progress persistence

## 📝 How to Play

1. Find groups of four items that share something in common
2. Select four items and tap 'Submit' to check if your guess is correct
3. Find all groups without making 4 mistakes!
4. Categories are color-coded by difficulty level

## 📄 License

MIT
