import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [emojis, setEmojis] = useState([]);

  // Wedding emoji that will fall
  const weddingEmojis = useMemo(() => ['💒', '💍', '💐', '❤️', '💑', '🎉', '🥂', '💕'], []);

  useEffect(() => {
    // Create initial emoji
    const initialEmojis = [];
    for (let i = 0; i < 15; i++) {
      initialEmojis.push({
        id: Date.now() + i,
        emoji: weddingEmojis[Math.floor(Math.random() * weddingEmojis.length)],
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4
      });
    }
    setEmojis(initialEmojis);

    // Add new emoji periodically
    const interval = setInterval(() => {
      setEmojis(prev => {
        // Keep only the last 20 emoji
        const filtered = prev.slice(-19);
        return [
          ...filtered,
          {
            id: Date.now(),
            emoji: weddingEmojis[Math.floor(Math.random() * weddingEmojis.length)],
            left: Math.random() * 100,
            delay: 0,
            duration: 3 + Math.random() * 4
          }
        ];
      });
    }, 800);

    return () => clearInterval(interval);
  }, [weddingEmojis]);

  const puzzles = useMemo(() => [
    { name: 'Connections', path: '/connections', description: 'Find groups of four!' },
    { name: 'The Mini', path: '/wedding-crossword', description: 'Wedding crossword puzzle' },
    { name: 'Wedding Strands', path: '/wedding-strands', description: 'Find the hidden words' },
    { name: 'Our Timeline', path: '/our-timeline', description: 'Arrange events in order' },
    { name: 'True or False', path: '/true-false', description: 'Test your knowledge!' }
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 relative overflow-hidden">
      {/* Falling emoji animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        {emojis.map((item) => (
          <div
            key={item.id}
            className="absolute text-4xl animate-fall"
            style={{
              left: `${item.left}%`,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`,
              top: '-60px'
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 style={{fontSize: 'clamp(2rem, 5vw, 3rem)', paddingTop: '60px'}} className="font-bold mb-2 animate-fadeIn text-gray-900 dark:text-gray-100">
                Welcome to our wedding! 💕
          </h1>
          <p className="text-2xl md:text-3xl text-gray-600 dark:text-gray-300 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            Sofia and Joel invite you to try some of our favourite puzzles with a wedding day twist!
          </p>
        </div>

        {/* Puzzle buttons */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-3 sm:scale-90 mt-16 sm:mt-8">
          {puzzles.map((puzzle, index) => (
            <Link
              key={puzzle.path}
              to={puzzle.path}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 
                         p-6 sm:p-4 text-center transform hover:-translate-y-2 animate-fadeIn"
              style={{ animationDelay: `${0.5 + index * 0.2}s` }}
            >
              <h2 className="text-2xl sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                {puzzle.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-base sm:text-sm">{puzzle.description}</p>
              <div className="mt-4 text-pink-500 dark:text-pink-400 group-hover:translate-x-2 transition-transform inline-block">
                →
              </div>
            </Link>
            
          ))}
        </div>

        {/* Decorative hearts at bottom */}
        <div className="text-center mt-16 text-6xl animate-fadeIn" style={{ animationDelay: '1.1s' }}>
          ❤️ 💍 ❤️
        </div>
      </div>

      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fall {
          animation: fall linear infinite;
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
