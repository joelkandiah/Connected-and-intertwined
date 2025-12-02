import React from 'react';

const CompletionModal = ({
    isOpen,
    title = "Congratulations!",
    icon = "🎉",
    message,
    stats,
    children,
    primaryButtonText = "New Game",
    secondaryButtonText = "Show Puzzle",
    onPrimaryAction,
    onSecondaryAction,
    primaryButtonGradient = "from-yellow-400 to-blue-500"
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4" style={{ zIndex: 30 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 sm:p-8 max-w-md w-full animate-fade">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">{icon}</div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h2>
                    {message && (
                        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">{message}</p>
                    )}

                    {stats && stats.length > 0 && (
                        <div className={`grid ${stats.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-6`}>
                            {stats.map((stat, index) => (
                                <div
                                    key={index}
                                    className={`bg-gradient-to-r ${stat.gradient || 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'} rounded-lg p-4`}
                                >
                                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">{stat.label}</div>
                                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                                        {stat.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {children && (
                        <div className="mb-6">
                            {children}
                        </div>
                    )}

                    <div className="flex gap-3 sm:gap-4 justify-center">
                        <button
                            onClick={onPrimaryAction}
                            className={`px-5 sm:px-6 py-2.5 bg-gradient-to-r ${primaryButtonGradient} text-white rounded-full font-semibold hover:brightness-110 transition-all transform hover:scale-105 shadow-md`}
                            style={{ fontSize: 'clamp(0.8rem, 2vw, 0.875rem)' }}
                        >
                            {primaryButtonText}
                        </button>
                        {onSecondaryAction && (
                            <button
                                onClick={onSecondaryAction}
                                className="px-5 sm:px-6 py-2.5 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-full font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                style={{ fontSize: 'clamp(0.8rem, 2vw, 0.875rem)' }}
                            >
                                {secondaryButtonText}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompletionModal;
