import React from 'react';
import { AppTab } from '../types';
import { Binary, Ruler, Sigma } from 'lucide-react';

interface WelcomeViewProps {
  onNavigate: (tab: AppTab) => void;
}

const MODULES: {
  tab: AppTab;
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
}[] = [
  {
    tab: 'conversion',
    title: 'Conversion',
    description: 'Decimal to IEEE 754 binary and hex, with a full sign/exponent/mantissa breakdown.',
    icon: <Binary className="w-6 h-6" />,
    accent: '#8EBD6D',
  },
  {
    tab: 'rounding',
    title: 'Rounding',
    description: 'Compare chopping, round-up, round-down, and ties-to-even side by side.',
    icon: <Ruler className="w-6 h-6" />,
    accent: '#F5B83D',
  },
  {
    tab: 'arithmetic',
    title: 'Arithmetic',
    description: 'Step through Guard-Round-Sticky addition and multiplication.',
    icon: <Sigma className="w-6 h-6" />,
    accent: '#A6D5EC',
  },
];

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 py-6">
      <div className="bg-white border border-zinc-900 rounded-[36px] shadow-sm p-8 sm:p-16 text-center max-w-4xl w-full mx-auto my-4 transition-all">
        {/* Welcome Header */}
        <h1 className="text-5xl sm:text-6xl font-display tracking-[0.15em] text-[#5A4D44] font-semibold mb-8 uppercase">
          WELCOME
        </h1>

        {/* Sub-header */}
        <h2 className="text-2xl sm:text-4xl font-display text-[#5A4D44] font-semibold mb-6 leading-snug">
          Binary 64-bit Floating-Point Machine
        </h2>

        {/* Description Body */}
        <p className="max-w-2xl mx-auto text-sm font-body text-[#5A4D44] leading-relaxed mb-12">
          Explore the mechanics of IEEE 754 double-precision arithmetic—from
          exact bit-level conversion and custom precision rounding to step-by-step
          arithmetic with Guard, Round, and Sticky (GRS) bits.
        </p>

        {/* Module Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {MODULES.map((mod) => (
            <button
              key={mod.tab}
              onClick={() => onNavigate(mod.tab)}
              className="group bg-white border border-zinc-900 rounded-2xl p-5 text-left transition-all cursor-pointer hover:-translate-y-1 hover:shadow-md"
            >
              <div
                className="w-11 h-11 rounded-xl border border-zinc-900 flex items-center justify-center mb-3 text-[#5A4D44] transition-colors"
                style={{ backgroundColor: `${mod.accent}99` }}
              >
                {mod.icon}
              </div>
              <h3 className="font-display font-semibold text-base text-[#5A4D44] mb-1">
                {mod.title}
              </h3>
              <p className="font-body text-xs text-[#5A4D44]/70 leading-relaxed">
                {mod.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};