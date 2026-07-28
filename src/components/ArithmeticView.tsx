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
        {/* Compute Button */}
        <button
          id="btn-compute"
          onClick={() => handleCompute()}
          className="bg-[#A6D5EC] border border-zinc-900 hover:bg-[#96C8E0] text-[#695C53] font-mono text-sm font-semibold px-8 py-3 rounded-xl sm:rounded-2xl transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
        >
          Compute
        </button>

        {/* Operand A Input */}
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

        {/* Operator Toggle Buttons */}
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

        {/* Operand B Input */}
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
              Binary
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
                  <div className="bg-white border border-zinc-900 rounded-2xl px-4 py-4 sm:px-6 font-mono text-xs sm:text-sm font-normal text-[#695C53] text-center w-full shadow-2xs">
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
              <div className="border-t border-zinc-300 my-2"></div>
              <div className="text-center py-4 overflow-x-auto font-mono text-xl sm:text-2xl font-semibold text-[#695C53] tracking-wider">
                {arithmeticData.resultHexString}
              </div>
            </div>

            {/* Decimal */}
            <div className="bg-white border border-zinc-900 rounded-3xl p-6 shadow-xs">
              <h3 className="text-xs font-mono font-medium text-[#695C53]/50 mb-2">Decimal</h3>
              <div className="border-t border-zinc-300 my-2"></div>
              <div className="text-center py-4 overflow-x-auto font-mono text-xl sm:text-2xl font-semibold text-[#695C53] tracking-wider">
                {arithmeticData.resultDecimalString}
              </div>
            </div>
          </div>

          {/* Card 4: Accordion Button "See Steps" */}
          <div>
            <button
              id="btn-toggle-steps"
              onClick={() => setShowSteps(!showSteps)}
              className="bg-white border border-zinc-900 hover:bg-zinc-50 text-[#695C53] font-mono font-medium text-sm sm:text-base py-3.5 px-8 rounded-full w-full flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <span>{showSteps ? 'Hide Steps' : 'See Steps'}</span>
              {showSteps ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {/* Expanded Steps Container */}
            {showSteps && (
              <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {arithmeticData.steps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="bg-white border border-zinc-900 rounded-3xl p-6 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full">
                        Step {step.stepNumber}
                      </span>
                      {step.grsStatus && (
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded border border-blue-200 font-semibold">
                            G: {step.grsStatus.guard}
                          </span>
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded border border-indigo-200 font-semibold">
                            R: {step.grsStatus.round}
                          </span>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-900 rounded border border-purple-200 font-semibold">
                            S: {step.grsStatus.sticky}
                          </span>
                        </div>
                      )}
                    </div>

                    <h4 className="font-mono text-base font-semibold text-[#695C53]">
                      {step.title}
                    </h4>

                    <p className="font-mono text-xs sm:text-sm text-[#695C53]/50 leading-relaxed">
                      {step.description}
                    </p>

                    {step.detail && (
                      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 font-mono text-xs text-[#695C53] whitespace-pre-wrap leading-relaxed">
                        {step.detail}
                      </div>
                    )}

                    {step.binaryVisualization && (
                      <div className="bg-zinc-900 text-emerald-400 font-mono text-xs p-4 rounded-2xl overflow-x-auto tracking-wider whitespace-pre border border-zinc-800">
                        {step.binaryVisualization}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white border border-zinc-900 rounded-3xl p-12 text-center shadow-xs">
          <p className="font-mono text-sm sm:text-base text-[#695C53]/50 italic">
            Input Operands A & B above and press <span className="font-semibold text-[#695C53] non-italic">Compute</span> (or select a sample computation) to visualize GRS arithmetic steps and final results.
          </p>
        </div>
      )}
    </div>
  );
};
