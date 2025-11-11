import { useState, useEffect } from 'react';
import './App.css';

// Hardcoded puzzle - Wedding themed!
const PUZZLE = {
  categories: [
    { name: "The Couple", difficulty: 1, words: ["SOFIA", "JOEL", "BRIDE", "GROOM"] },
    { name: "Places of Love", difficulty: 2, words: ["CAMBRIDGE", "WINSTON-SALEM", "HENLEY", "RANDLEMAN"] },
    { name: "Journey Together", difficulty: 2, words: ["TRANSATLANTIC", "HONEYMOON", "ADVENTURE", "MEMORIES"] },
    { name: "Symbols of Love", difficulty: 3, words: ["VOWS", "RING", "FOREVER", "PASSION"] }
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
  
  const [rearranging, setRearranging] = useState(null); // Step 1
  const [solving, setSolving] = useState(null); // Step 2
  const [isFading, setIsFading] = useState(false); // Banner fade

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
      const allWords = PUZZLE.categories.flatMap(cat =>
        cat.words.map(word => ({ word, category: cat.name, difficulty: cat.difficulty }))
      );
      setWords(allWords.sort(() => Math.random() - 0.5));
    }
  }, []);

  // Save state
  useEffect(() => {
    if (words.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        words, selected, solved, mistakes, isGameOver
      }));
    }
  }, [words, selected, solved, mistakes, isGameOver]);

  const handleWordClick = (word) => {
    if (isGameOver) return;
    if (selected.includes(word)) setSelected(selected.filter(w => w !== word));
    else if (selected.length < 4) setSelected([...selected, word]);
  };

  const handleSubmit = () => {
    if (selected.length !== 4) return;

    const selectedData = selected.map(w => words.find(item => item.word === w));
    const categories = [...new Set(selectedData.map(item => item.category))];

    if (categories.length === 1) {
      const category = PUZZLE.categories.find(c => c.name === categories[0]);
      setMessage(`Correct! ${category.name}`);

      // Step 1: rearranging tiles
      setRearranging({
        name: category.name,
        words: selected,
        difficulty: category.difficulty
      });

      // After 400ms, show banner over rearranged tiles
      setTimeout(() => {
        setRearranging(null);
        setSolving({
          name: category.name,
          words: selected,
          difficulty: category.difficulty
        });
        setIsFading(false);

        // Fade out banner after 800ms
        setTimeout(() => setIsFading(true), 800);

        // Remove banner and move tiles to solved after 1200ms
        setTimeout(() => {
          setSolved([...solved, {
            name: category.name,
            words: selected,
            difficulty: category.difficulty
          }]);
          setWords(prev => prev.filter(item => !selected.includes(item.word)));
          setSelected([]);
          setSolving(null);
          setIsFading(false);

          if (solved.length + 1 === PUZZLE.categories.length) {
            setIsGameOver(true);
            setMessage('Congratulations! You solved the puzzle!');
          }
        }, 1200);

      }, 400);

      setTimeout(() => setMessage(''), 2000);

    } else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);

      const maxMatches = Math.max(...categories.map(cat =>
        selectedData.filter(item => item.category === cat).length
      ));
      setMessage(maxMatches === 3 ? 'One away...' : 'Not quite!');

      if (newMistakes >= 4) {
        setIsGameOver(true);
        setMessage('Game Over! You ran out of tries.');
      }

      setSelected([]);
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const handleDeselectAll = () => setSelected([]);
  const handleShuffle = () => setWords([...words].sort(() => Math.random() - 0.5));
  const handleNewGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    const allWords = PUZZLE.categories.flatMap(cat =>
      cat.words.map(word => ({ word, category: cat.name, difficulty: cat.difficulty }))
    );
    setWords(allWords.sort(() => Math.random() - 0.5));
    setSelected([]);
    setSolved([]);
    setMistakes(0);
    setIsGameOver(false);
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="w-full max-w-[min(96vw,650px)] mx-auto">
        <header className="text-center mb-6 sm:mb-8">
          <h1 style={{fontSize: 'clamp(2rem, 5vw, 3rem)'}} className="font-bold mb-2">Connections</h1>
          <p style={{fontSize: 'clamp(1rem, 2.5vw, 1.25rem)'}} className="text-gray-600">Wedding Edition</p>
          <p style={{fontSize: 'clamp(0.55rem, 2vw, 0.75rem)'}} className="text-gray-500 mt-2">Create four groups of four!</p>
        </header>

        {/* Solved categories */}
        <div className="space-y-2 mb-6">
          {solved.sort((a, b) => a.difficulty - b.difficulty).map((category, idx) => (
            <div
              key={idx}
              className={`${DIFFICULTY_COLORS[category.difficulty]} rounded-lg animate-slideIn p-2 sm:p-3`}
              style={{ minHeight: 'calc(100% / 4)' }} // same height as one grid row
            >
              <h3 className="font-semibold text-center mb-2 uppercase">{category.name}</h3>
              <div className="grid grid-cols-4 gap-1 sm:gap-2">
                {category.words.map(word => (
                  <div
                    key={word}
                    className="aspect-square flex items-center justify-center font-semibold uppercase color-nyt-beige-bg rounded-md"
                    style={{fontSize: 'clamp(0.7rem, 2.5vw, 1rem)'}}
                  >
                    {word}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Word grid */}
        {!isGameOver && (words.length > 0 || rearranging || solving) && (
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-6 relative">
            {words.map(item => {
              const isSelected = selected.includes(item.word);
              const isRearranging = rearranging?.words.includes(item.word);

              return (
                <button
                  key={item.word}
                  onClick={() => handleWordClick(item.word)}
                  className={`
                    aspect-square flex items-center justify-center
                    p-1.5 sm:p-3 md:p-4 rounded-lg font-semibold uppercase
                    transition-all duration-400
                    ${isSelected ? 'color-nyt-beige-bg-selected text-white scale-95' : 'color-nyt-beige-bg hover:bg-gray-300 text-gray-900'}
                    ${isRearranging ? 'transform translate-y-[-100%]' : ''}
                  `}
                  style={{
                    fontSize: 'clamp(0.7rem, 2.5vw, 1rem)'
                  }}
                >
                  {item.word}
                </button>
              );
            })}

            {/* Banner */}
            {solving && (
              <div
                className={`
                  absolute inset-0 flex justify-center items-center
                  ${DIFFICULTY_COLORS[solving.difficulty]} rounded-lg
                  transition-all duration-800
                  ${isFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
                `}
                style={{ zIndex: 10 }}
              >
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none space-y-2">
            {/* Category name at top */}
                <h3 className="font-bold uppercase text-center">{solving.name}</h3>
                <div className="flex gap-2">
                      {solving.words.map(word => (
                        <div key={word} className="flex items-center justify-center aspect-square px-2 py-1 font-semibold uppercase text-center rounded-md">
                            {word}
                        </div>
                    ))}
                    </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message */}
        {message && (
          <div className="text-center mb-4 font-semibold" style={{fontSize: 'clamp(1rem, 2.5vw, 1.25rem)'}}>
            {message}
          </div>
        )}

        {/* Mistakes */}
        {!isGameOver && (
          <div className="flex justify-center mb-6">
            <div className="flex gap-2 items-center">
              <span style={{fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'}} className="text-gray-600">Mistakes remaining:</span>
              <div className="flex gap-1">
                {[...Array(4)].map((_, idx) => (
                  <div
                    key={idx}
                    style={{width: 'clamp(10px, 2vw, 12px)', height: 'clamp(10px, 2vw, 12px)'}}
                    className={`rounded-full ${idx < (4 - mistakes) ? 'bg-gray-700' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        {!isGameOver && (words.length > 0 || rearranging || solving) && (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6">
            <button onClick={handleShuffle} className="px-4 sm:px-6 py-2 bg-white border-2 border-gray-300 rounded-full font-semibold hover:bg-gray-100 transition-colors" style={{fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'}}>Shuffle</button>
            <button onClick={handleDeselectAll} className="px-4 sm:px-6 py-2 bg-white border-2 border-gray-300 rounded-full font-semibold hover:bg-gray-100 transition-colors" style={{fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'}} disabled={selected.length === 0}>Deselect All</button>
            <button onClick={handleSubmit} className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-colors ${selected.length === 4 ? 'bg-gray-900 text-white hover:bg-gray-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`} disabled={selected.length !== 4} style={{fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'}}>Submit</button>
          </div>
        )}

        {/* New Game */}
        {isGameOver && (
          <div className="flex justify-center">
            <button onClick={handleNewGame} className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-700 transition-colors" style={{fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'}}>New Game</button>
          </div>
        )}

       {/* How to Play */}
        <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-white rounded-lg shadow-sm">
          <h2 style={{fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)'}} className="font-bold mb-3">How to Play</h2>
          <ul style={{fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'}} className="space-y-2 text-gray-700">
            <li>• Find groups of four items that share something in common.</li>
            <li>• Select four items and tap 'Submit' to check if your guess is correct.</li>
            <li>• Find the groups without making 4 mistakes!</li>
            <li>• Category difficulty levels: 🟨 Easy → 🟩 Medium → 🟦 Hard → 🟪 Very Hard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;

