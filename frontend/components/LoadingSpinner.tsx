import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  small: 'w-8 h-8 border-2',
  medium: 'w-12 h-12 border-3',
  large: 'w-16 h-16 border-4',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  fullScreen = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${sizeClasses[size]} border-gray-300 border-t-[#EF4F5F] rounded-full animate-spin`}
      />
      {message && (
        <p className="text-gray-600 text-center">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
};

// Skeleton Loading Component for list items
interface SkeletonProps {
  count?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({ count = 3, className = 'h-24' }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${className} bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse`}
        />
      ))}
    </div>
  );
};

// Loading overlay for modals/sections
interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Loading...',
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg z-40">
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <LoadingSpinner size="medium" message={message} />
      </div>
    </div>
  );
};
