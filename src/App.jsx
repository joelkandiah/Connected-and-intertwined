import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HamburgerMenu from './components/HamburgerMenu';
import ConnectionsGame from './pages/ConnectionsGame';
import WeddingCrossword from './pages/WeddingCrossword';
import './App.css';

function App() {
  return (
    <Router>
      <HamburgerMenu />
      <Routes>
        <Route path="/" element={<ConnectionsGame />} />
        <Route path="/wedding-crossword" element={<WeddingCrossword />} />
      </Routes>
    </Router>
  );
}

export default App;

