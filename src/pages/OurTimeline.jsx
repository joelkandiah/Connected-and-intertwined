import { useState, useEffect, useRef } from 'react';
import flashbackData from '../data/flashback.json';

const STORAGE_KEY = 'our-timeline-progress';

function OurTimeline() {
  const [cards, setCards] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const timerRef = useRef(null);
  const isInitialMount = useRef(true);

  // Load saved state
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const state = JSON.parse(savedState);
      setCards(state.cards || []);
      setElapsedTime(state.elapsedTime || 0);
      setIsComplete(state.isComplete || false);
      
      if (state.isComplete) {
        setShowCompletionModal(false);
      }
    } else {
      // Initialize with shuffled cards
      const shuffled = [...flashbackData.events].sort(() => Math.random() - 0.5);
      setCards(shuffled);
    }
  }, []);

  // Save state
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      cards,
      elapsedTime,
      isComplete
    }));
  }, [cards, elapsedTime, isComplete]);

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

  const checkIfCorrect = (currentCards) => {
    // Check if all cards are in the correct chronological order
    for (let i = 0; i < currentCards.length - 1; i++) {
      const current = new Date(currentCards[i].sortDate);
      const next = new Date(currentCards[i + 1].sortDate);
      if (current > next) {
        return false;
      }
    }
    return true;
  };

  const handleDragStart = (e, index) => {
    if (isComplete) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // For mobile, we don't want to show the default ghost image
    if (e.dataTransfer.setDragImage) {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      e.dataTransfer.setDragImage(canvas, 0, 0);
    }
  };

  const handleDragOver = (e, index) => {
    if (isComplete) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    if (isComplete) return;
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newCards = [...cards];
    const [draggedCard] = newCards.splice(draggedIndex, 1);
    newCards.splice(dropIndex, 0, draggedCard);
    
    setCards(newCards);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Check if the order is correct
    if (checkIfCorrect(newCards)) {
      setIsComplete(true);
      setShowCompletionModal(true);
      setIsTimerRunning(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Touch events for mobile
  const touchStartPos = useRef(null);
  const touchCardRef = useRef(null);

  const handleTouchStart = (e, index) => {
    if (isComplete) return;
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    setDraggedIndex(index);
    touchCardRef.current = e.currentTarget;
  };

  const handleTouchMove = (e, index) => {
    if (isComplete || draggedIndex === null) return;
    e.preventDefault(); // Prevent scrolling
    
    const touch = e.touches[0];
    const element = e.currentTarget.parentElement;
    const cards = Array.from(element.children);
    
    // Find which card we're hovering over
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        setDragOverIndex(i);
        break;
      }
    }
  };

  const handleTouchEnd = (e, index) => {
    if (isComplete) return;
    e.preventDefault(); // Prevent scrolling
    
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newCards = [...cards];
      const [draggedCard] = newCards.splice(draggedIndex, 1);
      newCards.splice(dragOverIndex, 0, draggedCard);
      
      setCards(newCards);

      // Check if the order is correct
      if (checkIfCorrect(newCards)) {
        setIsComplete(true);
        setShowCompletionModal(true);
        setIsTimerRunning(false);
      }
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    touchStartPos.current = null;
    touchCardRef.current = null;
  };

  const handleNewGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    const shuffled = [...flashbackData.events].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setElapsedTime(0);
    setIsComplete(false);
    setShowCompletionModal(false);
    setIsTimerRunning(true);
  };

  const handleShowPuzzle = () => {
    setShowCompletionModal(false);
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
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">You've arranged our timeline correctly!</p>
              <p className="text-base text-gray-600 dark:text-gray-400 mb-6">Time: {formatTime(elapsedTime)}</p>
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
                  Show Timeline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-[min(96vw,650px)] mx-auto">
        <header className="text-center mb-6 sm:mb-8">
          <h1 style={{fontSize: 'clamp(2rem, 5vw, 3rem)'}} className="font-bold mb-2 text-gray-900 dark:text-gray-100">Our Timeline</h1>
          <p style={{fontSize: 'clamp(1rem, 2.5vw, 1.25rem)'}} className="text-gray-600 dark:text-gray-300">Arrange the events in chronological order</p>
          
          {/* Timer */}
          <div className="mt-4 text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatTime(elapsedTime)}
          </div>
        </header>

        {/* Cards */}
        <div className="space-y-3 mb-6">
          {cards.map((card, index) => {
            const isDragging = draggedIndex === index;
            const isOver = dragOverIndex === index;
            
            return (
              <div
                key={card.id}
                draggable={!isComplete}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchMove={(e) => handleTouchMove(e, index)}
                onTouchEnd={(e) => handleTouchEnd(e, index)}
                className={`
                  bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5
                  ${!isComplete ? 'cursor-move hover:shadow-lg' : ''}
                  ${isDragging ? 'opacity-50' : ''}
                  ${isOver && !isDragging ? 'border-t-4 border-nyt-blue' : ''}
                  transition-all duration-200
                  touch-none
                `}
                style={{
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: 'none'
                }}
              >
                <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-2">
                  {card.title}
                </h3>
                {isComplete && (
                  <p className="text-sm sm:text-base text-nyt-blue font-semibold mb-2">
                    {card.displayDate}
                  </p>
                )}
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* New Game button when completed */}
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

        {/* How to Play */}
        <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <h2 style={{fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)'}} className="font-bold mb-3 text-gray-900 dark:text-gray-100">How to Play</h2>
          <ul style={{fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'}} className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>• Drag and drop the cards to arrange them in chronological order.</li>
            <li>• Each card represents a special moment in our relationship.</li>
            <li>• Get them all in the right order to complete the timeline!</li>
            <li>• Your time will be saved even if you leave the page.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default OurTimeline;
