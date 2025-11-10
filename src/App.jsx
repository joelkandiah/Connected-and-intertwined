import { useState, useEffect } from 'react'
import './App.css'

// Hardcoded puzzle - Wedding themed!
const PUZZLE = {
  categories: [
    {
      name: "Love Songs",
      difficulty: 1, // Easy (Yellow)
      words: ["CRAZY", "WONDERFUL", "TONIGHT", "BEAUTIFUL"]
    },
    {
      name: "Wedding Traditions",
      difficulty: 2, // Medium (Green)
      words: ["BOUQUET", "VOWS", "TOAST", "DANCE"]
    },
    {
      name: "Types of Flowers",
      difficulty: 3, // Hard (Blue)
      words: ["ROSE", "LILY", "DAISY", "ORCHID"]
    },
    {
      name: "Diamond Cuts",
      difficulty: 4, // Very Hard (Purple)
      words: ["PRINCESS", "EMERALD", "OVAL", "CUSHION"]
    }
  ]
};

const DIFFICULTY_COLORS = {
  1: 'bg-nyt-yellow',
  2: 'bg-nyt-green',
  3: 'bg-nyt-blue',
  4: 'bg-nyt-purple'
};

const STORAGE_KEY = 'connections-wedding-progress';

function App() {
  const [words, setWords] = useState([]);
  const [selected, setSelected] = useState([]);
  const [solved, setSolved] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);

  // Initialize or load game
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    
    if (savedState) {
      const state = JSON.parse(savedState);
      setWords(state.words);
      setSelected(state.selected || []);
      setSolved(state.solved || []);
      setMistakes(state.mistakes || 0);
      setIsGameOver(state.isGameOver || false);
    } else {
      // Initialize new game
      const allWords = PUZZLE.categories.flatMap(cat => 
        cat.words.map(word => ({ word, category: cat.name, difficulty: cat.difficulty }))
      );
      // Shuffle words
      const shuffled = allWords.sort(() => Math.random() - 0.5);
      setWords(shuffled);
    }
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (words.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        words,
        selected,
        solved,
        mistakes,
        isGameOver
      }));
    }
  }, [words, selected, solved, mistakes, isGameOver]);

  const handleWordClick = (word) => {
    if (isGameOver) return;
    
    if (selected.includes(word)) {
      setSelected(selected.filter(w => w !== word));
    } else if (selected.length < 4) {
      setSelected([...selected, word]);
    }
  };

  const handleSubmit = () => {
    if (selected.length !== 4) return;

    // Check if selection is correct
    const selectedData = selected.map(w => words.find(item => item.word === w));
    const categories = [...new Set(selectedData.map(item => item.category))];

    if (categories.length === 1) {
      // Correct!
      const category = PUZZLE.categories.find(c => c.name === categories[0]);
      setMessage(`Correct! ${category.name}`);
      setSolved([...solved, {
        name: category.name,
        words: selected,
        difficulty: category.difficulty
      }]);
      setWords(words.filter(item => !selected.includes(item.word)));
      setSelected([]);

      // Check if game is won
      if (solved.length + 1 === PUZZLE.categories.length) {
        setIsGameOver(true);
        setMessage('Congratulations! You solved the puzzle!');
      }

      setTimeout(() => setMessage(''), 2000);
    } else {
      // Incorrect
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      
      // Check how many are correct
      const maxMatches = Math.max(...categories.map(cat => 
        selectedData.filter(item => item.category === cat).length
      ));

      if (maxMatches === 3) {
        setMessage('One away...');
      } else {
        setMessage('Not quite!');
      }

      if (newMistakes >= 4) {
        setIsGameOver(true);
        setMessage('Game Over! Out of tries.');
      }

      setSelected([]);
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const handleDeselectAll = () => {
    setSelected([]);
  };

  const handleShuffle = () => {
    setWords([...words].sort(() => Math.random() - 0.5));
  };

  const handleNewGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    const allWords = PUZZLE.categories.flatMap(cat => 
      cat.words.map(word => ({ word, category: cat.name, difficulty: cat.difficulty }))
    );
    const shuffled = allWords.sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setSelected([]);
    setSolved([]);
    setMistakes(0);
    setIsGameOver(false);
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Connections</h1>
          <p className="text-gray-600">Wedding Edition</p>
          <p className="text-sm text-gray-500 mt-2">Create four groups of four!</p>
        </header>

        {/* Solved categories */}
        <div className="space-y-2 mb-4">
          {solved.sort((a, b) => a.difficulty - b.difficulty).map((category, idx) => (
            <div 
              key={idx}
              className={`${DIFFICULTY_COLORS[category.difficulty]} p-4 rounded-lg`}
            >
              <h3 className="font-bold text-center mb-2 uppercase text-sm">
                {category.name}
              </h3>
              <p className="text-center uppercase text-sm">
                {category.words.join(', ')}
              </p>
            </div>
          ))}
        </div>

        {/* Word grid */}
        {!isGameOver && words.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-6">
            {words.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleWordClick(item.word)}
                className={`
                  p-6 rounded-lg font-semibold text-sm uppercase
                  transition-all duration-200
                  ${selected.includes(item.word) 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }
                `}
              >
                {item.word}
              </button>
            ))}
          </div>
        )}

        {/* Message */}
        {message && (
          <div className="text-center mb-4 font-semibold text-lg">
            {message}
          </div>
        )}

        {/* Mistakes */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-2">
            <span className="text-gray-600">Mistakes remaining:</span>
            <div className="flex gap-1">
              {[...Array(4)].map((_, idx) => (
                <div 
                  key={idx}
                  className={`w-3 h-3 rounded-full ${
                    idx < (4 - mistakes) ? 'bg-gray-700' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        {!isGameOver && words.length > 0 && (
          <div className="flex justify-center gap-3 mb-6">
            <button
              onClick={handleShuffle}
              className="px-6 py-2 bg-white border-2 border-gray-300 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Shuffle
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-6 py-2 bg-white border-2 border-gray-300 rounded-full font-semibold hover:bg-gray-100 transition-colors"
              disabled={selected.length === 0}
            >
              Deselect All
            </button>
            <button
              onClick={handleSubmit}
              className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                selected.length === 4
                  ? 'bg-gray-900 text-white hover:bg-gray-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={selected.length !== 4}
            >
              Submit
            </button>
          </div>
        )}

        {/* New Game Button */}
        {isGameOver && (
          <div className="flex justify-center">
            <button
              onClick={handleNewGame}
              className="px-8 py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-700 transition-colors"
            >
              New Game
            </button>
          </div>
        )}

        {/* How to Play */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-3">How to Play</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• Find groups of four items that share something in common.</li>
            <li>• Select four items and tap 'Submit' to check if your guess is correct.</li>
            <li>• Find the groups without making 4 mistakes!</li>
            <li>• Category difficulty levels: 🟨 Easy → 🟩 Medium → 🟦 Hard → 🟪 Very Hard</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App
