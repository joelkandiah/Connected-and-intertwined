import { useState, useEffect, useRef } from 'react';
import flashbackData from '../data/flashback.json';
import HowToPlayModal from '../components/HowToPlayModal';

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
  const [isDragging, setIsDragging] = useState(false); // Track if user is actively dragging (mouse or touch)
  const [isTouchDragging, setIsTouchDragging] = useState(false); // Track specifically touch dragging for floating card
  const timerRef = useRef(null);
  const isInitialMount = useRef(true);
  const autoScrollRaf = useRef(null);
  const currentTouchY = useRef(null);
  const currentTouchX = useRef(null);
  const wrapperRef = useRef(null);
  const handlePointerDownRef = useRef(null);
  const lastCheckTime = useRef(0);
  const cleanupDragRef = useRef(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Check for first time visit
  useEffect(() => {
    const hasSeenHowToPlay = localStorage.getItem('our-timeline-wedding-how-to-play');
    if (!hasSeenHowToPlay) {
      setShowHowToPlay(true);
      localStorage.setItem('our-timeline-wedding-how-to-play', 'true');
    }
  }, []);

  // Keep the latest handlePointerDown in a ref so we don't need to re-bind listeners
  useEffect(() => {
    handlePointerDownRef.current = handlePointerDown;
  });

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

  // Fix passive event listener issue for touch events
  // Fix passive event listener issue for touch events - Event Delegation Optimization
  useEffect(() => {
    const handlePointerDownDelegated = (e) => {
      if (handlePointerDownRef.current) {
        handlePointerDownRef.current(e);
      }
    };

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Attach single listener to wrapper
    wrapper.addEventListener('pointerdown', handlePointerDownDelegated);

    return () => {
      wrapper.removeEventListener('pointerdown', handlePointerDownDelegated);
    };
  }, []); // Run once on mount

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
  const draggedCardRef = useRef(null);
  const floatingCardRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const checkDragPosition = (x, y) => {
    const placedCardsContainer = document.getElementById('placed-cards-container');
    if (!placedCardsContainer) return;

    const containerRect = placedCardsContainer.getBoundingClientRect();

    // If we are significantly above the container, treat it as "returning to stack" (cancel)
    // This gives a natural "pull out to cancel" feel
    if (y < containerRect.top - 20) {
      setDragOverIndex(null);
      setTempPlacementIndex(null);
      return;
    }

    // If we are in or below the container area, we default to placing it in the timeline
    // This ensures the card doesn't "disappear" if dragged to the side or bottom

    // Use specific class to avoid counting the temporary drop zones or ghost card as items
    const cardElements = Array.from(placedCardsContainer.querySelectorAll('.placed-card-wrapper'));

    // Find which position we're hovering over
    let foundPosition = false;
    for (let i = 0; i < cardElements.length; i++) {
      const rect = cardElements[i].getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;

      // Only check Y threshold for insertion points
      if (y < midpoint) {
        setDragOverIndex(i);
        setTempPlacementIndex(i);
        foundPosition = true;
        break;
      }
    }

    // If not found above any card (e.g. at the bottom or side), place at the end
    if (!foundPosition) {
      setDragOverIndex(cardElements.length);
      setTempPlacementIndex(cardElements.length);
    }
  };

  const performAutoScroll = () => {
    if (!isDraggingRef.current || currentTouchY.current === null) return;

    const y = currentTouchY.current;
    const x = currentTouchX.current;
    const viewportHeight = window.innerHeight;
    const scrollThreshold = 100;
    const scrollSpeed = 15; // Increased speed slightly

    let scrolled = false;

    if (y < scrollThreshold) {
      // Near top - scroll up
      const intensity = Math.max(0.1, (scrollThreshold - y) / scrollThreshold);
      window.scrollBy(0, -scrollSpeed * intensity);
      scrolled = true;
    } else if (y > viewportHeight - scrollThreshold) {
      // Near bottom - scroll down
      const intensity = Math.max(0.1, (y - (viewportHeight - scrollThreshold)) / scrollThreshold);
      window.scrollBy(0, scrollSpeed * intensity);
      scrolled = true;
    }

    if (scrolled && x !== null) {
      checkDragPosition(x, y);
    }

    autoScrollRaf.current = requestAnimationFrame(performAutoScroll);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault(); // Prevent scrolling

    currentTouchY.current = e.clientY;
    currentTouchX.current = e.clientX;

    // Update floating card position
    if (floatingCardRef.current) {
      // Follow finger with relative offset
      floatingCardRef.current.style.left = `${e.clientX - dragOffset.current.x}px`;
      floatingCardRef.current.style.top = `${e.clientY - dragOffset.current.y}px`;
    }

    // Throttle the expensive checkDragPosition (Read DOM)
    const now = Date.now();
    if (now - lastCheckTime.current > 50) { // Run max once every 50ms
      checkDragPosition(e.clientX, e.clientY);
      lastCheckTime.current = now;
    }
  };

  const handlePointerUp = (e) => {
    if (cleanupDragRef.current) {
      cleanupDragRef.current();
    }
  };

  const handlePointerDown = (e) => {
    if (isComplete || feedback !== null) return;

    // Safety cleanup if previous drag didn't finish properly
    if (cleanupDragRef.current) {
      cleanupDragRef.current();
    }

    // Only start drag if touching a draggable element
    // Handle text nodes which don't have closest method
    const targetElement = e.target.nodeType === 3 ? e.target.parentNode : e.target;
    const target = targetElement.closest('[draggable="true"]');
    if (!target) return;

    e.preventDefault(); // Prevent default to disable native scrolling

    // Capture pointer events to wrapper to track outside window/iframe
    if (wrapperRef.current) {
      wrapperRef.current.setPointerCapture(e.pointerId);
    }

    touchStartPos.current = { x: e.clientX, y: e.clientY };
    currentTouchY.current = e.clientY;
    currentTouchX.current = e.clientX;
    isDraggingRef.current = true;
    setIsDragging(true);
    setIsTouchDragging(true);

    draggedCardRef.current = target;

    // Calculate offset so card doesn't jump to finger position
    const rect = target.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    // Initialize floating card position
    if (floatingCardRef.current) {
      floatingCardRef.current.style.display = 'block'; // Force immediate display
      floatingCardRef.current.style.width = `${rect.width}px`; // Match width
      floatingCardRef.current.style.left = `${rect.left}px`;
      floatingCardRef.current.style.top = `${rect.top}px`;
    }

    // Start auto-scroll loop
    if (autoScrollRaf.current) cancelAnimationFrame(autoScrollRaf.current);
    performAutoScroll();

    // Attach listeners to wrapper (since we have capture)
    const wrapper = wrapperRef.current;
    wrapper.addEventListener('pointermove', handlePointerMove);
    wrapper.addEventListener('pointerup', handlePointerUp);
    wrapper.addEventListener('pointercancel', handlePointerUp);
    wrapper.addEventListener('lostpointercapture', handlePointerUp);

    // Initial position check
    checkDragPosition(e.clientX, e.clientY);

    // Store cleanup function
    cleanupDragRef.current = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      setIsTouchDragging(false);
      currentTouchY.current = null;
      currentTouchX.current = null;

      if (autoScrollRaf.current) {
        cancelAnimationFrame(autoScrollRaf.current);
        autoScrollRaf.current = null;
      }

      if (floatingCardRef.current) {
        floatingCardRef.current.style.display = 'none';
      }

      if (wrapperRef.current) {
        wrapperRef.current.removeEventListener('pointermove', handlePointerMove);
        wrapperRef.current.removeEventListener('pointerup', handlePointerUp);
        wrapperRef.current.removeEventListener('pointercancel', handlePointerUp);
        wrapperRef.current.removeEventListener('lostpointercapture', handlePointerUp);
        // Note: releasePointerCapture is automatic on up/cancel
      }

      cleanupDragRef.current = null;
    };
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupDragRef.current) {
        cleanupDragRef.current();
      }
    };
  }, []);

  // We don't need handlePointerMove and handlePointerUp here anymore as they are attached to wrapper
  // But we need to keep handlePointerDown attached to elements via the useEffect below

  const handleNewGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    initializeNewGame();
  };

  const handleShowPuzzle = () => {
    setShowCompletionModal(false);
  };

  // Helper function to render draggable current card at a given position
  const renderDraggableCard = (position) => (
    tempPlacementIndex === position && currentCard && (
      <div
        draggable={feedback === null}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`
          bg-timeline-blue dark:bg-timeline-light-blue-alt rounded-lg shadow-lg p-4 sm:p-5 mb-3
          ${feedback === null ? 'cursor-move' : ''}
          ${isDragging ? 'opacity-50' : 'opacity-100'}
          transition-all duration-200
          relative
          touch-none
        `}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
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
    )
  );

  // Helper function to render invisible drop zone
  const renderDropZone = (position, height = 'h-8') => (
    isDragging && currentCard && dragOverIndex !== position && tempPlacementIndex !== position && (
      <div
        onDragOver={(e) => handleDragOver(e, position)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, position)}
        className={`${height} mb-3`}
        style={{ opacity: 0, pointerEvents: 'auto' }}
      />
    )
  );

  return (
    <div ref={wrapperRef} className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 px-3 sm:px-4">
      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4" style={{ zIndex: 30 }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 sm:p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Congratulations!</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">You completed the timeline!</p>
              <p className="text-xl font-bold text-timeline-blue dark:text-timeline-light-blue mb-2">Score: {score} out of {totalAttempts}</p>
              <p className="text-base text-gray-600 dark:text-gray-400 mb-6">Time: {formatTime(elapsedTime)}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleNewGame}
                  className="px-6 py-3 bg-gradient-to-r from-timeline-light-blue to-green-500 text-white rounded-full font-semibold hover:from-timeline-blue hover:to-green-600 transition-colors"
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

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      >
        <ul className="space-y-2">
          <li>• You'll see one event card at a time to place in the timeline of our relationship.</li>
          <li>• Drag the card to where you think it belongs (earlier or later than existing events).</li>
          <li>• Click "Confirm Placement" to check if you're right.</li>
          <li>• Get 1 point for placing each correctly.</li>
        </ul>
      </HowToPlayModal>

      <div className="w-full max-w-[min(96vw,650px)] mx-auto">
        <header className="text-center mb-6 sm:mb-8">
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }} className="font-bold mb-2 text-gray-900 dark:text-gray-100">Our Timeline</h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }} className="text-gray-600 dark:text-gray-300">Place each event in chronological order</p>

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
        {currentCard && !isComplete && (
          <div
            className={`mb-6 ${tempPlacementIndex !== null ? 'invisible absolute pointer-events-none opacity-0' : ''}`}
            style={tempPlacementIndex !== null ? { height: 0, overflow: 'hidden', margin: 0 } : {}}
          >
            <h3 className="text-center text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Place this event:
            </h3>
            <div
              draggable={feedback === null}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              className={`
                bg-timeline-blue dark:bg-timeline-light-blue-alt rounded-lg shadow-lg p-4 sm:p-5
                ${feedback === null ? 'cursor-move' : ''}
                ${isDragging ? 'opacity-50' : 'opacity-100'}
                transition-all duration-200
                relative
                touch-none
              `}
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none'
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

        {/* Floating card that follows finger during touch drag */}
        {currentCard && (
          <div
            ref={floatingCardRef}
            className="fixed pointer-events-none z-50"
            style={{
              display: isTouchDragging ? 'block' : 'none',
              // Width and position set via JS
            }}
          >
            <div className="bg-timeline-blue dark:bg-timeline-light-blue-alt rounded-lg shadow-2xl p-4 sm:p-5 opacity-90">
              <h3 className="font-bold text-lg sm:text-xl text-white mb-2">
                {currentCard.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-100">
                {currentCard.description}
              </p>
            </div>
          </div>
        )}

        {/* Confirm Button - Top position with Cancel option */}
        {tempPlacementIndex !== null && feedback === null && !isComplete && (
          <div className="flex justify-center gap-3 mb-4">
            <button
              onClick={() => {
                setTempPlacementIndex(null);
                setDragOverIndex(null);
                setIsDragging(false);
              }}
              className="px-6 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-full font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
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
            <div key={`placed-${card.id}`} className="placed-card-wrapper">
              {/* Invisible drop zone trigger - always present during drag to detect hover */}
              {renderDropZone(index)}

              {/* Show current card in this position if placed here temporarily - Make it draggable to reposition */}
              {renderDraggableCard(index)}

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
                <p className="text-sm sm:text-base text-timeline-blue dark:text-timeline-light-blue font-semibold mb-2">
                  {card.displayDate}
                </p>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  {card.description}
                </p>
              </div>
            </div>
          ))}

          {/* End position - drop zone and draggable card use same logic as other positions */}
          {renderDropZone(placedCards.length, 'h-16')}
          {renderDraggableCard(placedCards.length)}
        </div>

        {/* Confirm Button - Bottom position with Cancel option */}
        {tempPlacementIndex !== null && feedback === null && !isComplete && (
          <div className="flex justify-center gap-3 mb-6">
            <button
              onClick={() => {
                setTempPlacementIndex(null);
                setDragOverIndex(null);
                setIsDragging(false);
              }}
              className="px-6 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-full font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
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
              className="px-6 py-3 bg-gradient-to-r from-timeline-light-blue to-green-500 text-white rounded-full font-semibold hover:from-timeline-blue hover:to-green-600 transition-colors"
              style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            >
              New Game
            </button>
          </div>
        )}

        {/* How to Play */}
        <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <h2 style={{ fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)' }} className="font-bold mb-3 text-gray-900 dark:text-gray-100">How to Play</h2>
          <ul style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }} className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>• You'll see one event card at a time to place in the timeline of our relationship.</li>
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
