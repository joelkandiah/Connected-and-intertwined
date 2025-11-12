import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HamburgerMenu from './components/HamburgerMenu';
import LandingPage from './pages/LandingPage';
import ConnectionsGame from './pages/ConnectionsGame';
import WeddingCrossword from './pages/WeddingCrossword';
import WeddingStrands from './pages/WeddingStrands';
import './App.css';

function App() {
  return (
    <Router>
      <HamburgerMenu />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/connections" element={<ConnectionsGame />} />
        <Route path="/wedding-crossword" element={<WeddingCrossword />} />
        <Route path="/wedding-strands" element={<WeddingStrands />} />
      </Routes>
    </Router>
  );
}

export default App;

