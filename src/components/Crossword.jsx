import React, { useState, useEffect, useCallback } from 'react';
import Cell from './Cell';
import ClueList from './ClueList';
import puzzleData from '../data/wedding-crossword.json';
import { saveCrosswordProgress, loadCrosswordProgress, clearCrosswordProgress } from '../utils/storage';

const Crossword = () => {
  const [grid, setGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [direction, setDirection] = useState('across'); // 'across' or 'down'
  const [incorrectCells, setIncorrectCells] = useState(new Set());
  const [revealedCells, setRevealedCells] = useState(new Set());

  // Initialize grid from puzzle data
  useEffect(() => {
    const savedProgress = loadCrosswordProgress();
    const initialGrid = puzzleData.grid.map((row, rowIndex) => 
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

    Object.entries(puzzleData.clues.across).forEach(([num, data]) => addClueNumber(data, num));
    Object.entries(puzzleData.clues.down).forEach(([num, data]) => addClueNumber(data, num));

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

    setGrid(initialGrid);
  }, []);

  // Save progress whenever grid changes
  useEffect(() => {
    if (grid.length > 0) {
      saveCrosswordProgress({ grid });
    }
  }, [grid]);

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

    if (number && puzzleData.clues[direction][number]) {
      return {
        number,
        direction,
        clue: puzzleData.clues[direction][number].clue
      };
    }

    return null;
  }, [selectedCell, direction, grid, getCurrentWordCells]);

  // Handle cell click
  const handleCellClick = (row, col) => {
    const cell = grid[row][col];
    if (cell.isBlock) return;

    // Toggle direction if clicking the same cell
    if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
      setDirection(prev => prev === 'across' ? 'down' : 'across');
    } else {
      setSelectedCell({ row, col });
    }
  };

  // Handle keyboard input
  const handleKeyDown = useCallback((e) => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;

    // Handle letter input
    if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      const newGrid = [...grid];
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

      // Move to next cell
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
    const newGrid = grid.map(row => 
      row.map(cell => ({
        ...cell,
        value: cell.isBlock ? '' : cell.solution
      }))
    );
    setGrid(newGrid);
    setIncorrectCells(new Set());
  };

  // Clear current word
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
      clearCrosswordProgress();
    }
  };

  // Handle clue click
  const handleClueClick = (number, clueDirection) => {
    const clueData = puzzleData.clues[clueDirection][number];
    if (clueData) {
      setSelectedCell({ row: clueData.row, col: clueData.col });
      setDirection(clueDirection);
    }
  };

  const currentClue = getCurrentClue();
  const wordCells = getCurrentWordCells();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Wedding Crossword
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            A celebration of love and unity
          </p>
        </header>

        {/* Current clue display */}
        {currentClue && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border-2 border-pink-200">
            <div className="text-sm text-gray-600 uppercase tracking-wide mb-1">
              {currentClue.number} {currentClue.direction}
            </div>
            <div className="text-base sm:text-lg font-medium text-gray-900">
              {currentClue.clue}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Crossword grid */}
          <div className="flex-shrink-0">
            <div 
              className="inline-grid gap-0 bg-white p-2 sm:p-4 rounded-lg shadow-lg border-2 border-pink-100"
              style={{ 
                gridTemplateColumns: `repeat(${puzzleData.size}, minmax(0, 1fr))`,
                maxWidth: 'min(90vw, 600px)',
                width: '100%'
              }}
              role="grid"
              aria-label="Crossword puzzle grid"
            >
              {grid.map((row, rowIndex) => 
                row.map((cell, colIndex) => {
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
                })
              )}
            </div>

            {/* Control buttons */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <button
                onClick={handleCheck}
                className="px-4 py-2 bg-white border-2 border-gray-300 rounded-full font-semibold hover:bg-gray-50 transition-colors text-sm"
                disabled={!selectedCell}
              >
                Check Word
              </button>
              <button
                onClick={handleReveal}
                className="px-4 py-2 bg-white border-2 border-gray-300 rounded-full font-semibold hover:bg-gray-50 transition-colors text-sm"
                disabled={!selectedCell}
              >
                Reveal Word
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-white border-2 border-gray-300 rounded-full font-semibold hover:bg-gray-50 transition-colors text-sm"
                disabled={!selectedCell}
              >
                Clear Word
              </button>
              <button
                onClick={handleRevealAll}
                className="px-4 py-2 bg-pink-100 border-2 border-pink-300 rounded-full font-semibold hover:bg-pink-200 transition-colors text-sm"
              >
                Reveal All
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-purple-100 border-2 border-purple-300 rounded-full font-semibold hover:bg-purple-200 transition-colors text-sm"
              >
                Reset Puzzle
              </button>
            </div>
          </div>

          {/* Clues */}
          <div className="flex-1 min-w-0">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border-2 border-pink-100">
              <ClueList
                title="Across"
                clues={puzzleData.clues.across}
                currentClue={currentClue}
                onClueClick={handleClueClick}
              />
              <ClueList
                title="Down"
                clues={puzzleData.clues.down}
                currentClue={currentClue}
                onClueClick={handleClueClick}
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 sm:p-6 bg-white rounded-lg shadow-sm border-2 border-pink-100">
          <h2 className="text-lg sm:text-xl font-bold mb-3">How to Play</h2>
          <ul className="space-y-2 text-sm sm:text-base text-gray-700">
            <li>• Click on a cell to select it, then type to fill in letters</li>
            <li>• Click the same cell again or press Enter to toggle between Across and Down</li>
            <li>• Use arrow keys to navigate between cells</li>
            <li>• Press Backspace to delete the current letter or move to the previous cell</li>
            <li>• Click on a clue to jump to that word</li>
            <li>• Use Check Word to verify your answer for the current word</li>
            <li>• Your progress is automatically saved!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Crossword;
