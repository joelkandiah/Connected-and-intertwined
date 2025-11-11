import { useState, useEffect, useRef } from 'react';

// Wedding-themed Strands puzzle
// Theme: Wedding Day
// Spangram: CEREMONY (spans across the grid)
// Other words: BRIDE, GROOM, VOWS, RING, TOAST, DANCE, LOVE, ROSES, UNITY, MARRY

const PUZZLE_GRID = [
  ['C', 'E', 'R', 'E', 'M', 'O', 'N', 'Y'],
  ['B', 'R', 'I', 'D', 'E', 'G', 'R', 'O'],
  ['V', 'O', 'W', 'S', 'T', 'O', 'A', 'S'],
  ['R', 'I', 'N', 'G', 'D', 'A', 'N', 'C'],
  ['L', 'O', 'V', 'E', 'M', 'A', 'R', 'R'],
  ['U', 'N', 'I', 'T', 'Y', 'R', 'O', 'S'],
];

// Define word positions in the grid (row, col pairs for each letter)
const WORD_DEFINITIONS = [
  { 
    word: 'CEREMONY', 
    positions: [[0,0], [0,1], [0,2], [0,3], [0,4], [0,5], [0,6], [0,7]], 
    isSpangram: true,
    hint: 'The main event (spans the grid)'
  },
  { 
    word: 'BRIDE', 
    positions: [[1,0], [1,1], [1,2], [1,3], [1,4]], 
    isSpangram: false,
    hint: 'She walks down the aisle'
  },
  { 
    word: 'GROOM', 
    positions: [[1,5], [1,6], [2,5], [2,6], [0,4]], 
    isSpangram: false,
    hint: 'He waits at the altar'
  },
  { 
    word: 'VOWS', 
    positions: [[2,0], [2,1], [2,2], [2,3]], 
    isSpangram: false,
    hint: 'Promises exchanged'
  },
  { 
    word: 'RING', 
    positions: [[3,0], [3,1], [3,2], [3,3]], 
    isSpangram: false,
    hint: 'Symbol of commitment'
  },
  { 
    word: 'TOAST', 
    positions: [[2,4], [2,5], [2,6], [2,7], [2,3]], 
    isSpangram: false,
    hint: 'Cheers to the couple!'
  },
  { 
    word: 'DANCE', 
    positions: [[3,4], [3,5], [3,6], [3,7], [0,1]], 
    isSpangram: false,
    hint: 'First ___ as husband and wife'
  },
  { 
    word: 'LOVE', 
    positions: [[4,0], [4,1], [4,2], [4,3]], 
    isSpangram: false,
    hint: 'The reason for the celebration'
  },
  { 
    word: 'ROSES', 
    positions: [[4,6], [2,5], [2,7], [1,4], [2,3]], 
    isSpangram: false,
    hint: 'Popular wedding flowers'
  },
  { 
    word: 'UNITY', 
    positions: [[5,0], [5,1], [5,2], [5,3], [5,4]], 
    isSpangram: false,
    hint: 'Togetherness'
  },
  { 
    word: 'MARRY', 
    positions: [[4,4], [4,5], [4,6], [4,6], [5,4]], 
    isSpangram: false,
    hint: 'To wed'
  },
];

const STORAGE_KEY = 'wedding-strands-progress';

function WeddingStrands() {
  const [selectedCells, setSelectedCells] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [message, setMessage] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef(null);

  // Load saved state
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const state = JSON.parse(savedState);
      setFoundWords(state.foundWords || []);
      setStartTime(state.startTime || null);
      setElapsedTime(state.elapsedTime || 0);
      setIsComplete(state.isComplete || false);
      
      if (state.foundWords && state.foundWords.length === WORD_DEFINITIONS.length) {
        setIsComplete(true);
      }
    } else {
      // Start timer on new game
      setStartTime(Date.now());
    }
  }, []);

  // Save state
  useEffect(() => {
    if (startTime) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        foundWords,
        startTime,
        elapsedTime,
        isComplete
      }));
    }
  }, [foundWords, startTime, elapsedTime, isComplete]);

  // Timer
  useEffect(() => {
    if (startTime && !isComplete) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startTime, isComplete]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCellKey = (row, col) => `${row}-${col}`;

  const areAdjacent = (cell1, cell2) => {
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
  };

  const handleCellMouseDown = (row, col) => {
    if (isComplete) return;
    setIsDragging(true);
    const cellKey = getCellKey(row, col);
    setSelectedCells([{ row, col, key: cellKey, letter: PUZZLE_GRID[row][col] }]);
  };

  const handleCellMouseEnter = (row, col) => {
    if (!isDragging || isComplete) return;
    
    const cellKey = getCellKey(row, col);
    const isAlreadySelected = selectedCells.some(c => c.key === cellKey);
    
    if (!isAlreadySelected && selectedCells.length > 0) {
      const lastCell = selectedCells[selectedCells.length - 1];
      if (areAdjacent(lastCell, { row, col })) {
        setSelectedCells(prev => [...prev, { row, col, key: cellKey, letter: PUZZLE_GRID[row][col] }]);
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging && selectedCells.length >= 3) {
      handleSubmit();
    } else {
      setIsDragging(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, selectedCells]);

  const positionsMatch = (selected, wordDef) => {
    if (selected.length !== wordDef.positions.length) return false;
    
    // Check if selected positions match word positions exactly
    return selected.every((cell, index) => {
      const [row, col] = wordDef.positions[index];
      return cell.row === row && cell.col === col;
    });
  };

  const handleSubmit = () => {
    if (selectedCells.length < 3) {
      setMessage('Word too short!');
      setTimeout(() => setMessage(''), 2000);
      setSelectedCells([]);
      return;
    }

    const word = selectedCells.map(c => c.letter).join('');
    
    // Check if this word matches any defined word by positions
    const foundWordDef = WORD_DEFINITIONS.find(wd => 
      wd.word === word || positionsMatch(selectedCells, wd)
    );

    if (foundWordDef && !foundWords.includes(foundWordDef.word)) {
      const newFoundWords = [...foundWords, foundWordDef.word];
      setFoundWords(newFoundWords);
      setMessage(foundWordDef.isSpangram ? '🎉 Spangram found!' : 'Great job!');

      if (newFoundWords.length === WORD_DEFINITIONS.length) {
        setIsComplete(true);
        setShowCompletionModal(true);
      }

      setTimeout(() => setMessage(''), 2000);
    } else if (foundWords.includes(word)) {
      setMessage('Already found!');
      setTimeout(() => setMessage(''), 2000);
    } else {
      setMessage('Not a valid word');
      setTimeout(() => setMessage(''), 2000);
    }
    
    setSelectedCells([]);
  };

  const handleClear = () => {
    setSelectedCells([]);
  };

  const handleNewGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSelectedCells([]);
    setFoundWords([]);
    setMessage('');
    setIsComplete(false);
    setShowCompletionModal(false);
    setStartTime(Date.now());
    setElapsedTime(0);
  };

  const handleShowPuzzle = () => {
    setShowCompletionModal(false);
  };

  const isCellSelected = (row, col) => {
    return selectedCells.some(c => c.row === row && c.col === col);
  };

  const isCellInFoundWord = (row, col) => {
    return foundWords.some(word => {
      const wordDef = WORD_DEFINITIONS.find(wd => wd.word === word);
      if (!wordDef) return false;
      return wordDef.positions.some(([r, c]) => r === row && c === col);
    });
  };

  const getRemainingWords = () => {
    return WORD_DEFINITIONS.filter(wd => !foundWords.includes(wd.word));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 30 }}>
          <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">💍</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Congratulations!</h2>
              <p className="text-lg text-gray-700 mb-2">You found all the words!</p>
              <p className="text-2xl font-bold text-gray-900 mb-6">Time: {formatTime(elapsedTime)}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleNewGame}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-green-500 text-white rounded-full font-semibold hover:from-yellow-500 hover:to-green-600 transition-colors"
                >
                  New Game
                </button>
                <button
                  onClick={handleShowPuzzle}
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-full font-semibold hover:bg-gray-50 transition-colors"
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
          <h1 style={{fontSize: 'clamp(2rem, 5vw, 3rem)'}} className="font-bold mb-2">Wedding Strands</h1>
          <p style={{fontSize: 'clamp(1rem, 2.5vw, 1.25rem)'}} className="text-gray-600">Find the hidden words!</p>
          <p style={{fontSize: 'clamp(0.55rem, 2vw, 0.75rem)'}} className="text-gray-500 mt-2">
            Drag to select letters • Find the pangram!
          </p>
        </header>

        {/* Timer and Progress */}
        <div className="flex justify-between items-center mb-4 px-2">
          <div className="text-xl sm:text-2xl font-bold text-gray-900">
            {formatTime(elapsedTime)}
          </div>
          <div className="text-base sm:text-lg font-semibold text-gray-700">
            {foundWords.length} / {WORD_DEFINITIONS.length}
          </div>
        </div>

        {/* Letter Grid */}
        <div className="mb-6 flex justify-center">
          <div className="inline-block">
            {PUZZLE_GRID.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
                {row.map((letter, colIndex) => {
                  const isSelected = isCellSelected(rowIndex, colIndex);
                  const isInFound = isCellInFoundWord(rowIndex, colIndex);
                  
                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                      onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                      className={`
                        w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14
                        flex items-center justify-center
                        rounded-lg font-bold text-base sm:text-xl
                        transition-all duration-200
                        ${isSelected
                          ? 'bg-gradient-to-r from-yellow-400 to-green-500 text-white scale-95'
                          : isInFound
                          ? 'bg-nyt-blue text-gray-900'
                          : 'color-nyt-beige-bg hover:bg-gray-300 text-gray-900'
                        }
                        cursor-pointer select-none
                      `}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Current Selection */}
        {selectedCells.length > 0 && (
          <div className="text-center mb-4">
            <div className="text-lg sm:text-xl font-bold text-gray-900">
              {selectedCells.map(c => c.letter).join('')}
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className="text-center mb-4 font-semibold text-base sm:text-lg text-gray-900">
            {message}
          </div>
        )}

        {/* Controls */}
        {!isComplete && (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6">
            <button
              onClick={handleClear}
              className="px-4 sm:px-6 py-2 bg-white border-2 border-gray-300 rounded-full font-semibold hover:bg-gray-100 transition-colors"
              style={{fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'}}
              disabled={selectedCells.length === 0}
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-colors ${
                selectedCells.length >= 3
                  ? 'bg-gray-900 text-white hover:bg-gray-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={selectedCells.length < 3}
              style={{fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'}}
            >
              Submit
            </button>
            <button
              onClick={() => setShowHint(!showHint)}
              className="px-4 sm:px-6 py-2 bg-white border-2 border-gray-300 rounded-full font-semibold hover:bg-gray-100 transition-colors"
              style={{fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'}}
            >
              {showHint ? 'Hide' : 'Show'} Hints
            </button>
          </div>
        )}

        {/* New Game button when complete */}
        {isComplete && (
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

        {/* Found Words List */}
        <div className="mt-8 p-4 sm:p-6 bg-white rounded-lg shadow-sm">
          <h2 style={{fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)'}} className="font-bold mb-3">
            Found Words
          </h2>
          <div className="space-y-2">
            {foundWords.map((word, index) => {
              const wordData = WORD_DEFINITIONS.find(w => w.word === word);
              return (
                <div
                  key={index}
                  className={`
                    px-3 py-2 rounded-lg font-semibold
                    ${wordData?.isSpangram
                      ? 'bg-gradient-to-r from-yellow-400 to-green-500 text-white'
                      : 'bg-gray-200 text-gray-900'
                    }
                  `}
                  style={{fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'}}
                >
                  {word} {wordData?.isSpangram && '⭐ Spangram'}
                </div>
              );
            })}
          </div>
          
          {/* Hints */}
          {showHint && getRemainingWords().length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-semibold mb-2" style={{fontSize: 'clamp(0.875rem, 2vw, 1rem)'}}>
                Remaining Word Hints:
              </h3>
              <ul className="space-y-1 text-gray-600" style={{fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'}}>
                {getRemainingWords().map((wd, index) => (
                  <li key={index}>• {wd.hint} {wd.isSpangram && '(Spangram)'}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* How to Play */}
        <div className="mt-8 p-4 sm:p-6 bg-white rounded-lg shadow-sm">
          <h2 style={{fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)'}} className="font-bold mb-3">
            How to Play
          </h2>
          <ul style={{fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'}} className="space-y-2 text-gray-700">
            <li>• Drag across adjacent letters to form words</li>
            <li>• Find all the hidden wedding-themed words</li>
            <li>• Look for the special spangram word (marked with ⭐)</li>
            <li>• The spangram spans across the puzzle</li>
            <li>• Try to find all words as quickly as possible!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default WeddingStrands;
