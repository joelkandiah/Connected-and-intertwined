import React from 'react';

const ClueList = ({ title, clues, currentClue, onClueClick }) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg sm:text-xl font-bold mb-3 uppercase text-gray-900 dark:text-gray-100">{title}</h3>
      <div className="space-y-2">
        {Object.entries(clues).map(([number, clueData]) => {
          const isCurrent = currentClue && 
            currentClue.number === number && 
            currentClue.direction === title.toLowerCase();
          
          return (
            <div
              key={number}
              onClick={() => onClueClick(number, title.toLowerCase())}
              className={`
                p-2 rounded cursor-pointer transition-colors text-gray-900 dark:text-gray-100
                ${isCurrent 
                  ? 'bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 dark:border-yellow-600 font-semibold' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <span className="font-bold mr-2">{number}.</span>
              <span className="text-sm sm:text-base">{clueData.clue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClueList;
