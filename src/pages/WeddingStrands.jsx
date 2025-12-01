import { useState, useEffect, useRef, useCallback } from 'react';
import puzzleData from '../data/strands-puzzle.json';
import StrandsCell from '../components/StrandsCell';
import HowToPlayModal from '../components/HowToPlayModal';
import CompletionModal from '../components/CompletionModal';

// Wedding-themed Strands puzzle
// Theme: Wedding Day
// Spangram: CEREMONY (spans across the grid)
// Other words: BRIDE, GROOM, VOWS, RING, TOAST, DANCE, LOVE, ROSES, UNITY, MARRY

// Rotated 90 degrees - now 8 rows x 6 columns (tall and thin)
const PUZZLE_GRID = puzzleData.grid;

// Define word positions in the grid (row, col pairs for each letter)
// Grid is now rotated 90 degrees (8 rows x 6 columns)
const WORD_DEFINITIONS = puzzleData.words;

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
  const [isTapMode, setIsTapMode] = useState(false);
  const timerRef = useRef(null);
  const gridRef = useRef(null);
  const buttonRefs = useRef({});
  const isInitialMount = useRef(true);
  const touchStartTimeRef = useRef(null);
  const layoutCacheRef = useRef({ centers: {}, rects: {} });
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Check for first time visit
  useEffect(() => {
    const hasSeenHowToPlay = localStorage.getItem('wedding-strands-how-to-play');
    if (!hasSeenHowToPlay) {
      setShowHowToPlay(true);
      localStorage.setItem('wedding-strands-how-to-play', 'true');
    }
  }, []);

  // Refs for event handlers to avoid re-renders
  const selectedCellsRef = useRef(selectedCells);
  const isDraggingRef = useRef(isDragging);
  const isTapModeRef = useRef(isTapMode);
  const isCompleteRef = useRef(isComplete);

  const foundWordsRef = useRef(foundWords);

  useEffect(() => { selectedCellsRef.current = selectedCells; }, [selectedCells]);
  useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);
  useEffect(() => { isTapModeRef.current = isTapMode; }, [isTapMode]);
  useEffect(() => { isCompleteRef.current = isComplete; }, [isComplete]);
  useEffect(() => { foundWordsRef.current = foundWords; }, [foundWords]);

  const measureLayout = () => {
    if (!gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const centers = {};
    const rects = {}; // For hit testing (viewport relative)

    // We need to iterate over all possible cells
    PUZZLE_GRID.forEach((row, rowIndex) => {
      row.forEach((_, colIndex) => {
        const key = getCellKey(rowIndex, colIndex);
        const button = buttonRefs.current[key];
        if (button) {
          const rect = button.getBoundingClientRect();
          rects[key] = rect;

          // Calculate center relative to grid
          centers[key] = {
            x: rect.left - gridRect.left + rect.width / 2,
            y: rect.top - gridRect.top + rect.height / 2
          };
        }
      });
    });

    layoutCacheRef.current = { centers, rects };
  };

  // Measure layout on mount and resize
  useEffect(() => {
    measureLayout();
    window.addEventListener('resize', measureLayout);
    return () => window.removeEventListener('resize', measureLayout);
  }, []);

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

  const positionsMatch = (selected, wordDef) => {
    if (selected.length !== wordDef.positions.length) return false;

    // Check if selected positions match word positions exactly
    return selected.every((cell, index) => {
      const [row, col] = wordDef.positions[index];
      return cell.row === row && cell.col === col;
    });
  };

  const handleSubmit = useCallback(() => {
    const currentSelected = selectedCellsRef.current;
    if (currentSelected.length < 3) {
      setMessage('Word too short!');
      setTimeout(() => setMessage(''), 2000);
      setSelectedCells([]);
      return;
    }

    const word = currentSelected.map(c => c.letter).join('');

    // Check if this word matches any defined word by positions
    const foundWordDef = WORD_DEFINITIONS.find(wd =>
      wd.word === word || positionsMatch(currentSelected, wd)
    );

    const currentFoundWords = foundWordsRef.current;

    if (foundWordDef && !currentFoundWords.includes(foundWordDef.word)) {
      const newFoundWords = [...currentFoundWords, foundWordDef.word];
      setFoundWords(newFoundWords);
      setMessage(foundWordDef.isSpangram ? '🎉 Spangram found!' : 'Great job!');

      if (newFoundWords.length === WORD_DEFINITIONS.length) {
        setIsComplete(true);
        setShowCompletionModal(true);
      }

      setTimeout(() => setMessage(''), 2000);
    } else if (currentFoundWords.includes(word)) {
      setMessage('Already found!');
      setTimeout(() => setMessage(''), 2000);
    } else {
      setMessage('Not in word list or Invalid word!');
      setTimeout(() => setMessage(''), 2000);
    }

    setSelectedCells([]);
  }, []);

  const handleCellClick = useCallback((row, col) => {
    if (isCompleteRef.current || !isTapModeRef.current) return;

    const cellKey = getCellKey(row, col);
    const currentSelected = selectedCellsRef.current;
    const isAlreadySelected = currentSelected.some(c => c.key === cellKey);

    if (isAlreadySelected) {
      // If clicking the last cell in the selection, remove it
      if (currentSelected.length > 0 && currentSelected[currentSelected.length - 1].key === cellKey) {
        setSelectedCells(prev => prev.slice(0, -1));
      }
      return;
    }

    // If no cells selected, start new selection
    if (currentSelected.length === 0) {
      setSelectedCells([{ row, col, key: cellKey, letter: PUZZLE_GRID[row][col] }]);
      return;
    }

    // Check if adjacent to last cell
    const lastCell = currentSelected[currentSelected.length - 1];
    if (areAdjacent(lastCell, { row, col })) {
      setSelectedCells(prev => [...prev, { row, col, key: cellKey, letter: PUZZLE_GRID[row][col] }]);
    } else {
      setMessage('Must select adjacent letters!');
      setTimeout(() => setMessage(''), 1500);
    }
  }, []);

  const handleCellMouseDown = useCallback((row, col) => {
    if (isCompleteRef.current || isTapModeRef.current) return;
    setIsDragging(true);
    const cellKey = getCellKey(row, col);
    setSelectedCells([{ row, col, key: cellKey, letter: PUZZLE_GRID[row][col] }]);
  }, []);

  const handleCellMouseEnter = useCallback((row, col) => {
    if (!isDraggingRef.current || isCompleteRef.current || isTapModeRef.current) return;

    const cellKey = getCellKey(row, col);
    const currentSelected = selectedCellsRef.current;
    const isAlreadySelected = currentSelected.some(c => c.key === cellKey);

    if (!isAlreadySelected && currentSelected.length > 0) {
      const lastCell = currentSelected[currentSelected.length - 1];
      if (areAdjacent(lastCell, { row, col })) {
        setSelectedCells(prev => [...prev, { row, col, key: cellKey, letter: PUZZLE_GRID[row][col] }]);
      }
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current && selectedCellsRef.current.length >= 3) {
      handleSubmit();
    } else {
      setIsDragging(false);
    }
  }, [handleSubmit]);

  // Touch event handlers for mobile
  const handleCellTouchStart = useCallback((row, col, e) => {
    if (isCompleteRef.current) return;

    // In tap mode, let the touch convert to a click event naturally
    // Don't prevent default so onClick handler will fire
    if (isTapModeRef.current) {
      return;
    }

    // In drag mode, start dragging
    touchStartTimeRef.current = Date.now();
    setIsDragging(true);

    // Measure layout immediately on interaction start to ensure accuracy
    measureLayout();

    const cellKey = getCellKey(row, col);
    setSelectedCells([{ row, col, key: cellKey, letter: PUZZLE_GRID[row][col] }]);
  }, []);

  const handleSetButtonRef = useCallback((r, c, el) => {
    if (el) buttonRefs.current[getCellKey(r, c)] = el;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDraggingRef.current || isCompleteRef.current || isTapModeRef.current) return;

    // Prevent scrolling and other default behaviors during drag
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    if (!touch) return;

    // Use cached rects for hit testing
    const { rects } = layoutCacheRef.current;
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    // Find the cell under the finger
    let targetCell = null;

    // Optimization: Check if we are still over the last added cell first
    // (Common case)

    // Iterate through all cells to find which one contains the touch point
    // This is faster than elementFromPoint which causes reflow
    for (const key in rects) {
      const rect = rects[key];
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        const [r, c] = key.split('-').map(Number);
        targetCell = { row: r, col: c, key };
        break;
      }
    }

    if (targetCell) {
      const { row, col, key: cellKey } = targetCell;

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
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (isTapModeRef.current) return; // Tap mode handles selection differently

    if (isDraggingRef.current) {
      // Small delay to ensure last cell is captured
      const touchDuration = touchStartTimeRef.current ? Date.now() - touchStartTimeRef.current : 0;

      // Only submit if drag was intentional (not a quick tap)
      if (touchDuration > 150 && selectedCellsRef.current.length >= 3) {
        // Small delay to capture any final touches
        setTimeout(() => {
          handleSubmit();
        }, 50);
      }
      setIsDragging(false);
      touchStartTimeRef.current = null;
    }
  }, []); // handleSubmit is now stable (defined below)

  const handleTouchCancel = useCallback((e) => {
    // Handle touch cancel to prevent stuck drag state
    if (isDraggingRef.current) {
      setIsDragging(false);
      setSelectedCells([]);
      touchStartTimeRef.current = null;
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleMouseUp, handleTouchEnd, handleTouchCancel, handleTouchMove]);



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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 px-3 sm:px-4">
      {/* Completion Modal */}
      {/* Completion Modal */}
      <CompletionModal
        isOpen={showCompletionModal}
        icon="💍"
        message="You found all the words!"
        primaryButtonText="New Game"
        secondaryButtonText="Show Puzzle"
        onPrimaryAction={handleNewGame}
        onSecondaryAction={handleShowPuzzle}
        primaryButtonGradient="from-yellow-400 to-blue-500"
        stats={[
          {
            label: 'Time',
            value: formatTime(elapsedTime),
            gradient: 'from-yellow-100 to-blue-100 dark:from-yellow-900/30 dark:to-blue-900/30'
          }
        ]}
      />

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      >
        <ul className="space-y-2">
          <li>• Find all the hidden wedding-themed words.</li>
          <li>• Drag across adjacent letters to form words.</li>
          <li>• Look for the special spangram that spans across the puzzle (marked with ⭐)</li>
          <li>• Try to find all words as quickly as possible!</li>
        </ul>
      </HowToPlayModal>

      <div className="w-full max-w-[min(96vw,650px)] mx-auto">
        <header className="text-center mb-6 sm:mb-8">
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }} className="font-bold mb-2 text-gray-900 dark:text-gray-100">Strands</h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }} className="text-gray-600 dark:text-gray-300"> Wedding Edition</p>
          <p style={{ fontSize: 'clamp(0.55rem, 2vw, 0.75rem)' }} className="text-gray-500 dark:text-gray-400 mt-2">
            Find the hidden words! • Drag to select letters • Find the pangram!
          </p>
        </header>

        {/* Timer and Progress */}
        <div className="flex justify-between items-center mb-4 px-2">
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatTime(elapsedTime)}
          </div>
          <div className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300">
            {foundWords.length} / {WORD_DEFINITIONS.length}
          </div>
        </div>

        {/* Input Mode Toggle */}
        {!isComplete && (
          <div className="flex justify-center mb-4">
            <div className="bg-white border-2 border-gray-300 rounded-full p-1 inline-flex">
              <button
                onClick={() => setIsTapMode(false)}
                className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-colors ${!isTapMode
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
              >
                Drag Mode
              </button>
              <button
                onClick={() => setIsTapMode(true)}
                className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-colors ${isTapMode
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
              >
                Tap Mode
              </button>
            </div>
          </div>
        )}

        {/* Letter Grid with SVG */}
        <div className="mb-6 flex justify-center">
          <div className="relative inline-block" ref={gridRef} style={{ touchAction: isTapMode ? 'auto' : 'none' }}>
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

                // Use cached centers
                const prevCenter = layoutCacheRef.current.centers[prevCell.key];
                const currCenter = layoutCacheRef.current.centers[cell.key];

                if (!prevCenter || !currCenter) return null;

                return (
                  <line
                    key={`path-${index}`}
                    x1={prevCenter.x}
                    y1={prevCenter.y}
                    x2={currCenter.x}
                    y2={currCenter.y}
                    stroke="#3b82f6"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>

            <div className="relative" style={{ zIndex: 2 }}>
              {PUZZLE_GRID.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
                  {row.map((letter, colIndex) => {
                    const isSelected = isCellSelected(rowIndex, colIndex);
                    const isInFound = isCellInFoundWord(rowIndex, colIndex);

                    // Check if this cell is part of the spangram
                    const spangramWord = WORD_DEFINITIONS.find(wd => wd.isSpangram);
                    const isInSpangram = foundWords.includes(spangramWord?.word) &&
                      spangramWord?.positions.some(([r, c]) => r === rowIndex && c === colIndex);

                    const cellKey = getCellKey(rowIndex, colIndex);

                    return (
                      <StrandsCell
                        key={`${rowIndex}-${colIndex}`}
                        letter={letter}
                        row={rowIndex}
                        col={colIndex}
                        isSelected={isSelected}
                        isInFound={isInFound}
                        isInSpangram={isInSpangram}
                        isTapMode={isTapMode}
                        onCellClick={handleCellClick}
                        onCellMouseDown={handleCellMouseDown}
                        onCellMouseEnter={handleCellMouseEnter}
                        onCellTouchStart={handleCellTouchStart}
                        setButtonRef={handleSetButtonRef}
                      />
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
            <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
              {selectedCells.map(c => c.letter).join('')}
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className="text-center mb-4 font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100">
            {message}
          </div>
        )}

        {/* Controls */}
        {!isComplete && (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6">
            <button
              onClick={handleClear}
              className="px-4 sm:px-6 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
              disabled={selectedCells.length === 0}
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-colors ${selectedCells.length >= 3
                ? 'bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              disabled={selectedCells.length < 3}
              style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
            >
              Submit
            </button>
            <button
              onClick={() => setShowHint(!showHint)}
              className="px-4 sm:px-6 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
            >
              {showHint ? 'Hide' : 'Show'} Hints
            </button>
          </div>
        )}

        {/* New Game Button */}
        {isComplete && (
          <div className="flex justify-center gap-3 sm:gap-4">
            <button
              onClick={handleNewGame}
              className="px-5 sm:px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-blue-500 text-white rounded-full font-semibold hover:brightness-110 transition-all transform hover:scale-105 shadow-md"
              style={{ fontSize: 'clamp(0.8rem, 2vw, 0.875rem)' }}
            >
              New Game
            </button>
            <button
              onClick={() => setShowCompletionModal(true)}
              className="px-5 sm:px-6 py-2.5 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-full font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              style={{ fontSize: 'clamp(0.8rem, 2vw, 0.875rem)' }}
            >
              Show Time
            </button>
          </div>
        )}

        {/* Found Words List */}
        <div className="mt-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <h2 style={{ fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)' }} className="font-bold mb-3 text-gray-900 dark:text-gray-100">
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
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }
                  `}
                  style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}
                >
                  {word} {wordData?.isSpangram && '⭐ Spangram'}
                </div>
              );
            })}
          </div>

          {/* Hints */}
          {showHint && getRemainingWords().length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                Remaining Word Hints:
              </h3>
              <ul className="space-y-1 text-gray-600 dark:text-gray-300" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>
                {getRemainingWords().map((wd, index) => (
                  <li key={index}>• {wd.hint} {wd.isSpangram && '(Spangram)'}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* How to Play */}
        <div className="mt-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <h2 style={{ fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)' }} className="font-bold mb-3 text-gray-900 dark:text-gray-100">
            How to Play
          </h2>
          <ul style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }} className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>• Drag across adjacent letters to form words.</li>
            <li>• Find all the hidden wedding-themed words.</li>
            <li>• Look for the special spangram word (marked with ⭐).</li>
            <li>• The spangram spans across the puzzle.</li>
            <li>• Try to find all words as quickly as possible!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default WeddingStrands;
