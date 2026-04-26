'use client';

import React, { useState } from 'react';

export interface TooltipProps {
  text: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <span
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[10px] leading-none text-gray-400 border border-gray-300 cursor-help hover:text-gray-600 hover:border-gray-500 transition-colors select-none"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        tabIndex={0}
        role="button"
        aria-label={text}
      >
        ⓘ
      </span>
      {visible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2">
          <div className="px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-normal max-w-xs leading-relaxed">
            {text}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </span>
  );
};
