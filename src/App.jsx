import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HamburgerMenu from './components/HamburgerMenu';
import './App.css';
import './index.css';

// Lazy load page components for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ConnectionsGame = lazy(() => import('./pages/ConnectionsGame'));
const WeddingCrossword = lazy(() => import('./pages/WeddingCrossword'));
const WeddingStrands = lazy(() => import('./pages/WeddingStrands'));

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    // Otherwise, use system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Apply or remove dark class on document element
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-950 min-h-screen">
      <Router basename="/Connected-and-intertwined">
        <HamburgerMenu darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="text-4xl mb-4">💕</div>
              <div className="text-xl text-gray-600 dark:text-gray-300">Loading...</div>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/connections" element={<ConnectionsGame />} />
            <Route path="/wedding-crossword" element={<WeddingCrossword />} />
            <Route path="/wedding-strands" element={<WeddingStrands />} />
          </Routes>
        </Suspense>
      </Router>
    </div>
  );
}

export default App;

