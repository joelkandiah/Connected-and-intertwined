import { useState, useEffect, useRef } from 'react';

// Wedding-themed Strands puzzle
// Theme: Wedding Day
// Spangram: CEREMONY (spans across the grid)
// Other words: BRIDE, GROOM, VOWS, RING, TOAST, DANCE, LOVE, ROSES, UNITY, MARRY

// Rotated 90 degrees - now 8 rows x 6 columns (tall and thin)
const PUZZLE_GRID = [
  ['E', 'C', 'B', 'G', 'I', 'Y'],
  ['D', 'N', 'R', 'N', 'R', 'N'],
  ['E', 'I', 'A', 'D', 'O', 'L'],
  ['C', 'E', 'R', 'M', 'E', 'I'],
  ['R', 'U', 'E', 'I', 'V', 'T'],
  ['Y', 'E', 'N', 'A', 'O', 'S'],
  ['N', 'W', 'O', 'D', 'N', 'A'],
  ['S', 'O', 'L', 'V', 'T', 'O'],
];

// Define word positions in the grid (row, col pairs for each letter)
// Grid is now rotated 90 degrees (8 rows x 6 columns)
const WORD_DEFINITIONS = [
  { 
    word: 'CEREMONY', 
    positions: [[3,0], [3,1], [3,2], [4,2], [3,3], [2,4], [1,5], [0,5]], 
    isSpangram: true,
    hint: 'The main event!'
  },
  { 
    word: 'REYNOLDA', 
    positions: [[4,0], [5,1], [5,0], [6,0], [7,1], [7,2], [6,3], [5,3]], 
    isSpangram: false,
    hint: 'The grand barn'
  },
  { 
    word: 'VOWS', 
    positions: [[7,3], [6,2], [6,1], [7,0]], 
    isSpangram: false,
    hint: 'Exchanged Promises'
  },
  { 
    word: 'UNION', 
    positions: [[4,1], [5,2], [4,3], [5,4], [6,4]], 
    isSpangram: false,
    hint: 'As One'
  },
  { 
    word: 'RING', 
    positions: [[1,4], [0,4], [1,3], [0,3]], 
    isSpangram: false,
    hint: 'Symbol of commitment'
  },
  { 
    word: 'TOAST', 
    positions: [[7,4], [7,5], [6,5], [5,5], [4,5]], 
    isSpangram: false,
    hint: 'Cheers to the couple!'
  },
  { 
    word: 'DANCE', 
    positions: [[2,3], [2,2], [1,1], [0,1], [0,0]], 
    isSpangram: false,
    hint: 'First ___ as husband and wife'
  },
  { 
    word: 'LOVE', 
    positions: [[4,4], [3,4], [3,5], [2,5]], 
    isSpangram: false,
    hint: 'The groom lifts to see her face!'
  },
  { 
    word: 'BRIDE', 
    positions: [[0,2], [1,2], [2,1], [1,0], [2,0]], 
    isSpangram: false,
    hint: 'It\'s her special day!'
  },
];

const STORAGE_KEY = 'wedding-strands-progress';

function WeddingStrands() {
  const [selectedCells, setSelectedCells] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [message, setMessage] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef(null);
  const gridRef = useRef(null);
  const buttonRefs = useRef({});
  const isInitialMount = useRef(true);

  // Load saved state
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const state = JSON.parse(savedState);
      setFoundWords(state.foundWords || []);
      setElapsedTime(state.elapsedTime || 0);
      setIsComplete(state.isComplete || false);
      
      if (state.foundWords && state.foundWords.length === WORD_DEFINITIONS.length) {
        setIsComplete(true);
      }
    }
  }, []);

  // Save state
  useEffect(() => {
    // Skip saving on initial mount to avoid overwriting loaded state
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      foundWords,
      elapsedTime,
      isComplete
    }));
  }, [foundWords, elapsedTime, isComplete]);

  // Timer logic - only runs when page is visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTimerRunning(false);
      } else if (!isComplete) {
        setIsTimerRunning(true);
      }
    };

    // Start timer when component mounts (if not completed)
    if (!isComplete) {
      setIsTimerRunning(true);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isComplete]);

  // Timer interval
  useEffect(() => {
    if (isTimerRunning && !isComplete) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
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
  }, [isTimerRunning, isComplete]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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

  // Touch event handlers for mobile
  const handleCellTouchStart = (row, col, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isComplete) return;
    setIsDragging(true);
    const cellKey = getCellKey(row, col);
    setSelectedCells([{ row, col, key: cellKey, letter: PUZZLE_GRID[row][col] }]);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || isComplete) return;
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && element.dataset.row !== undefined && element.dataset.col !== undefined) {
      const row = parseInt(element.dataset.row);
      const col = parseInt(element.dataset.col);
      const cellKey = getCellKey(row, col);
      
      setSelectedCells(prev => {
        // Check if this cell is already in the selection
        const isAlreadySelected = prev.some(c => c.key === cellKey);
        
        if (!isAlreadySelected && prev.length > 0) {
          const lastCell = prev[prev.length - 1];
          if (areAdjacent(lastCell, { row, col })) {
            return [...prev, { row, col, key: cellKey, letter: PUZZLE_GRID[row][col] }];
          }
        }
        
        return prev;
      });
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDragging && selectedCells.length >= 3) {
      handleSubmit();
    } else {
      setIsDragging(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchmove', handleTouchMove);
    };
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
    setElapsedTime(0);
    setIsTimerRunning(true);
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
                  className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-full font-semibold hover:from-yellow-500 hover:to-green-600 transition-colors"
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
          <h1 style={{fontSize: 'clamp(2rem, 5vw, 3rem)'}} className="font-bold mb-2">Strands</h1>
          <p style={{fontSize: 'clamp(1rem, 2.5vw, 1.25rem)'}} className="text-gray-600"> Wedding Edition</p>
          <p style={{fontSize: 'clamp(0.55rem, 2vw, 0.75rem)'}} className="text-gray-500 mt-2">
            Find the hidden words! • Drag to select letters • Find the pangram!
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

        {/* Letter Grid with SVG */}
        <div className="mb-6 flex justify-center">
          <div className="relative inline-block" ref={gridRef} style={{ touchAction: 'none' }}>
            <svg 
              className="absolute inset-0 pointer-events-none" 
              style={{ zIndex: 1 }}
              width="100%" 
              height="100%"
            >
              {/* Draw paths between selected cells */}
              {selectedCells.length > 1 && selectedCells.map((cell, index) => {
                if (index === 0) return null;
                const prevCell = selectedCells[index - 1];
                
                // Get actual button elements to calculate positions
                const prevButton = buttonRefs.current[prevCell.key];
                const currButton = buttonRefs.current[cell.key];
                
                if (!prevButton || !currButton || !gridRef.current) return null;
                
                const gridRect = gridRef.current.getBoundingClientRect();
                const prevRect = prevButton.getBoundingClientRect();
                const currRect = currButton.getBoundingClientRect();
                
                // Calculate center positions relative to the grid
                const x1 = prevRect.left - gridRect.left + prevRect.width / 2;
                const y1 = prevRect.top - gridRect.top + prevRect.height / 2;
                const x2 = currRect.left - gridRect.left + currRect.width / 2;
                const y2 = currRect.top - gridRect.top + currRect.height / 2;
                
                return (
                  <line
                    key={`path-${index}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#3b82f6"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            
            <div className="relative" style={{ zIndex: 2 }}>
              {PUZZLE_GRID.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  {row.map((letter, colIndex) => {
                    const isSelected = isCellSelected(rowIndex, colIndex);
                    const isInFound = isCellInFoundWord(rowIndex, colIndex);
                    
                    // Check if this cell is part of the spangram
                    const spangramWord = WORD_DEFINITIONS.find(wd => wd.isSpangram);
                    const isInSpangram = foundWords.includes(spangramWord?.word) && 
                      spangramWord?.positions.some(([r, c]) => r === rowIndex && c === colIndex);
                    
                    const cellKey = getCellKey(rowIndex, colIndex);
                    
                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        ref={(el) => {
                          if (el) buttonRefs.current[cellKey] = el;
                        }}
                        data-row={rowIndex}
                        data-col={colIndex}
                        onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                        onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                        onTouchStart={(e) => handleCellTouchStart(rowIndex, colIndex, e)}
                        className={`
                          w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
                          flex items-center justify-center
                          rounded-full font-bold text-lg sm:text-xl md:text-2xl
                          transition-all duration-200
                          ${isSelected
                            ? 'bg-blue-500 text-white scale-95'
                            : isInSpangram
                            ? 'bg-nyt-yellow text-gray-900'
                            : isInFound
                            ? 'color-nyt-beige-bg-selected text-white'
                            : 'color-nyt-beige-bg hover:bg-gray-300 text-gray-900'
                          }
                          cursor-pointer select-none
                        `}
                        style={{ touchAction: 'none' }}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
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
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-full font-semibold hover:from-yellow-500 hover:to-green-600 transition-colors"
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
                      ? 'bg-nyt-yellow text-gray-900'
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
