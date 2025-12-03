import React from 'react';

const Loading = ({ message = "Loading..." }) => {
    return (
        <div className="flex items-center justify-center min-h-[50vh] w-full">
            <div className="text-center">
                <div className="animate-bounce text-4xl mb-4">💕</div>
                <div className="text-xl font-medium text-gray-600 dark:text-gray-300 animate-pulse">
                    {message}
                </div>
            </div>
        </div>
    );
};

export default Loading;
