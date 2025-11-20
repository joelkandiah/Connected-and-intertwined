import { useState, useEffect, useRef } from 'react';
import flashbackData from '../data/flashback.json';

// Storage key for persisting game state
const STORAGE_KEY = 'our-timeline-progress';

function OurTimeline() {
  const [placedCards, setPlacedCards] = useState([]); // Cards already placed in timeline
  const [currentCard, setCurrentCard] = useState(null); // Card to be placed
  const [remainingCards, setRemainingCards] = useState([]); // Cards not yet shown
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'correct' or 'incorrect'
  const [tempPlacementIndex, setTempPlacementIndex] = useState(null); // Where user is trying to place
  const [isDragging, setIsDragging] = useState(false); // Track if user is actively dragging
  const timerRef = useRef(null);
  const isInitialMount = useRef(true);

  // Initialize game
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const state = JSON.parse(savedState);
      setPlacedCards(state.placedCards || []);
      setCurrentCard(state.currentCard || null);
      setRemainingCards(state.remainingCards || []);
      setScore(state.score || 0);
      setTotalAttempts(state.totalAttempts || 0);
      setElapsedTime(state.elapsedTime || 0);
      setIsComplete(state.isComplete || false);
      
      if (state.isComplete) {
        setShowCompletionModal(false);
      }
    } else {
      // Initialize new game
      initializeNewGame();
    }
  }, []);

  const initializeNewGame = () => {
    const allEvents = [...flashbackData.events];
    // Shuffle all events
    const shuffled = allEvents.sort(() => Math.random() - 0.5);
    
    // Pick first card as starting card (already placed)
    const firstCard = shuffled[0];
    setPlacedCards([firstCard]);
    
    // Pick second card as current card to place
    const secondCard = shuffled[1];
    setCurrentCard(secondCard);
    
    // Remaining cards
    const remaining = shuffled.slice(2);
    setRemainingCards(remaining);
    
    setScore(0);
    setTotalAttempts(0);
    setIsComplete(false);
    setShowCompletionModal(false);
    setElapsedTime(0);
    setIsTimerRunning(true);
    setFeedback(null);
    setTempPlacementIndex(null);
  };

  // Save state
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      placedCards,
      currentCard,
      remainingCards,
      score,
      totalAttempts,
      elapsedTime,
      isComplete
    }));
  }, [placedCards, currentCard, remainingCards, score, totalAttempts, elapsedTime, isComplete]);

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

  const findCorrectPosition = (card, existingCards) => {
    // Find where this card should be placed in the existing timeline
    const cardDate = new Date(card.sortDate);
    
    for (let i = 0; i < existingCards.length; i++) {
      const existingDate = new Date(existingCards[i].sortDate);
      if (cardDate < existingDate) {
        return i; // Should be inserted before this card
      }
    }
    return existingCards.length; // Should be at the end
  };

  const handleDragStart = (e) => {
    if (isComplete || feedback !== null) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'dragging');
    setIsDragging(true);
  };

  const handleDragOver = (e, index) => {
    if (isComplete || feedback !== null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
    setTempPlacementIndex(index);
  };

  const handleDragLeave = (e) => {
    // Only clear if we're leaving the container entirely
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    if (isComplete || feedback !== null) return;
    e.preventDefault();
    setDragOverIndex(null);
    setTempPlacementIndex(dropIndex);
    setIsDragging(false);
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const handleConfirm = () => {
    if (tempPlacementIndex === null || !currentCard) return;

    const correctPosition = findCorrectPosition(currentCard, placedCards);
    const isCorrect = tempPlacementIndex === correctPosition;
    
    setTotalAttempts(prev => prev + 1);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }

    // After a delay, place the card and move to next
    setTimeout(() => {
      // Insert at correct position
      const newPlacedCards = [...placedCards];
      newPlacedCards.splice(correctPosition, 0, currentCard);
      setPlacedCards(newPlacedCards);
      
      // Move to next card
      if (remainingCards.length > 0) {
        setCurrentCard(remainingCards[0]);
        setRemainingCards(remainingCards.slice(1));
        setFeedback(null);
        setTempPlacementIndex(null);
        setDragOverIndex(null);
      } else {
        // Game complete
        setCurrentCard(null);
        setIsComplete(true);
        setShowCompletionModal(true);
        setIsTimerRunning(false);
      }
    }, 2000);
  };

  // Touch events for mobile
  const touchStartPos = useRef(null);

  const handleTouchStart = (e) => {
    if (isComplete || feedback !== null) return;
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (isComplete || feedback !== null) return;
    e.preventDefault(); // Prevent scrolling
    
    const touch = e.touches[0];
    const placedCardsContainer = document.getElementById('placed-cards-container');
    if (!placedCardsContainer) return;
    
    const cards = Array.from(placedCardsContainer.children);
    
    // Find which position we're hovering over
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        setDragOverIndex(i);
        setTempPlacementIndex(i);
        break;
      }
    }
    
    // Check if we're below all cards
    if (cards.length > 0) {
      const lastRect = cards[cards.length - 1].getBoundingClientRect();
      if (touch.clientY > lastRect.bottom) {
        setDragOverIndex(cards.length);
        setTempPlacementIndex(cards.length);
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (isComplete || feedback !== null) return;
    e.preventDefault(); // Prevent scrolling
    touchStartPos.current = null;
    setIsDragging(false);
  };

  const handleNewGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    initializeNewGame();
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
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">You completed the timeline!</p>
              <p className="text-xl font-bold text-nyt-blue mb-2">Score: {score} out of {totalAttempts}</p>
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
          <p style={{fontSize: 'clamp(1rem, 2.5vw, 1.25rem)'}} className="text-gray-600 dark:text-gray-300">Place each event in chronological order</p>
          
          {/* Score and Timer */}
          <div className="mt-4 flex justify-center gap-6">
            <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
              Score: {score}/{totalAttempts}
            </div>
            <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
              {formatTime(elapsedTime)}
            </div>
          </div>
        </header>

        {/* Current Card to Place - Keep visible but semi-transparent when dragging */}
        {currentCard && !isComplete && tempPlacementIndex === null && (
          <div className="mb-6">
            <h3 className="text-center text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Place this event:
            </h3>
            <div 
              draggable={feedback === null}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`
                bg-nyt-blue rounded-lg shadow-lg p-4 sm:p-5
                ${feedback === null ? 'cursor-move' : ''}
                ${isDragging ? 'opacity-50' : 'opacity-100'}
                transition-all duration-200
                touch-none
                relative
              `}
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'none'
              }}
            >
              <h3 className="font-bold text-lg sm:text-xl text-white mb-2">
                {currentCard.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-100">
                {currentCard.description}
              </p>
              {feedback !== null && (
                <div className={`absolute top-2 right-2 text-3xl`}>
                  {feedback === 'correct' ? '✓' : '✗'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirm Button - Top position */}
        {tempPlacementIndex !== null && feedback === null && !isComplete && (
          <div className="flex justify-center mb-4">
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 rounded-full font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors shadow-lg"
            >
              Confirm Placement
            </button>
          </div>
        )}

        {/* Placed Cards Timeline */}
        <div className="mb-6" id="placed-cards-container">
          {placedCards.map((card, index) => (
            <div key={`placed-${card.id}`}>
              {/* Drop zone BEFORE this card - only show when hovering over this specific zone */}
              {dragOverIndex === index && currentCard && (
                <div
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`
                    transition-all duration-200 rounded-lg mb-3
                    min-h-32 border-4 border-dashed border-nyt-blue bg-nyt-blue bg-opacity-10
                    flex items-center justify-center p-4 text-center
                  `}
                >
                  <div className="text-center">
                    <div className="text-gray-600 dark:text-gray-400 text-sm font-semibold">
                      Drop to place before "{card.title}"
                    </div>
                  </div>
                </div>
              )}
              
              {/* Invisible drop zone trigger - always present during drag to detect hover */}
              {isDragging && currentCard && dragOverIndex !== index && tempPlacementIndex !== index && (
                <div
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className="h-8 mb-3"
                  style={{ opacity: 0, pointerEvents: 'auto' }}
                />
              )}
              
              {/* Show current card in this position if placed here temporarily */}
              {tempPlacementIndex === index && currentCard && (
                <div
                  className={`
                    bg-nyt-blue rounded-lg shadow-lg p-4 sm:p-5 mb-3
                    transition-all duration-200
                    relative
                  `}
                >
                  <h3 className="font-bold text-lg sm:text-xl text-white mb-2">
                    {currentCard.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-100">
                    {currentCard.description}
                  </p>
                  {feedback !== null && (
                    <div className={`absolute top-2 right-2 text-3xl text-white`}>
                      {feedback === 'correct' ? '✓' : '✗'}
                    </div>
                  )}
                </div>
              )}
              
              {/* The actual placed card */}
              <div
                className={`
                  bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 mb-3
                  transition-all duration-200
                `}
              >
                <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-2">
                  {card.title}
                </h3>
                <p className="text-sm sm:text-base text-nyt-blue font-semibold mb-2">
                  {card.displayDate}
                </p>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
          
          {/* Drop zone at the END - only show when hovering over end zone */}
          {dragOverIndex === placedCards.length && currentCard && (
            <div
              onDragOver={(e) => handleDragOver(e, placedCards.length)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, placedCards.length)}
              className={`
                transition-all duration-200 rounded-lg
                min-h-32 border-4 border-dashed border-nyt-blue bg-nyt-blue bg-opacity-10
                flex items-center justify-center text-center p-4 mb-3
              `}
            >
              <span className="text-gray-600 dark:text-gray-400 text-sm font-semibold">
                Drop to place at end
              </span>
            </div>
          )}
          
          {/* Invisible drop zone trigger for end - always present during drag */}
          {isDragging && currentCard && dragOverIndex !== placedCards.length && tempPlacementIndex !== placedCards.length && (
            <div
              onDragOver={(e) => handleDragOver(e, placedCards.length)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, placedCards.length)}
              className="h-16 mb-3"
              style={{ opacity: 0, pointerEvents: 'auto' }}
            />
          )}
          
          {/* Show current card at END if placed there temporarily */}
          {tempPlacementIndex === placedCards.length && currentCard && (
            <div
              className={`
                bg-nyt-blue rounded-lg shadow-lg p-4 sm:p-5 mb-3
                transition-all duration-200
                relative
              `}
            >
              <h3 className="font-bold text-lg sm:text-xl text-white mb-2">
                {currentCard.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-100">
                {currentCard.description}
              </p>
              {feedback !== null && (
                <div className={`absolute top-2 right-2 text-3xl text-white`}>
                  {feedback === 'correct' ? '✓' : '✗'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirm Button - Bottom position */}
        {tempPlacementIndex !== null && feedback === null && !isComplete && (
          <div className="flex justify-center mb-6">
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 rounded-full font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors shadow-lg"
            >
              Confirm Placement
            </button>
          </div>
        )}

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
            <li>• You'll see one event card at a time to place in the timeline.</li>
            <li>• Drag the card to where you think it belongs (earlier or later than existing events).</li>
            <li>• Click "Confirm Placement" to check if you're right.</li>
            <li>• Get 1 point for each correct placement. Your score is out of 7 total cards.</li>
            <li>• The card will automatically move to the correct position after you confirm.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default OurTimeline;
