import { useState, useEffect, useRef } from 'react';
import FACTS_DATA from '../data/true-false-facts.json';
import HowToPlayModal from '../components/HowToPlayModal';
import CompletionModal from '../components/CompletionModal';

const STORAGE_KEY = 'true-false-wedding-progress';
const SWIPE_THRESHOLD = 100; // pixels to trigger swipe
const HINT_THRESHOLD = 30; // pixels to show hint

function TrueFalseGame() {
    const [facts] = useState(FACTS_DATA.facts);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState([]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [showHowToPlay, setShowHowToPlay] = useState(false);
    const [viewOnlyMode, setViewOnlyMode] = useState(false);

    // Animation and drag states
    const [swipeDirection, setSwipeDirection] = useState(null); // 'left' or 'right'
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const dragOffsetRef = useRef({ x: 0, y: 0 }); // Track offset in ref for reliable access in event handlers
    const cardRef = useRef(null);

    // Check for first time visit
    useEffect(() => {
        const hasSeenHowToPlay = localStorage.getItem('true-false-wedding-how-to-play');
        if (!hasSeenHowToPlay) {
            setShowHowToPlay(true);
            localStorage.setItem('true-false-wedding-how-to-play', 'true');
        }
    }, []);

    // Load saved game state
    useEffect(() => {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                const isGameComplete = state.answered && state.answered.length === facts.length;
                const isGamePlayable = state.currentIndex !== undefined && state.currentIndex < facts.length;

                if (isGameComplete || isGamePlayable) {
                    setCurrentIndex(state.currentIndex || 0);
                    setScore(state.score || 0);
                    setAnswered(state.answered || []);
                    setIsGameOver(state.isGameOver || false);
                    setViewOnlyMode(state.viewOnlyMode || false);

                    if (isGameComplete) {
                        setViewOnlyMode(true);
                        setIsGameOver(true);
                        setShowCompletionModal(false);
                    }
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                }
            } catch (error) {
                console.error('Failed to parse save state:', error);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, [facts.length]);

    // Save game state
    useEffect(() => {
        if (answered.length > 0 || isGameOver) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                currentIndex,
                score,
                answered,
                isGameOver,
                viewOnlyMode
            }));
        }
    }, [currentIndex, score, answered, isGameOver, viewOnlyMode]);

    const handleAnswer = (userAnswer) => {
        if (isGameOver || viewOnlyMode || isDragging) return;

        const currentFact = facts[currentIndex];
        const isCorrect = userAnswer === currentFact.answer;

        if (isCorrect) {
            setScore(score + 1);
        }

        const newAnswered = [...answered, {
            factId: currentFact.id,
            userAnswer,
            correct: isCorrect
        }];

        setAnswered(newAnswered);

        // Trigger swipe animation
        setSwipeDirection(userAnswer ? 'right' : 'left');

        // After animation completes, move to next fact or end game
        setTimeout(() => {
            setSwipeDirection(null);

            if (currentIndex + 1 >= facts.length) {
                setIsGameOver(true);
                setShowCompletionModal(true);
            } else {
                setCurrentIndex(currentIndex + 1);
            }
        }, 500); // Match animation duration
    };

    const handleNewGame = () => {
        localStorage.removeItem(STORAGE_KEY);
        setCurrentIndex(0);
        setScore(0);
        setAnswered([]);
        setIsGameOver(false);
        setShowCompletionModal(false);
        setViewOnlyMode(false);
        setSwipeDirection(null);
    };

    const handleShowResults = () => {
        setShowCompletionModal(false);
        setViewOnlyMode(true);
    };

    // Touch/Mouse drag handlers
    const handleDragStart = (e) => {
        if (isGameOver || viewOnlyMode || swipeDirection) return;

        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        dragStartPos.current = { x: clientX, y: clientY };
        setIsDragging(true);
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;

        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - dragStartPos.current.x;
        const deltaY = clientY - dragStartPos.current.y;

        const newOffset = { x: deltaX, y: deltaY };
        dragOffsetRef.current = newOffset; // Update ref for reliable access in handleDragEnd
        setDragOffset(newOffset);
    };

    const handleDragEnd = () => {
        if (!isDragging) return;

        setIsDragging(false);

        // Use ref value for reliable access in event handlers (state may be stale due to closures)
        const offsetX = dragOffsetRef.current.x;

        // Check if swipe threshold was exceeded
        if (Math.abs(offsetX) >= SWIPE_THRESHOLD) {
            // Trigger answer based on swipe direction
            handleAnswer(offsetX > 0); // right = true, left = false
        }

        // Reset drag offset
        dragOffsetRef.current = { x: 0, y: 0 };
        setDragOffset({ x: 0, y: 0 });
    };

    // Calculate card transform based on drag
    const getCardTransform = () => {
        if (swipeDirection) {
            return ''; // Let animation class handle it
        }
        if (isDragging) {
            const rotation = dragOffset.x / 20; // Subtle rotation during drag
            return `translate(${dragOffset.x}px, ${dragOffset.y * 0.3}px) rotate(${rotation}deg)`;
        }
        return 'translate(0, 0) rotate(0deg)';
    };

    const getCardOpacity = () => {
        if (swipeDirection) return 1;
        if (isDragging) {
            return Math.max(0.5, 1 - Math.abs(dragOffset.x) / 300);
        }
        return 1;
    };

    // Show hint overlay when dragging
    const showHint = isDragging && Math.abs(dragOffset.x) >= HINT_THRESHOLD;
    const hintType = dragOffset.x > 0 ? 'true' : 'false';

    const currentFact = facts[currentIndex];
    const progress = answered.length;
    const total = facts.length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 px-3 sm:px-4">
            {/* Completion Modal */}
            <CompletionModal
                isOpen={showCompletionModal}
                icon={score >= facts.length * 0.7 ? "🎉" : score >= facts.length * 0.5 ? "😊" : "😔"}
                title={score >= facts.length * 0.7 ? "Well Done!" : score >= facts.length * 0.5 ? "Not Bad!" : "Keep Trying!"}
                message={score === facts.length ? "Perfect score!" : `You got ${score} out of ${facts.length} correct!`}
                primaryButtonText="New Game"
                secondaryButtonText="Show Results"
                onPrimaryAction={handleNewGame}
                onSecondaryAction={handleShowResults}
                primaryButtonGradient="from-green-400 to-blue-500"
                stats={[
                    {
                        label: 'Score',
                        value: `${score}/${facts.length}`,
                        gradient: score >= facts.length * 0.7
                            ? 'from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30'
                            : score >= facts.length * 0.5
                                ? 'from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30'
                                : 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'
                    }
                ]}
            />

            <HowToPlayModal
                isOpen={showHowToPlay}
                onClose={() => setShowHowToPlay(false)}
            >
                <ul className="space-y-2">
                    <li>• Read each fact about the couple carefully.</li>
                    <li>• Decide if the statement is TRUE or FALSE.</li>
                    <li>• On desktop: Click the True (green) or False (red) button.</li>
                    <li>• On mobile: Swipe right for TRUE ✓ or left for FALSE ✗.</li>
                    <li>• See how many you can get correct!</li>
                </ul>
            </HowToPlayModal>

            <div className="w-full max-w-[min(96vw,650px)] mx-auto">
                <header className="text-center mb-6 sm:mb-8">
                    <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }} className="font-bold mb-2 text-gray-900 dark:text-gray-100">True or False</h1>
                    <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }} className="text-gray-600 dark:text-gray-300">Wedding Edition</p>
                    <p style={{ fontSize: 'clamp(0.55rem, 2vw, 0.75rem)' }} className="text-gray-500 dark:text-gray-400 mt-2">Guess the facts about the couple!</p>
                </header>

                {/* Progress indicator */}
                {!viewOnlyMode && (
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-3">
                            <span style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }} className="text-gray-600 dark:text-gray-300 font-semibold">
                                Fact {progress + 1} of {total}
                            </span>
                        </div>
                        <div className="w-full max-w-xs mx-auto mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300"
                                style={{ width: `${(progress / total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Card container */}
                {!isGameOver && !viewOnlyMode && currentFact && (
                    <div className="relative mb-8" style={{ minHeight: '400px' }}>
                        <div
                            ref={cardRef}
                            className={`
                absolute inset-0 mx-auto max-w-md
                bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8
                flex items-center justify-center
                cursor-grab active:cursor-grabbing
                transition-all
                ${swipeDirection === 'left' ? 'animate-swipe-left' : ''}
                ${swipeDirection === 'right' ? 'animate-swipe-right' : ''}
                ${isDragging ? 'scale-105 shadow-3xl' : ''}
              `}
                            style={{
                                transform: getCardTransform(),
                                opacity: getCardOpacity(),
                                transition: swipeDirection || !isDragging ? 'transform 0.5s ease-out, opacity 0.5s ease-out' : 'none',
                                touchAction: 'none',
                                userSelect: 'none'
                            }}
                            onMouseDown={handleDragStart}
                            onMouseMove={handleDragMove}
                            onMouseUp={handleDragEnd}
                            onMouseLeave={handleDragEnd}
                            onTouchStart={handleDragStart}
                            onTouchMove={handleDragMove}
                            onTouchEnd={handleDragEnd}
                        >
                            <p
                                style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}
                                className="text-gray-900 dark:text-gray-100 font-semibold text-center leading-relaxed"
                            >
                                {currentFact.statement}
                            </p>

                            {/* Hint overlay */}
                            {showHint && (
                                <div className={`
                  absolute inset-0 rounded-2xl flex items-center justify-center
                  ${hintType === 'true' ? 'bg-green-500/20' : 'bg-red-500/20'}
                  pointer-events-none transition-opacity duration-200
                `}>
                                    <div className={`
                    text-6xl font-bold
                    ${hintType === 'true' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
                  `}>
                                        {hintType === 'true' ? '✓ TRUE' : '✗ FALSE'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Control buttons */}
                {!isGameOver && !viewOnlyMode && (
                    <div className="flex justify-center gap-6 sm:gap-8 mb-6">
                        <button
                            onClick={() => handleAnswer(false)}
                            className="btn-false"
                            disabled={isDragging || swipeDirection !== null}
                            style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
                        >
                            ✗ False
                        </button>
                        <button
                            onClick={() => handleAnswer(true)}
                            className="btn-true"
                            disabled={isDragging || swipeDirection !== null}
                            style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
                        >
                            ✓ True
                        </button>
                    </div>
                )}

                {/* View-only mode: Show results */}
                {viewOnlyMode && (
                    <div className="space-y-4 mb-6">
                        <h2 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)' }} className="font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
                            Your Results: {score}/{facts.length}
                        </h2>
                        {facts.map((fact, idx) => {
                            const userAnswerData = answered.find(a => a.factId === fact.id);
                            const isCorrect = userAnswerData?.correct;

                            return (
                                <div
                                    key={fact.id}
                                    className={`
                    p-4 sm:p-6 rounded-lg
                    ${isCorrect
                                            ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                                            : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500'}
                  `}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`
                      text-2xl flex-shrink-0
                      ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
                    `}>
                                            {isCorrect ? '✓' : '✗'}
                                        </div>
                                        <div className="flex-1">
                                            <p style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }} className="text-gray-900 dark:text-gray-100 mb-2">
                                                {fact.statement}
                                            </p>
                                            <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }} className="text-gray-600 dark:text-gray-400">
                                                Correct answer: <span className="font-semibold">{fact.answer ? 'TRUE' : 'FALSE'}</span>
                                                {userAnswerData && (
                                                    <span className="ml-2">
                                                        • You answered: <span className="font-semibold">{userAnswerData.userAnswer ? 'TRUE' : 'FALSE'}</span>
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="flex justify-center gap-6 sm:gap-8 mt-8">
                            <button
                                onClick={handleNewGame}
                                className="btn-primary bg-gradient-to-r from-green-400 to-blue-500"
                                style={{ fontSize: 'clamp(0.8rem, 2vw, 0.875rem)' }}
                            >
                                New Game
                            </button>
                            <button
                                onClick={() => setShowCompletionModal(true)}
                                className="btn-secondary"
                                style={{ fontSize: 'clamp(0.8rem, 2vw, 0.875rem)' }}
                            >
                                Show Score
                            </button>
                        </div>
                    </div>
                )}

                {/* How to Play section */}
                <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <h2 style={{ fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)' }} className="font-bold mb-3 text-gray-900 dark:text-gray-100">How to Play</h2>
                    <ul style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }} className="space-y-2 text-gray-700 dark:text-gray-300">
                        <li>• Read each fact about the couple carefully.</li>
                        <li>• Decide if the statement is TRUE or FALSE.</li>
                        <li>• On desktop: Click the True (green) or False (red) button.</li>
                        <li>• On mobile: Swipe right for TRUE ✓ or left for FALSE ✗.</li>
                        <li>• See how many you can get correct!</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default TrueFalseGame;
