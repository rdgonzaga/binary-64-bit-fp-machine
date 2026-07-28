import React from 'react';
import { AppTab } from '../types';

interface HeaderNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="pt-8 pb-4 px-4 max-w-6xl mx-auto text-center">
      {/* Top 3 Navigation Pills */}
      <div className="inline-flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-6">
        <button
          id="nav-btn-rounding"
          onClick={() => setActiveTab('rounding')}
          className={`px-8 py-2.5 rounded-full font-mono text-sm tracking-wider font-semibold border border-zinc-900 transition-all cursor-pointer shadow-xs ${
            activeTab === 'rounding'
              ? 'bg-[#F5B83D] text-[#695C53] scale-105 shadow-md'
              : 'bg-[#F5B83D]/60 hover:bg-[#F5B83D] text-[#695C53]'
          }`}
        >
          rounding
        </button>

        <button
          id="nav-btn-conversion"
          onClick={() => setActiveTab('conversion')}
          className={`px-8 py-2.5 rounded-full font-mono text-sm tracking-wider font-semibold border border-zinc-900 transition-all cursor-pointer shadow-xs ${
            activeTab === 'conversion'
              ? 'bg-[#8EBD6D] text-[#695C53] scale-105 shadow-md'
              : 'bg-[#8EBD6D]/60 hover:bg-[#8EBD6D] text-[#695C53]'
          }`}
        >
          conversion
        </button>

        <button
          id="nav-btn-arithmetic"
          onClick={() => setActiveTab('arithmetic')}
          className={`px-8 py-2.5 rounded-full font-mono text-sm tracking-wider font-semibold border border-zinc-900 transition-all cursor-pointer shadow-xs ${
            activeTab === 'arithmetic'
              ? 'bg-[#A6D5EC] text-[#695C53] scale-105 shadow-md'
              : 'bg-[#A6D5EC]/60 hover:bg-[#A6D5EC] text-[#695C53]'
          }`}
        >
          arithmetic
        </button>
      </div>

      {/* Dynamic Subtitle Description based on active tab */}
      {activeTab !== 'welcome' && (
        <p className="max-w-3xl mx-auto text-xs sm:text-sm font-mono text-[#695C53] leading-relaxed px-4 transition-all">
          {activeTab === 'conversion' &&
            'Convert decimal numbers into 64-bit IEEE 754 double-precision format with bit-level field breakdowns. Generates spaced binary and hexadecimal outputs and supports special cases.'}
          {activeTab === 'rounding' &&
            'Demonstrate precision truncation on decimal or binary inputs using custom target limits. Compare Chopping, Round-Up, Round-Down, and Round-to-Nearest (Ties-to-Even) side-by-side.'}
          {activeTab === 'arithmetic' &&
            'Input two operands in decimal or hex to run step-by-step addition or multiplication. Visualizes bit alignment, GRS logic, and normalization with final binary, hex, and decimal results.'}
        </p>
      )}
    </header>
  );
};
