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
    <div className="min-h-screen bg-[#E6DEC9] text-[#5A4D44] font-body pb-16 selection:bg-[#8EBD6D] selection:text-[#5A4D44]">
      {/* Header Navigation Bar with Top Pills */}
      <HeaderNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* View Switcher */}
      <main className="container mx-auto">
        {activeTab === 'welcome' && (
          <WelcomeView onNavigate={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'conversion' && <ConversionView />}
        {activeTab === 'rounding' && <RoundingView />}
        {activeTab === 'arithmetic' && <ArithmeticView />}
      </main>
    </div>
  );
}