import React from 'react';

const HowToPlayModal = ({ isOpen, onClose, title = "How to Play", children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4" style={{ zIndex: 40 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 sm:p-8 max-w-md w-full relative animate-fade-in-up">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h2>
                    <div className="text-left text-gray-700 dark:text-gray-300 mb-6">
                        {children}
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 rounded-full font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
                    >
                        Let's Play!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HowToPlayModal;
