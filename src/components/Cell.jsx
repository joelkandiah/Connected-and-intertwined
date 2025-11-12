import React from 'react';

const Cell = ({ 
  cell, 
  isSelected, 
  isHighlighted, 
  isRevealed,
  isIncorrect,
  onClick 
}) => {
  const isBlack = cell.isBlock;
  const value = cell.value || '';
  const number = cell.number;

  return (
    <div
      onClick={isBlack ? undefined : onClick}
      className={`
        relative aspect-square border flex items-center justify-center
        ${isBlack 
          ? 'bg-gray-900 dark:bg-black cursor-default' 
          : isSelected 
            ? 'bg-yellow-200 dark:bg-yellow-700 border-yellow-400 dark:border-yellow-500 border-2 cursor-pointer' 
            : isIncorrect   // <--- Check isIncorrect here!
              ? 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700 cursor-pointer' // Added border for style
              : isHighlighted 
                ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 cursor-pointer'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600'
        }
        ${isRevealed ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
      `}
      role={isBlack ? 'presentation' : 'gridcell'}
      aria-label={isBlack ? undefined : `Cell ${number || ''}`}
      tabIndex={isBlack ? -1 : 0}
    >
      {!isBlack && number && (
        <span className="absolute top-0.5 left-0.5 text-[8px] sm:text-[10px] font-semibold text-gray-700 dark:text-gray-300">
          {number}
        </span>
      )}
      {!isBlack && isRevealed && (
        <div 
          className="absolute top-0 left-0 w-0 h-0 border-t-[12px] border-r-[12px]"
          style={{
            borderTop: '12px solid #3b82f6', // Visible color
            borderLeft: '12px solid #3b82f6', // Visible color
            borderRight: '12px solid transparent', // Invisible
            borderBottom: '12px solid transparent', // Invisible
          }}
          title="Revealed cell"
        />
      )}
      {!isBlack && (
        <span className="text-base sm:text-lg md:text-xl font-bold uppercase text-gray-900 dark:text-gray-100">
          {value}
        </span>
      )}
    </div>
  );
};

export default Cell;
