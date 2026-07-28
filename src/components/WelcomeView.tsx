import React from 'react';
import { AppTab } from '../types';

interface WelcomeViewProps {
  onStart: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onStart }) => {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 py-6">
      <div className="bg-white border border-zinc-900 rounded-[36px] shadow-sm p-8 sm:p-16 text-center max-w-4xl w-full mx-auto my-4 transition-all">
        {/* Welcome Header */}
        <h1 className="text-5xl sm:text-6xl font-mono tracking-[0.25em] text-[#695C53] font-normal mb-8 uppercase">
          WELCOME
        </h1>

        {/* Sub-header */}
        <h2 className="text-2xl sm:text-4xl font-mono text-[#695C53] font-semibold mb-6 leading-snug">
          Binary 64-bit Floating-Point Machine
        </h2>

        {/* Description Body */}
        <p className="max-w-2xl mx-auto text-xs sm:text-sm font-mono text-[#695C53] leading-relaxed mb-12">
          Explore the mechanics of IEEE 754 double-precision arithmetic—from
          exact bit-level conversion and custom precision rounding to step-by-step
          arithmetic with Guard, Round, and Sticky (GRS) bits.
        </p>

        {/* Start Button */}
        <button
          id="btn-welcome-start"
          onClick={onStart}
          className="bg-[#8EBD6D] hover:bg-[#7EB25B] text-[#695C53] font-mono text-base font-semibold px-16 py-3.5 rounded-full border border-zinc-900 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          Start
        </button>
      </div>
    </div>
  );
};
