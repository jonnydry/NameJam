import React from 'react';
import { Loader2 } from 'lucide-react';

export const FullPageLoader = ({ message = "Loading..." }: { message?: string }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm z-50">
    <div className="text-center space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto" />
      <p className="text-gray-200 font-medium">{message}</p>
    </div>
  </div>
);

export const InlineLoader = ({ size = 'default', message }: { size?: 'small' | 'default' | 'large', message?: string }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  return (
    <div className="inline-flex items-center gap-2">
      <Loader2 className={`animate-spin text-purple-500 ${sizeClasses[size]}`} />
      {message && <span className="text-gray-400 text-sm">{message}</span>}
    </div>
  );
};

export const CardSkeleton = () => (
  <div className="bg-gray-800/50 rounded-lg p-6 animate-pulse">
    <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
    <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
  </div>
);

export const ButtonLoader = ({ children, isLoading }: { children: React.ReactNode, isLoading: boolean }) => (
  <>
    {isLoading ? (
      <Loader2 className="w-4 h-4 animate-spin" />
    ) : children}
  </>
);