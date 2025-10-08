/**
 * Sticky Top Navigation Component
 * Component thanh điều hướng dính ở trên đầu trang
 */

import React from 'react';

interface StickyTopNavProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const StickyTopNav: React.FC<StickyTopNavProps> = ({ 
  title, 
  subtitle, 
  children 
}) => {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <span className="ml-3 text-sm text-gray-500">{subtitle}</span>
          )}
        </div>
        {children && (
          <div className="flex items-center space-x-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default StickyTopNav;
