import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HamburgerMenu from './components/HamburgerMenu';
import Loading from './components/Loading';
import GameSkeleton from './components/GameSkeleton';
import './App.css';
import './index.css';
// App component with route-specific Suspense boundaries

// Lazy load page components for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ConnectionsGame = lazy(() => import('./pages/ConnectionsGame'));
const WeddingCrossword = lazy(() => import('./pages/WeddingCrossword'));
const WeddingStrands = lazy(() => import('./pages/WeddingStrands'));
const OurTimeline = lazy(() => import('./pages/OurTimeline'));
const TrueFalseGame = lazy(() => import('./pages/TrueFalseGame'));


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
      <Router basename="/">
        <HamburgerMenu darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <Routes>
          <Route path="/" element={
            <Suspense fallback={<Loading />}>
              <LandingPage />
            </Suspense>
          } />
          <Route path="/connections" element={
            <Suspense fallback={<GameSkeleton type="grid" />}>
              <ConnectionsGame />
            </Suspense>
          } />
          <Route path="/wedding-crossword" element={
            <Suspense fallback={<GameSkeleton type="crossword" />}>
              <WeddingCrossword />
            </Suspense>
          } />
          <Route path="/wedding-strands" element={
            <Suspense fallback={<GameSkeleton type="grid" />}>
              <WeddingStrands />
            </Suspense>
          } />
          <Route path="/our-timeline" element={
            <Suspense fallback={<GameSkeleton type="timeline" />}>
              <OurTimeline />
            </Suspense>
          } />
          <Route path="/true-false" element={
            <Suspense fallback={<GameSkeleton type="card" />}>
              <TrueFalseGame />
            </Suspense>
          } />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

