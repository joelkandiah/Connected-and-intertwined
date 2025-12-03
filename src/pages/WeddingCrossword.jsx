import React, { useState, useEffect, useCallback, useRef, use, useMemo } from 'react';
import Cell from '../components/Cell';
import ClueList from '../components/ClueList';
import HowToPlayModal from '../components/HowToPlayModal';
import CompletionModal from '../components/CompletionModal';

import { saveCrosswordProgress, loadCrosswordProgress, clearCrosswordProgress } from '../utils/storage';

const puzzlePromise = import('../data/wedding-crossword.json').then(m => m.default || m);

const WeddingCrossword = () => {
  const puzzleData = use(puzzlePromise);
  const PUZZLE_GRID = useMemo(() => puzzleData.grid, [puzzleData]);
  const PUZZLE_CLUES = useMemo(() => puzzleData.clues, [puzzleData]);
  const PUZZLE_SIZE = useMemo(() => puzzleData.size, [puzzleData]);
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [direction, setDirection] = useState('across'); // 'across' or 'down'
  const [incorrectCells, setIncorrectCells] = useState(new Set());
  const [revealedCells, setRevealedCells] = useState(new Set());
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [viewOnlyMode, setViewOnlyMode] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const inputRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const lastKeyEventRef = useRef(0);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Check for first time visit
  useEffect(() => {
    const hasSeenHowToPlay = localStorage.getItem('wedding-crossword-how-to-play');
    if (!hasSeenHowToPlay) {
      setShowHowToPlay(true);
      localStorage.setItem('wedding-crossword-how-to-play', 'true');
    }
  }, []);

  // Initialize grid from puzzle data
  useEffect(() => {
    const savedProgress = loadCrosswordProgress();
    const initialGrid = PUZZLE_GRID.map((row, rowIndex) =>
      row.split('').map((char, colIndex) => ({
        isBlock: char === '#',
        solution: char === '#' ? null : char,
        value: '',
        row: rowIndex,
        col: colIndex,
        number: null
      }))
    );

    // Add clue numbers to grid
    const addClueNumber = (clueData, number) => {
      const { row, col } = clueData;
      if (initialGrid[row] && initialGrid[row][col]) {
        initialGrid[row][col].number = number;
      }
    };

    Object.entries(PUZZLE_CLUES.across).forEach(([num, data]) => addClueNumber(data, num));
    Object.entries(PUZZLE_CLUES.down).forEach(([num, data]) => addClueNumber(data, num));

    // Restore saved progress
    if (savedProgress && savedProgress.grid) {
      savedProgress.grid.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (initialGrid[r] && initialGrid[r][c]) {
            initialGrid[r][c].value = cell.value || '';
          }
        });
      });
    }

    // Restore revealed cells
    if (savedProgress && savedProgress.revealedCells) {
      setRevealedCells(new Set(savedProgress.revealedCells));
    }

    setGrid(initialGrid);
  }, [PUZZLE_GRID, PUZZLE_CLUES]);

  // Save progress whenever grid or revealed cells change
  useEffect(() => {
    if (grid.length > 0) {
      saveCrosswordProgress({
        grid,
        elapsedTime,
        revealedCells: Array.from(revealedCells)
      });
    }
  }, [grid, elapsedTime, revealedCells]);

  // Load saved time on initial load
  useEffect(() => {
    const savedProgress = loadCrosswordProgress();
    if (savedProgress && savedProgress.elapsedTime) {
      setElapsedTime(savedProgress.elapsedTime);
    }
  }, []);

  // Timer logic - only runs when page is visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTimerRunning(false);
      } else if (!isCompleted) {
        setIsTimerRunning(true);
      }
    };

    // Start timer when component mounts (if not completed)
    if (!isCompleted) {
      setIsTimerRunning(true);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isCompleted]);

  // Timer interval
  useEffect(() => {
    if (isTimerRunning && !isCompleted) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, isCompleted]);

  // Check if puzzle is completed
  useEffect(() => {
    if (grid.length === 0) return;

    const allCellsCorrect = grid.every(row =>
      row.every(cell => {
        if (cell.isBlock) return true;
        return cell.value.toUpperCase() === cell.solution;
      })
    );

    if (allCellsCorrect && !isCompleted) {
      setIsCompleted(true);
      setShowCompletionModal(true);
      setIsTimerRunning(false);
    }
  }, [grid, isCompleted]);

  // Get current word cells based on selected cell and direction
  const getCurrentWordCells = useCallback(() => {
    if (!selectedCell) return [];

    const { row, col } = selectedCell;
    const cells = [];

    if (direction === 'across') {
      let startCol = col;
      while (startCol > 0 && grid[row] && grid[row][startCol - 1] && !grid[row][startCol - 1].isBlock) {
        startCol--;
      }
      let currentCol = startCol;
      while (grid[row] && grid[row][currentCol] && !grid[row][currentCol].isBlock) {
        cells.push({ row, col: currentCol });
        currentCol++;
      }
    } else {
      let startRow = row;
      while (startRow > 0 && grid[startRow - 1] && grid[startRow - 1][col] && !grid[startRow - 1][col].isBlock) {
        startRow--;
      }
      let currentRow = startRow;
      while (grid[currentRow] && grid[currentRow][col] && !grid[currentRow][col].isBlock) {
        cells.push({ row: currentRow, col });
        currentRow++;
      }
    }

    return cells;
  }, [selectedCell, direction, grid]);

  // Get current clue
  const getCurrentClue = useCallback(() => {
    if (!selectedCell) return null;

    const wordCells = getCurrentWordCells();
    if (wordCells.length === 0) return null;

    const firstCell = grid[wordCells[0].row][wordCells[0].col];
    const number = firstCell.number;

    if (number && PUZZLE_CLUES[direction][number]) {
      return {
        number,
        direction,
        clue: PUZZLE_CLUES[direction][number].clue
      };
    }

    return null;
  }, [selectedCell, direction, grid, getCurrentWordCells]);

  // Handle cell click
  const handleCellClick = (row, col) => {
    if (viewOnlyMode) return; // Don't allow interaction in view-only mode
    const cell = grid[row][col];
    if (cell.isBlock) return;

    // Toggle direction if clicking the same cell
    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
      setDirection(prev => prev === 'across' ? 'down' : 'across');
    } else {
      setSelectedCell({ row, col });
    }

    // Focus the hidden input to trigger mobile keyboard
    // Save scroll position to prevent unwanted scrolling
    if (inputRef.current) {
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      inputRef.current.focus({ preventScroll: true });
      // Restore scroll position in case it changed
      window.scrollTo(scrollX, scrollY);
    }
  };

  // Handle keyboard input
  const handleKeyDown = useCallback((e) => {
    if (!selectedCell || viewOnlyMode) return;

    const { row, col } = selectedCell;

    // Handle letter input
    if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      lastKeyEventRef.current = Date.now(); // Mark that we handled a key event
      const newGrid = [...grid];

      // If cell already has a value, replace it and move to next cell
      const hadValue = newGrid[row][col].value !== '';
      newGrid[row][col].value = e.key.toUpperCase();
      setGrid(newGrid);

      // Clear incorrect/revealed state for this cell
      setIncorrectCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${row}-${col}`);
        return newSet;
      });
      setRevealedCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${row}-${col}`);
        return newSet;
      });

      // Always move to next cell after typing
      moveToNextCell();
    }
    // Handle backspace/delete
    else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      const newGrid = [...grid];
      if (newGrid[row][col].value) {
        newGrid[row][col].value = '';
        setGrid(newGrid);
      } else {
        moveToPreviousCell();
      }
    }
    // Handle arrow keys
    else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (direction !== 'across') {
        setDirection('across');
      } else {
        moveInDirection(0, 1);
      }
    }
    else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (direction !== 'across') {
        setDirection('across');
      } else {
        moveInDirection(0, -1);
      }
    }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (direction !== 'down') {
        setDirection('down');
      } else {
        moveInDirection(1, 0);
      }
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (direction !== 'down') {
        setDirection('down');
      } else {
        moveInDirection(-1, 0);
      }
    }
    // Handle Enter - toggle direction
    else if (e.key === 'Enter') {
      e.preventDefault();
      setDirection(prev => prev === 'across' ? 'down' : 'across');
    }
  }, [selectedCell, grid, direction]);

  // Handle input from mobile keyboard (for devices without proper keydown events)
  const handleInputChange = useCallback((e) => {
    if (!selectedCell || viewOnlyMode) return;

    // If a keydown event was handled within the last 100ms, skip this to avoid duplicates
    if (Date.now() - lastKeyEventRef.current < 100) {
      e.target.value = '';
      return;
    }

    const value = e.target.value;
    // Only handle single character input
    if (value && value.length === 1 && /^[a-zA-Z]$/.test(value)) {
      const { row, col } = selectedCell;
      const newGrid = [...grid];

      newGrid[row][col].value = value.toUpperCase();
      setGrid(newGrid);

      // Clear incorrect/revealed state for this cell
      setIncorrectCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${row}-${col}`);
        return newSet;
      });
      setRevealedCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${row}-${col}`);
        return newSet;
      });

      // Move to next cell
      moveToNextCell();
    }

    // Always clear input
    e.target.value = '';
  }, [selectedCell, grid, viewOnlyMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const moveInDirection = (rowDelta, colDelta) => {
    if (!selectedCell) return;

    let newRow = selectedCell.row + rowDelta;
    let newCol = selectedCell.col + colDelta;

    while (
      newRow >= 0 && newRow < grid.length &&
      newCol >= 0 && newCol < grid[0].length
    ) {
      if (!grid[newRow][newCol].isBlock) {
        setSelectedCell({ row: newRow, col: newCol });
        return;
      }
      newRow += rowDelta;
      newCol += colDelta;
    }
  };

  const moveToNextCell = () => {
    const wordCells = getCurrentWordCells();
    if (wordCells.length === 0) return;

    const currentIndex = wordCells.findIndex(
      cell => cell.row === selectedCell.row && cell.col === selectedCell.col
    );

    if (currentIndex < wordCells.length - 1) {
      const nextCell = wordCells[currentIndex + 1];
      setSelectedCell({ row: nextCell.row, col: nextCell.col });
    }
  };

  const moveToPreviousCell = () => {
    const wordCells = getCurrentWordCells();
    if (wordCells.length === 0) return;

    const currentIndex = wordCells.findIndex(
      cell => cell.row === selectedCell.row && cell.col === selectedCell.col
    );

    if (currentIndex > 0) {
      const prevCell = wordCells[currentIndex - 1];
      setSelectedCell({ row: prevCell.row, col: prevCell.col });
    }
  };

  // Check current word
  const handleCheck = () => {
    const wordCells = getCurrentWordCells();
    const newIncorrect = new Set(incorrectCells);

    wordCells.forEach(({ row, col }) => {
      const cell = grid[row][col];
      if (cell.value && cell.value !== cell.solution) {
        newIncorrect.add(`${row}-${col}`);
      } else {
        newIncorrect.delete(`${row}-${col}`);
      }
    });

    setIncorrectCells(newIncorrect);
  };

  // Reveal current word
  const handleReveal = () => {
    const wordCells = getCurrentWordCells();
    const newGrid = [...grid];
    const newRevealed = new Set(revealedCells);

    wordCells.forEach(({ row, col }) => {
      newGrid[row][col].value = newGrid[row][col].solution;
      newRevealed.add(`${row}-${col}`);
    });

    setGrid(newGrid);
    setRevealedCells(newRevealed);
    setIncorrectCells(prev => {
      const newSet = new Set(prev);
      wordCells.forEach(({ row, col }) => {
        newSet.delete(`${row}-${col}`);
      });
      return newSet;
    });
  };

  // Reveal all
  const handleRevealAll = () => {
    // This step correctly updates the grid contents to the solution
    const newGrid = grid.map(row =>
      row.map(cell => ({
        ...cell,
        value: cell.isBlock ? '' : cell.solution // Set the cell value to the solution
      }))
    );

    // 1. Create a new Set to hold ONLY the newly revealed cell coordinates
    const newlyRevealed = new Set();

    // 2. Iterate through the original grid to compare user input against the solution
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {

        // Check if it's a playable cell AND the current value is NOT the solution
        if (!cell.isBlock && cell.value !== cell.solution) {

          // **Only add the cell to the set if the solution had to be revealed**
          newlyRevealed.add(`${rowIndex}-${colIndex}`);
        }
      });
    });

    // 3. Update the states
    setGrid(newGrid);
    // Merge the existing revealed cells with the newly revealed ones
    setRevealedCells(prevRevealed => {
      return new Set([...prevRevealed, ...newlyRevealed]);
    });
    setIncorrectCells(new Set()); // Clear all incorrect cells
  };

  const handleClear = () => {
    const wordCells = getCurrentWordCells();
    const newGrid = [...grid];

    wordCells.forEach(({ row, col }) => {
      newGrid[row][col].value = '';
    });

    setGrid(newGrid);
    setIncorrectCells(prev => {
      const newSet = new Set(prev);
      wordCells.forEach(({ row, col }) => {
        newSet.delete(`${row}-${col}`);
      });
      return newSet;
    });
  };

  // Reset puzzle
  const handleReset = () => {
    if (confirm('Are you sure you want to reset the puzzle? All progress will be lost.')) {
      const newGrid = grid.map(row =>
        row.map(cell => ({
          ...cell,
          value: ''
        }))
      );
      setGrid(newGrid);
      setIncorrectCells(new Set());
      setRevealedCells(new Set());
      setIsCompleted(false);
      setShowCompletionModal(false);
      setViewOnlyMode(false);
      setElapsedTime(0);
      setIsTimerRunning(true);
      clearCrosswordProgress();
    }
  };

  // Handle New Game from completion modal
  const handleNewGame = () => {
    handleReset();
  };

  // Handle Show Puzzle from completion modal
  const handleShowPuzzle = () => {
    setShowCompletionModal(false);
    setViewOnlyMode(true);
    setSelectedCell(null);
  };

  // Handle clue click
  const handleClueClick = useCallback((number, clueDirection) => {
    if (viewOnlyMode) return; // Don't allow clue clicks in view-only mode
    const clueData = PUZZLE_CLUES[clueDirection][number];
    if (clueData) {
      setSelectedCell({ row: clueData.row, col: clueData.col });
      setDirection(clueDirection);
    }
  }, [viewOnlyMode]);

  const currentClue = getCurrentClue();
  const wordCells = getCurrentWordCells();

  return (
    <div className="min-h-screen py-4 sm:py-8 px-3 sm:px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-6 sm:mb-8">
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }} className="font-bold mb-2 text-gray-900 dark:text-gray-100">The Mini</h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }} className="text-gray-600 dark:text-gray-300">Wedding Edition</p>
          <p style={{ fontSize: 'clamp(0.55rem, 2vw, 0.75rem)' }} className="text-gray-500 dark:text-gray-400 mt-2">Piece together all the clues!</p>
          {/* Timer display */}
          <div className="mt-3 text-lg font-semibold text-gray-700 dark:text-gray-300">
            Time: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
          </div>
        </header>

        {/* Completion Modal */}
        <CompletionModal
          isOpen={showCompletionModal}
          icon="🎉"
          message="You completed the puzzle!"
          primaryButtonText="New Game"
          secondaryButtonText="Show Puzzle"
          onPrimaryAction={handleNewGame}
          onSecondaryAction={handleShowPuzzle}
          primaryButtonGradient="from-pink-500 to-purple-500"
          stats={[
            {
              label: 'Your Time',
              value: `${Math.floor(elapsedTime / 60)}:${(elapsedTime % 60).toString().padStart(2, '0')}`,
              gradient: 'from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30'
            }
          ]}
        />

        <HowToPlayModal
          isOpen={showHowToPlay}
          onClose={() => setShowHowToPlay(false)}
        >
          <ul className="space-y-2">
            <li>• Complete the grid of words as quick as you can.</li>
            <li>• Select a cell to reveal each clue.</li>
            <li>• Clicking or Tapping on a cell switches between Across and Down.</li>
          </ul>
        </HowToPlayModal>

        {/* Hidden input for mobile keyboard */}
        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          onInput={handleInputChange}
          className="fixed opacity-0 pointer-events-none"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: '1px',
            height: '1px',
            transform: 'translate(-50%, -50%)',
            zIndex: -1
          }}
          aria-hidden="true"
        />

        {/* Current clue display */}
        {currentClue && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-pink-200 dark:border-pink-700">
            <div className="text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1">
              {currentClue.number} {currentClue.direction}
            </div>
            <div className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
              {currentClue.clue}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* Crossword grid */}
          <div className="w-full flex justify-center">
            <div
              className="grid gap-0 bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg shadow-lg"
              style={{
                gridTemplateColumns: `repeat(${PUZZLE_SIZE}, minmax(0, 1fr))`,
                width: 'clamp(280px, 100%, 500px)',
                maxWidth: '100vw',
                aspectRatio: '1/1'
              }}
              role="grid"
              aria-label="Crossword puzzle grid"
            >
              {grid.map((row, rowIndex) => (
                <div key={`row-${rowIndex}`} role="row" style={{ display: 'contents' }}>
                  {row.map((cell, colIndex) => {
                    const isSelected = selectedCell &&
                      selectedCell.row === rowIndex &&
                      selectedCell.col === colIndex;
                    const isHighlighted = wordCells.some(
                      c => c.row === rowIndex && c.col === colIndex
                    ) && !isSelected;
                    const isIncorrect = incorrectCells.has(`${rowIndex}-${colIndex}`);
                    const isRevealed = revealedCells.has(`${rowIndex}-${colIndex}`);

                    return (
                      <Cell
                        key={`${rowIndex}-${colIndex}`}
                        cell={cell}
                        isSelected={isSelected}
                        isHighlighted={isHighlighted}
                        isIncorrect={isIncorrect}
                        isRevealed={isRevealed}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Current clue display */}
          {currentClue && (
            <div className="sm:hidden mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-pink-200 dark:border-pink-700">
              <div className="text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1">
                {currentClue.number} {currentClue.direction}
              </div>
              <div className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
                {currentClue.clue}
              </div>
            </div>
          )}

          {/* Control buttons */}
          {!viewOnlyMode ? (
            <div className="flex flex-wrap gap-6 sm:gap-8 justify-center">
              <button
                onClick={handleCheck}
                className="btn-control text-sm"
                disabled={!selectedCell}
              >
                Check Word
              </button>
              <button
                onClick={handleReveal}
                className="btn-control text-sm"
                disabled={!selectedCell}
              >
                Reveal Word
              </button>
              <button
                onClick={handleClear}
                className="btn-control text-sm"
                disabled={!selectedCell}
              >
                Clear Word
              </button>
              <button
                onClick={handleRevealAll}
                className="btn-control text-sm !bg-pink-100 dark:!bg-pink-900/50 !border-pink-300 dark:!border-pink-700 hover:!bg-pink-200 dark:hover:!bg-pink-900/70"
              >
                Reveal All
              </button>
              <button
                onClick={handleReset}
                className="btn-control text-sm !bg-purple-100 dark:!bg-purple-900/50 !border-purple-300 dark:!border-purple-700 hover:!bg-purple-200 dark:hover:!bg-purple-900/70"
              >
                Reset Puzzle
              </button>
            </div>
          ) : (
            <div className="flex justify-center gap-6 sm:gap-8">
              <button
                onClick={handleNewGame}
                className="btn-primary bg-gradient-to-r from-pink-500 to-purple-500 text-sm"
              >
                New Game
              </button>
              <button
                onClick={() => setShowCompletionModal(true)}
                className="btn-secondary text-sm"
              >
                Show Time
              </button>
            </div>
          )}

          {/* Clues */}
          <div className="w-full">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
              <ClueList
                title="Across"
                clues={PUZZLE_CLUES.across}
                currentClue={currentClue}
                onClueClick={handleClueClick}
              />
              <ClueList
                title="Down"
                clues={PUZZLE_CLUES.down}
                currentClue={currentClue}
                onClueClick={handleClueClick}
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <h2 className="text-lg sm:text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">How to Play</h2>
          <ul className="space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
            <li>• Click on a cell to select it, then type to fill in letters.</li>
            <li>• Click the same cell again or press Enter to toggle between Across and Down.</li>
            <li>• Use arrow keys to navigate between cells.</li>
            <li>• Press Backspace to delete the current letter or move to the previous cell.</li>
            <li>• Click on a clue to jump to that word.</li>
            <li>• Use Check Word to verify your answer for the current word.</li>
            <li>• Your progress is automatically saved!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};


export default WeddingCrossword;
