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
          ? 'bg-gray-900 cursor-default' 
          : isSelected 
            ? 'bg-yellow-200 border-yellow-400 border-2 cursor-pointer' 
            : isHighlighted 
              ? 'bg-yellow-50 border-yellow-300 cursor-pointer'
              : 'bg-white border-gray-300 cursor-pointer hover:bg-gray-50'
        }
        ${isIncorrect ? 'bg-red-100' : ''}
        ${isRevealed ? 'bg-blue-50' : ''}
      `}
      role={isBlack ? 'presentation' : 'gridcell'}
      aria-label={isBlack ? undefined : `Cell ${number || ''}`}
      tabIndex={isBlack ? -1 : 0}
    >
      {!isBlack && number && (
        <span className="absolute top-0.5 left-0.5 text-[8px] sm:text-[10px] font-semibold text-gray-700">
          {number}
        </span>
      )}
      {!isBlack && isRevealed && (
        <div 
          className="absolute top-0 right-0 w-0 h-0 border-t-[12px] border-r-[12px]"
          style={{
            borderTopColor: '#3b82f6',
            borderRightColor: '#3b82f6',
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent'
          }}
          title="Revealed cell"
        />
      )}
      {!isBlack && (
        <span className="text-base sm:text-lg md:text-xl font-bold uppercase text-gray-900">
          {value}
        </span>
      )}
    </div>
  );
};

export default Cell;
