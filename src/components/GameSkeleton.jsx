import React from 'react';
// GameSkeleton component for preventing layout shifts during loading

const GameSkeleton = ({ type = 'default' }) => {
    return (
        <div
            className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8 px-3 sm:px-4"
        >
            <div className="w-full max-w-[min(96vw,650px)] mx-auto">
                {/* Header skeleton */}
                <header className="text-center mb-6 sm:mb-8">
                    <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg mb-2 w-64 mx-auto animate-pulse"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg mb-2 w-48 mx-auto animate-pulse" style={{ animationDelay: '100ms' }}></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-40 mx-auto animate-pulse" style={{ animationDelay: '200ms' }}></div>
                </header>

                {type === 'grid' && (
                    <>
                        {/* Grid skeleton (Connections/Strands) */}
                        <div className="grid grid-cols-4 gap-2 mb-6">
                            {[...Array(16)].map((_, i) => (
                                <div
                                    key={i}
                                    className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
                                    style={{ animationDelay: `${i * 50}ms` }}
                                ></div>
                            ))}
                        </div>
                        {/* Controls skeleton */}
                        <div className="flex justify-center gap-6 mb-6">
                            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" style={{ animationDelay: '100ms' }}></div>
                            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" style={{ animationDelay: '200ms' }}></div>
                        </div>
                    </>
                )}

                {type === 'crossword' && (
                    <>
                        {/* Crossword grid skeleton */}
                        <div className="w-full flex justify-center mb-6">
                            <div
                                className="aspect-square w-full max-w-md bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
                            ></div>
                        </div>
                        {/* Controls skeleton */}
                        <div className="flex justify-center gap-6 mb-6">
                            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" style={{ animationDelay: '100ms' }}></div>
                        </div>
                    </>
                )}

                {type === 'timeline' && (
                    <>
                        {/* Timeline cards skeleton */}
                        <div className="space-y-4 mb-6">
                            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" style={{ animationDelay: '150ms' }}></div>
                            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </>
                )}

                {type === 'card' && (
                    <>
                        {/* Card game skeleton (True/False) */}
                        <div className="mb-8">
                            <div
                                className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl mx-auto max-w-md animate-pulse"
                            ></div>
                        </div>
                        {/* Buttons skeleton */}
                        <div className="flex justify-center gap-6">
                            <div className="h-12 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
                            <div className="h-12 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" style={{ animationDelay: '100ms' }}></div>
                        </div>
                    </>
                )}

                {/* How to play section skeleton */}
                <div className="mt-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3 animate-pulse"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" style={{ animationDelay: '100ms' }}></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5 animate-pulse" style={{ animationDelay: '200ms' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameSkeleton;
