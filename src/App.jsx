import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HamburgerMenu from './components/HamburgerMenu';
import LandingPage from './pages/LandingPage';
import ConnectionsGame from './pages/ConnectionsGame';
import WeddingCrossword from './pages/WeddingCrossword';
import WeddingStrands from './pages/WeddingStrands';
import './App.css';
import './index.css';

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
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/connections" element={<ConnectionsGame />} />
          <Route path="/wedding-crossword" element={<WeddingCrossword />} />
          <Route path="/wedding-strands" element={<WeddingStrands />} />
        </Routes>
      </Router>
      <div className="bg-red-500 dark:bg-blue-500 p-4 text-white">
  Test: Should be RED in light mode, BLUE in dark mode
</div>
    </div>
  );
}

export default App;

