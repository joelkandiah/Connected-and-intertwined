# Connections - Wedding Edition

A NYT Connections clone built as a wedding-themed puzzle game. Built with React and Tailwind CSS.

## 🎮 Features

- **Wedding-Themed Puzzle**: 4 categories of wedding-related words
- **Progressive Difficulty**: Yellow (Easy) → Green (Medium) → Blue (Hard) → Purple (Very Hard)
- **Local Storage**: Game progress is automatically saved to your browser
- **Responsive Design**: Works on desktop and mobile devices
- **Interactive Gameplay**: 
  - Select 4 words and submit your guess
  - Get instant feedback on correct/incorrect guesses
  - "One away..." hint when you have 3 correct in a group
  - 4 mistakes allowed before game over
  - Shuffle button to rearrange words

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
npm run build

# Preview production build
npm run preview
```

The built files will be in the `dist/` directory, ready to be served by any static hosting service.

## 📦 Deployment

The application can be deployed to any static hosting service:

### Deploy to GitHub Pages
1. Build the project: `npm run build`
2. Deploy the `dist/` folder to GitHub Pages

### Deploy to Netlify/Vercel
1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`

### Deploy to any web server
1. Build: `npm run build`
2. Upload the contents of `dist/` to your web server
3. Serve `index.html` as the entry point

## 🎯 Game Categories

1. **Love Songs** (Easy/Yellow): CRAZY, WONDERFUL, TONIGHT, BEAUTIFUL
2. **Wedding Traditions** (Medium/Green): BOUQUET, VOWS, TOAST, DANCE
3. **Types of Flowers** (Hard/Blue): ROSE, LILY, DAISY, ORCHID
4. **Diamond Cuts** (Very Hard/Purple): PRINCESS, EMERALD, OVAL, CUSHION

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

## 🎨 Customization

To customize the puzzle, edit the `PUZZLE` constant in `src/App.jsx`:

```javascript
const PUZZLE = {
  categories: [
    {
      name: "Category Name",
      difficulty: 1, // 1=Yellow, 2=Green, 3=Blue, 4=Purple
      words: ["WORD1", "WORD2", "WORD3", "WORD4"]
    },
    // Add 3 more categories...
  ]
};
```

## 📄 License

MIT
