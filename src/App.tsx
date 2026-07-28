import { useState } from 'react';
import { AppTab } from './types';
import { HeaderNav } from './components/HeaderNav';
import { WelcomeView } from './components/WelcomeView';
import { ConversionView } from './components/ConversionView';
import { RoundingView } from './components/RoundingView';
import { ArithmeticView } from './components/ArithmeticView';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('welcome');

  return (
    <div className="min-h-screen bg-[#E6DEC9] text-[#695C53] font-mono pb-16 selection:bg-[#8EBD6D] selection:text-[#695C53]">
      {/* Header Navigation Bar with Top Pills */}
      <HeaderNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* View Switcher */}
      <main className="container mx-auto">
        {activeTab === 'welcome' && (
          <WelcomeView onStart={() => setActiveTab('conversion')} />
        )}
        {activeTab === 'conversion' && <ConversionView />}
        {activeTab === 'rounding' && <RoundingView />}
        {activeTab === 'arithmetic' && <ArithmeticView />}
      </main>
    </div>
  );
}

