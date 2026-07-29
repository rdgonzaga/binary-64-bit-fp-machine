import React, { useState, useMemo } from 'react';
import { performGRSArithmetic } from '../utils/ieee754';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const ArithmeticView: React.FC = () => {
  const [opA, setOpA] = useState<string>('');
  const [opB, setOpB] = useState<string>('');
  const [operation, setOperation] = useState<'+' | '*'>('+');
  const [showSteps, setShowSteps] = useState<boolean>(true);
  const [hasComputed, setHasComputed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isValidOperand = (val: string) => {
    if (!val.trim()) return true;
    const clean = val.trim();
    const isHex = clean.startsWith('0x') || clean.startsWith('0X') || /^[0-9a-fA-F]{16}$/.test(clean);
    const isSpecial = clean.toLowerCase().includes('nan') || clean.toLowerCase().includes('inf');
    const isDecimal = !isNaN(parseFloat(clean)) && /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?$/.test(clean);
    return isHex || isSpecial || isDecimal;
  };

  const handleCompute = (customA?: string, customB?: string, customOp?: '+' | '*') => {
    setErrorMessage(null);
    const targetA = customA !== undefined ? customA : opA;
    const targetB = customB !== undefined ? customB : opB;
    const targetOp = customOp !== undefined ? customOp : operation;

    const valA = targetA.trim();
    const valB = targetB.trim();

    if (!valA || !valB) {
      setErrorMessage('Please enter both Operand A and Operand B.');
      setHasComputed(false);
      return;
    }

    if (!isValidOperand(valA) || !isValidOperand(valB)) {
      setErrorMessage('Invalid operand format. Enter valid decimal or hex values.');
      setHasComputed(false);
      return;
    }

    setOpA(valA);
    setOpB(valB);
    if (customOp) setOperation(targetOp);
    setHasComputed(true);
  };

  // Compute GRS arithmetic result when computed
  const arithmeticData = useMemo(() => {
    if (!hasComputed) return null;
    return performGRSArithmetic(opA || '5.859874482048838', opB || '1.0', operation);
  }, [hasComputed, opA, opB, operation]);

  const formatBitGroup = (bitsStr: string) => {
    return bitsStr.split('').join(' ');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* Control Bar */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-900 p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center gap-3 shadow-xs">
        <button
          id="btn-compute"
          onClick={() => handleCompute()}
          className="bg-[#A6D5EC] border border-zinc-900 hover:bg-[#96C8E0] text-[#695C53] font-mono text-sm font-semibold px-8 py-3 rounded-xl sm:rounded-2xl transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
        >
          Compute
        </button>

        <input
          id="input-operand-a"
          type="text"
          value={opA}
          onChange={(e) => {
            setOpA(e.target.value);
            setHasComputed(false);
          }}
          placeholder="Operand A (decimal or hex)..."
          className="bg-white border border-zinc-900 rounded-xl sm:rounded-2xl px-5 py-3 font-mono text-sm sm:text-base flex-1 outline-none text-[#695C53] placeholder-[#695C53]/50 focus:ring-2 focus:ring-zinc-800 min-w-[140px]"
        />

        <div className="flex items-center gap-1.5">
          <button
            id="btn-op-add"
            onClick={() => {
              setOperation('+');
              setHasComputed(false);
            }}
            className={`w-11 h-11 rounded-xl sm:rounded-2xl border border-zinc-900 font-mono text-xl font-bold flex items-center justify-center transition-all cursor-pointer ${
              operation === '+'
                ? 'bg-[#A6D5EC] text-[#695C53] shadow-xs scale-105'
                : 'bg-white hover:bg-zinc-100 text-[#695C53]'
            }`}
            title="Addition"
          >
            +
          </button>
          <button
            id="btn-op-mult"
            onClick={() => {
              setOperation('*');
              setHasComputed(false);
            }}
            className={`w-11 h-11 rounded-xl sm:rounded-2xl border border-zinc-900 font-mono text-xl font-bold flex items-center justify-center transition-all cursor-pointer ${
              operation === '*'
                ? 'bg-[#A6D5EC] text-[#695C53] shadow-xs scale-105'
                : 'bg-white hover:bg-zinc-100 text-[#695C53]'
            }`}
            title="Multiplication"
          >
            *
          </button>
        </div>

        <input
          id="input-operand-b"
          type="text"
          value={opB}
          onChange={(e) => {
            setOpB(e.target.value);
            setHasComputed(false);
          }}
          placeholder="Operand B (decimal or hex)..."
          className="bg-white border border-zinc-900 rounded-xl sm:rounded-2xl px-5 py-3 font-mono text-sm sm:text-base flex-1 outline-none text-[#695C53] placeholder-[#695C53]/50 focus:ring-2 focus:ring-zinc-800 min-w-[140px]"
        />
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 font-mono text-xs px-4 py-2.5 rounded-xl flex items-center gap-2.5 animate-in fade-in duration-150">
          <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-200 border border-amber-400 px-2 py-0.5 rounded-md text-amber-950">
            Notice
          </span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick Example Presets */}
      <div className="flex flex-wrap items-center gap-2 px-2 text-xs font-mono text-[#695C53]/50">
        <span className="font-semibold text-[#695C53]">Sample Computations:</span>
        <button
          onClick={() => handleCompute('5.859874482048838', '1.0', '+')}
          className="px-3 py-1 bg-white border border-zinc-800 rounded-lg hover:bg-zinc-100 cursor-pointer text-[#695C53] transition-colors"
        >
          5.85987 + 1.0
        </button>
        <button
          onClick={() => handleCompute('0.1', '0.2', '+')}
          className="px-3 py-1 bg-white border border-zinc-800 rounded-lg hover:bg-zinc-100 cursor-pointer text-[#695C53] transition-colors"
        >
          0.1 + 0.2
        </button>
        <button
          onClick={() => handleCompute('0x40177082EFAC4240', '2.5', '*')}
          className="px-3 py-1 bg-white border border-zinc-800 rounded-lg hover:bg-zinc-100 cursor-pointer text-[#695C53] transition-colors"
        >
          0x401770... × 2.5
        </button>
      </div>

      {hasComputed && arithmeticData ? (
        <>
          {/* Result Card 1: Binary */}
          <div>
            <div className="inline-block bg-white border border-zinc-900 border-b-0 rounded-t-2xl px-6 py-2.5 font-mono text-sm font-semibold text-[#695C53] -mb-[1px] relative z-10 shadow-xs">
              Final Binary Result
            </div>

            <div className="bg-white border border-zinc-900 rounded-b-3xl rounded-tr-3xl p-6 sm:p-12 shadow-xs">
              <div className="flex flex-col gap-6 max-w-4xl mx-auto">
                {/* Top Row: Sign & Exponent */}
                <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-6">
                  {/* Sign Box */}
                  <div className="flex flex-col items-center">
                    <div className="bg-white border border-zinc-900 rounded-2xl px-6 py-4 font-mono text-base sm:text-lg font-normal text-[#695C53] text-center min-w-[80px] shadow-2xs">
                      {arithmeticData.resultIEEE.signBit}
                    </div>
                    <span className="text-xs font-mono text-[#695C53]/50 mt-1.5 font-medium">sign</span>
                  </div>

                  {/* Exponent Box */}
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <div className="bg-white border border-zinc-900 rounded-2xl px-4 py-4 sm:px-6 font-mono text-base sm:text-lg font-normal text-[#695C53] text-center w-full shadow-2xs">
                      <div className="flex flex-wrap justify-center gap-x-2 sm:gap-x-3 gap-y-1 font-mono tracking-widest">
                        {formatBitGroup(arithmeticData.resultIEEE.exponentBits)}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-[#695C53]/50 mt-1.5 font-medium">exponent</span>
                  </div>
                </div>

                {/* Bottom Row: Mantissa */}
                <div className="flex flex-col items-center w-full">
                  <div className="bg-white border border-zinc-900 rounded-2xl px-4 py-4 sm:px-6 font-mono text-base sm:text-lg font-normal text-[#695C53] text-center w-full shadow-2xs">
                    <div className="flex flex-wrap justify-center gap-x-2.5 sm:gap-x-3.5 gap-y-1.5 font-mono">
                      {arithmeticData.resultIEEE.mantissaBits.match(/.{1,4}/g)?.map((nibble, idx) => (
                        <span key={idx} className="whitespace-nowrap tracking-wider">
                          {nibble.split('').join(' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[#695C53]/50 mt-1.5 font-medium">mantissa</span>
                </div>
              </div>
            </div>
          </div>

          {/* Result Card 2 & 3: Hexadecimal and Decimal Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hexadecimal */}
            <div className="bg-white border border-zinc-900 rounded-3xl p-6 shadow-xs">
              <h3 className="text-xs font-mono font-medium text-[#695C53]/50 mb-2">Hexadecimal</h3>
              <div className="border-t border-zinc-200 my-2"></div>
              <div className="text-center py-4 overflow-x-auto font-mono text-xl sm:text-2xl font-semibold text-[#695C53] tracking-wider">
                {arithmeticData.resultHexString}
              </div>
            </div>

            {/* Decimal */}
            <div className="bg-white border border-zinc-900 rounded-3xl p-6 shadow-xs">
              <h3 className="text-xs font-mono font-medium text-[#695C53]/50 mb-2">Decimal</h3>
              <div className="border-t border-zinc-200 my-2"></div>
              <div className="text-center py-4 overflow-x-auto font-mono text-xl sm:text-2xl font-semibold text-[#695C53] tracking-wider">
                {arithmeticData.resultDecimalString}
              </div>
            </div>
          </div>

          {/* SYMBOLAB-INSPIRED STEPS SECTION */}
          <div className="bg-white border border-zinc-900 rounded-3xl p-6 sm:p-10 shadow-xs mt-4">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-200">
              <h2 className="text-xl font-semibold text-[#695C53]">Solution Steps</h2>
              <button
                id="btn-toggle-steps"
                onClick={() => setShowSteps(!showSteps)}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{showSteps ? 'Hide steps' : 'Show steps'}</span>
                {showSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showSteps && (
              <div className="relative border-l-2 border-zinc-100 ml-3 sm:ml-4 space-y-10 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {arithmeticData.steps.map((step) => (
                  <div key={step.stepNumber} className="relative pl-6 sm:pl-8">
                    {/* Step Number Timeline Dot */}
                    <div className="absolute -left-[17px] top-0 w-8 h-8 bg-white border-2 border-zinc-200 rounded-full flex items-center justify-center font-mono font-bold text-sm text-zinc-500 shadow-sm">
                      {step.stepNumber}
                    </div>

                    <div className="space-y-4">
                      {/* Step Header */}
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                        <h4 className="text-lg font-semibold text-zinc-800">
                          {step.title}
                        </h4>
                        
                        {/* Minimalist GRS Indicators */}
                        {step.grsStatus && (
                          <div className="flex items-center gap-3 text-sm font-mono text-zinc-600 bg-zinc-50 px-3 py-1 rounded-lg border border-zinc-200">
                            <span><span className="text-zinc-400">G:</span>{step.grsStatus.guard}</span>
                            <span className="text-zinc-300">|</span>
                            <span><span className="text-zinc-400">R:</span>{step.grsStatus.round}</span>
                            <span className="text-zinc-300">|</span>
                            <span><span className="text-zinc-400">S:</span>{step.grsStatus.sticky}</span>
                          </div>
                        )}
                      </div>

                      {/* Description (Sans-serif for readability) */}
                      <p className="text-base text-zinc-600 leading-relaxed">
                        {step.description}
                      </p>

                      {/* Detail block (Math-like notation style) */}
                      {step.detail && (
                        <div className="text-sm font-mono text-zinc-600 whitespace-pre-wrap leading-loose">
                          {step.detail}
                        </div>
                      )}

                      {/* Clean Math Block Visualization (Replaces dark terminal) */}
                      {step.binaryVisualization && (
                        <div className="bg-zinc-50/80 border-l-4 border-blue-400 text-zinc-800 font-mono text-sm sm:text-base p-4 sm:p-5 rounded-r-xl overflow-x-auto tracking-widest whitespace-pre shadow-inner">
                          {step.binaryVisualization}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white border border-zinc-900 rounded-3xl p-12 text-center shadow-xs mt-12">
          <p className="font-mono text-sm sm:text-base text-[#695C53]/50 italic">
            Input Operands A & B above and press <span className="font-semibold text-[#695C53] non-italic">Compute</span> (or select a sample computation) to visualize GRS arithmetic steps and final results.
          </p>
        </div>
      )}
    </div>
  );
};