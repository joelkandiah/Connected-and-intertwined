import React, { memo } from 'react';

const StrandsCell = memo(({
    letter,
    row,
    col,
    isSelected,
    isInFound,
    isInSpangram,
    isTapMode,
    onCellClick,
    onCellMouseDown,
    onCellMouseEnter,
    onCellTouchStart,
    setButtonRef
}) => {
    // Helper to call handlers with row/col
    const handleClick = () => onCellClick(row, col);
    const handleMouseDown = () => onCellMouseDown(row, col);
    const handleMouseEnter = () => onCellMouseEnter(row, col);
    const handleTouchStart = (e) => onCellTouchStart(row, col, e);

    return (
        <button
            ref={(el) => setButtonRef(row, col, el)}
            data-row={row}
            data-col={col}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onTouchStart={handleTouchStart}
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
                            ? 'bg-nyt-beige-dark text-white'
                            : 'bg-nyt-beige-light hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900'
                }
        cursor-pointer select-none
      `}
            style={{ touchAction: isTapMode ? 'auto' : 'none' }}
        >
            {letter}
        </button>
    );
});

StrandsCell.displayName = 'StrandsCell';

export default StrandsCell;
