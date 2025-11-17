import { useState, useEffect } from 'react';

// Hardcoded puzzle - Wedding themed!
const PUZZLE = {
  categories: [
    { name: "The Couple", difficulty: 1, words: ["SOFIA", "JOEL", "BRIDE", "GROOM"] },
    { name: "As One", difficulty: 2, words: ["UNION", "TIED", "WED", "YOKED"] },
    { name: "Synonyms for Ceremony/Ritual", difficulty: 3, words: ["CEREMONY", "RITUAL", "TRADITION", "RITE"] },
    { name: "French Loan Words", difficulty: 4, words: ["BOUTONNIÉRE", "NUPTIAL", "BOUQUET", "FIANCÉE"] }
  ]
};

const DIFFICULTY_COLORS = {
  1: 'bg-nyt-yellow',
  2: 'bg-nyt-green',
  3: 'bg-nyt-blue',
  4: 'bg-nyt-purple'
};

const STORAGE_KEY = 'connections-wedding-progress';

function ConnectionsGame() {
  const [words, setWords] = useState([]);
  const [selected, setSelected] = useState([]);
  const [solved, setSolved] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [viewOnlyMode, setViewOnlyMode] = useState(false);
  
  const [rearranging, setRearranging] = useState(null); // Step 1
  const [solving, setSolving] = useState(null); // Step 2
  const [isFading, setIsFading] = useState(false); // Banner fade

// Initialize or load game
useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);

    let stateToLoad = null; // We'll set this if a valid state is found

    if (savedState) {
        const state = JSON.parse(savedState);
        
        // 1. Check for a fully COMPLETE state (words.length = 0 is expected)
        const isGameComplete = state.solved && state.solved.length === PUZZLE.categories.length;
        
        // 2. Check for a playable MID-GAME state (words.length > 0 is expected)
        const isGamePlayable = state.words && state.words.length > 0;

        if (isGameComplete || isGamePlayable) {
            // State is valid (either fully solved or mid-play)
            stateToLoad = state;
        } else {
            // Case: Saved state exists but has 0 words and is NOT marked as complete.
            // This is the corrupted state, so we ignore it and proceed to new game.
            console.error("Corrupted/Blank save state detected. Starting new game.");
            localStorage.removeItem(STORAGE_KEY); // Clean up the bad save
        }
    }

    if (stateToLoad) {
        // --- LOAD VALID SAVED STATE ---
        const state = stateToLoad;
        
        setWords(state.words || []);
        setSelected(state.selected || []);
        setSolved(state.solved || []);
        setMistakes(state.mistakes || 0);
        setIsGameOver(state.isGameOver || false);
        setViewOnlyMode(state.viewOnlyMode || false);

        setSolving(null);
        setRearranging(null);
        
        // Final safety check for a completed game
        if (state.solved && state.solved.length === PUZZLE.categories.length) {
            setViewOnlyMode(true);
            setIsGameOver(true);
            setShowCompletionModal(false);
        }
        
    } else {
        // --- INITIALIZE NEW GAME (No valid state to load) ---
        const allWords = PUZZLE.categories.flatMap(cat =>
            cat.words.map(word => ({ word, category: cat.name, difficulty: cat.difficulty }))
        );
        setWords(allWords.sort(() => Math.random() - 0.5));
        setSelected([]);
        setSolved([]);
        setMistakes(0);
        setIsGameOver(false);
        setShowCompletionModal(false);
        setViewOnlyMode(false);
    }
}, []);

  // Save state
  useEffect(() => {
    const totalWords = words.length + solved.reduce((sum, cat) => sum + cat.words.length, 0);

    // Only save if the game is in a valid state: 
    // 1. All words are accounted for (16 total), OR
    // 2. The game is complete (isGameOver is true).
    // The total word count check prevents saving an empty or partial state during bad initializations.
    if (totalWords === 16 || isGameOver) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            words, selected, solved, mistakes, isGameOver, viewOnlyMode
        }));
    }
  }, [words, selected, solved, mistakes, isGameOver, viewOnlyMode]);

  const handleWordClick = (word) => {
    if (isGameOver || viewOnlyMode) return;
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
          setSolved(prev => {
          const next = [
            ...prev, {
            name: category.name,
            words: selected,
            difficulty: category.difficulty
          }];
          if (next.length === PUZZLE.categories.length) {
            setIsGameOver(true);
            setShowCompletionModal(true);
            setMessage('Congratulations! You solved the puzzle!');
          }
            return next;
          });

          setWords(prev => prev.filter(item => !selected.includes(item.word)));
          setSelected(() => []);
          setSolving(null);
          setIsFading(false);

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
    setShowCompletionModal(false);
    setViewOnlyMode(false);
    setMessage('');
  };

  const handleShowPuzzle = () => {
    setShowCompletionModal(false);
    setViewOnlyMode(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 px-3 sm:px-4">
      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4" style={{ zIndex: 30 }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 sm:p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Congratulations!</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">You solved all the connections!</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleNewGame}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-green-500 text-white rounded-full font-semibold hover:from-yellow-500 hover:to-green-600 transition-colors"
                >
                  New Game
                </button>
                <button
                  onClick={handleShowPuzzle}
                  className="px-6 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-full font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Show Puzzle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-[min(96vw,650px)] mx-auto">
        <header className="text-center mb-6 sm:mb-8">
          <h1 style={{fontSize: 'clamp(2rem, 5vw, 3rem)'}} className="font-bold mb-2 text-gray-900 dark:text-gray-100">Connections</h1>
          <p style={{fontSize: 'clamp(1rem, 2.5vw, 1.25rem)'}} className="text-gray-600 dark:text-gray-300">Wedding Edition</p>
          <p style={{fontSize: 'clamp(0.55rem, 2vw, 0.75rem)'}} className="text-gray-500 dark:text-gray-400 mt-2">Create four groups of four!</p>
        </header>

        {/* Solved categories */}
        <div className="space-y-2 mb-6">
          {solved.sort((a, b) => a.difficulty - b.difficulty).map((category, idx) => (
            <div
              key={idx}
              className={`${DIFFICULTY_COLORS[category.difficulty]} rounded-lg animate-slide-in p-2 sm:p-3`}
              style={{ minHeight: 'calc(100% / 4)' }} // same height as one grid row
            >
              <h3 className="font-semibold text-center mb-2 uppercase">{category.name}</h3>
              <div className="grid grid-cols-4 gap-1 sm:gap-2">
                {category.words.map(word => (
                  <div
                    key={word}
                    className="aspect-square flex items-center justify-center font-semibold uppercase bg-nyt-beige-light text-gray-900 rounded-md"
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
                    ${isSelected ? 'bg-nyt-beige-dark text-white scale-95' : 'bg-nyt-beige-light hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900'}
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
                <h3 className="font-semibold text-center mb-2 uppercase">{solving.name}</h3>
                <div className="flex gap-1 sm:gap-2">
                      {solving.words.map(word => (
                        <div key={word} className="flex items-center justify-center aspect-square px-2 py-1 font-semibold uppercase text-center rounded-md" style={{fontSize: 'clamp(0.7rem, 2.5vw, 1rem)'}}>
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
          <div className="text-center mb-4 font-semibold dark:text-gray-100" style={{fontSize: 'clamp(1rem, 2.5vw, 1.25rem)'}}>
            {message}
          </div>
        )}

        {/* Mistakes */}
        {!isGameOver && !viewOnlyMode && (
          <div className="flex justify-center mb-6">
            <div className="flex gap-2 items-center">
              <span style={{fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'}} className="text-gray-600 dark:text-gray-300">Mistakes remaining:</span>
              <div className="flex gap-1">
                {[...Array(4)].map((_, idx) => (
                  <div
                    key={idx}
                    style={{width: 'clamp(10px, 2vw, 12px)', height: 'clamp(10px, 2vw, 12px)'}}
                    className={`rounded-full ${idx < (4 - mistakes) ? 'bg-gray-700 dark:bg-gray-300' : 'bg-gray-300 dark:bg-gray-600'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* New Game button in view-only mode */}
        {viewOnlyMode && (
          <div className="flex justify-center mb-6">
            <button
              onClick={handleNewGame}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-green-500 text-white rounded-full font-semibold hover:from-yellow-500 hover:to-green-600 transition-colors"
              style={{fontSize: 'clamp(0.875rem, 2vw, 1rem)'}}
            >
              New Game
            </button>
          </div>
        )}

        {/* Controls */}
        {!isGameOver && !viewOnlyMode && (words.length > 0 || rearranging || solving) && (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6">
            <button onClick={handleShuffle} className="px-4 sm:px-6 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" style={{fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'}}>Shuffle</button>
            <button onClick={handleDeselectAll} className="px-4 sm:px-6 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" style={{fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'}} disabled={selected.length === 0}>Deselect All</button>
            <button onClick={handleSubmit} className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-colors ${selected.length === 4 ? 'bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`} disabled={selected.length !== 4} style={{fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'}}>Submit</button>
          </div>
        )}

        {/* New Game */}
        {isGameOver && !viewOnlyMode && (
          <div className="flex justify-center">
            <button onClick={handleNewGame} className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 rounded-full font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors" style={{fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'}}>New Game</button>
          </div>
        )}

       {/* How to Play */}
        <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <h2 style={{fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)'}} className="font-bold mb-3 text-gray-900 dark:text-gray-100">How to Play</h2>
          <ul style={{fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'}} className="space-y-2 text-gray-700 dark:text-gray-300">
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

export default ConnectionsGame;
