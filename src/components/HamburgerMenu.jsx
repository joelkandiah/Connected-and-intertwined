import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Menu"
        aria-expanded={isOpen}
      >
        <div className="w-6 h-6 flex flex-col justify-between">
          <span className={`block h-0.5 bg-gray-900 transition-all ${isOpen ? 'rotate-45 translate-y-3' : ''}`}></span>
          <span className={`block h-0.5 bg-gray-900 transition-all ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block h-0.5 bg-gray-900 transition-all ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </div>
      </button>

      {/* Menu overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
          onClick={closeMenu}
        />
      )}

      {/* Menu panel */}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <nav className="pt-20 px-6">
          <ul className="space-y-4">
            <li>
              <Link
                to="/"
                onClick={closeMenu}
                className="block py-3 px-4 text-lg font-semibold text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/connections"
                onClick={closeMenu}
                className="block py-3 px-4 text-lg font-semibold text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Connections
              </Link>
            </li>
            <li>
              <Link
                to="/wedding-crossword"
                onClick={closeMenu}
                className="block py-3 px-4 text-lg font-semibold text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
               The Mini 
              </Link>
            </li>
            <li>
              <Link
                to="/wedding-strands"
                onClick={closeMenu}
                className="block py-3 px-4 text-lg font-semibold text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Strands
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default HamburgerMenu;
