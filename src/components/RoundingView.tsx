import React, { useState, useMemo } from 'react';
import { calculateRounding } from '../utils/ieee754';

export const RoundingView: React.FC = () => {
  const [format, setFormat] = useState<'decimal' | 'binary'>('binary');
  const [targetBits, setTargetBits] = useState<number>(10);
  const [inputVal, setInputVal] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validate and sanitize input based on format
  const handleInputChange = (val: string) => {
    setErrorMessage(null);
    if (format === 'binary') {
      // Allow only binary characters: 0, 1, ., - and spaces
      if (/[^01.\-\s]/.test(val)) {
        setErrorMessage('Binary mode active: Only 0s, 1s, and a decimal point "." are allowed.');
        // Filter out non-binary characters
        const sanitized = val.replace(/[^01.\-\s]/g, '');
        setInputVal(sanitized);
        return;
      }
      // Check for multiple decimal points
      if ((val.match(/\./g) || []).length > 1) {
        setErrorMessage('Invalid binary format: Multiple decimal points detected.');
      }
    } else {
      // Allow only decimal float characters: 0-9, ., - and spaces
      if (/[^0-9.\-\s]/.test(val)) {
        setErrorMessage('Decimal mode active: Only numbers 0-9, negative sign "-", and "." are allowed.');
        const sanitized = val.replace(/[^0-9.\-\s]/g, '');
        setInputVal(sanitized);
        return;
      }
      if ((val.match(/\./g) || []).length > 1) {
        setErrorMessage('Invalid decimal format: Multiple decimal points detected.');
      }
    }
    setInputVal(val);
  };

  // Recalculate rounding results when inputs change
  const results = useMemo(() => {
    if (!inputVal.trim()) return null;
    return calculateRounding(inputVal, format, targetBits);
  }, [inputVal, format, targetBits]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* Control Bar */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-900 p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center gap-3 shadow-xs">
        {/* Round Action Button */}
        <button
          id="btn-round-action"
          onClick={() => {
            if (!inputVal.trim()) {
              setInputVal(format === 'binary' ? '11.0010010000101' : '3.141592653589');
              setErrorMessage(null);
            }
          }}
          className="bg-[#F5B83D] border border-zinc-900 hover:bg-[#E5AA30] text-[#695C53] font-mono text-sm font-semibold px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
        >
          Round
        </button>

        {/* Format Select Dropdown */}
        <select
          id="select-rounding-format"
          value={format}
          onChange={(e) => {
            const nextFormat = e.target.value as 'decimal' | 'binary';
            setFormat(nextFormat);
            setErrorMessage(null);
            if (inputVal.trim()) {
              if (nextFormat === 'binary') {
                setInputVal(inputVal.replace(/[^01.\-\s]/g, ''));
              }
            }
          }}
          className="bg-white border border-zinc-900 rounded-xl px-4 py-2.5 font-mono text-sm text-[#695C53] outline-none cursor-pointer hover:bg-zinc-50"
        >
          <option value="binary">Binary (0s and 1s only)</option>
          <option value="decimal">Decimal (0-9)</option>
        </select>

        {/* Target Bits Input */}
        <div className="flex items-center gap-2 bg-white border border-zinc-900 rounded-xl px-3 py-2 font-mono text-sm">
          <span className="text-xs text-[#695C53]/50 font-medium">{format === 'binary' ? 'bits' : 'digits'}</span>
          <input
            id="input-target-bits"
            type="number"
            min={1}
            max={52}
            value={targetBits}
            onChange={(e) => setTargetBits(Math.max(1, Math.min(52, parseInt(e.target.value) || 1)))}
            className="w-12 outline-none font-mono text-center text-[#695C53] font-semibold"
          />
        </div>

        {/* Input Text Box */}
        <input
          id="input-rounding-val"
          type="text"
          value={inputVal}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={format === 'binary' ? "Enter binary (e.g. 11.0010010000101)..." : "Enter decimal (e.g. 3.141592653589)..."}
          className="bg-white border border-zinc-900 rounded-xl px-6 py-2.5 font-mono text-sm sm:text-base flex-1 min-w-[200px] outline-none text-[#695C53] placeholder-[#695C53]/50 focus:ring-2 focus:ring-zinc-800"
        />
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 font-mono text-xs px-4 py-2.5 rounded-xl flex items-center gap-2.5 animate-in fade-in duration-150">
          <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-200 border border-amber-400 px-2 py-0.5 rounded-md text-amber-950">
            Notice
          </span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Preset Quick Test Buttons */}
      <div className="flex flex-wrap items-center gap-2 px-2 text-xs font-mono text-[#695C53]/50">
        <span className="font-semibold text-[#695C53]">Quick Presets:</span>
        {format === 'binary' ? (
          <>
            <button
              onClick={() => {
                setInputVal('11.0010010000101');
                setTargetBits(10);
                setErrorMessage(null);
              }}
              className="px-3 py-1 bg-white border border-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer text-[#695C53]"
            >
              11.0010010000101 (10 bits)
            </button>
            <button
              onClick={() => {
                setInputVal('1.1011001011');
                setTargetBits(4);
                setErrorMessage(null);
              }}
              className="px-3 py-1 bg-white border border-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer text-[#695C53]"
            >
              1.1011001011 (4 bits)
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setInputVal('3.141592653589');
                setTargetBits(4);
                setErrorMessage(null);
              }}
              className="px-3 py-1 bg-white border border-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer text-[#695C53]"
            >
              3.141592 (4 digits)
            </button>
            <button
              onClick={() => {
                setInputVal('2.718281828459');
                setTargetBits(5);
                setErrorMessage(null);
              }}
              className="px-3 py-1 bg-white border border-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer text-[#695C53]"
            >
              2.718281 (5 digits)
            </button>
          </>
        )}
      </div>

      {/* 4 Cards 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Chopping */}
        <div className="bg-white border border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-mono font-semibold text-[#695C53] mb-1">Chopping</h3>
            <p className="text-xs font-mono text-[#695C53]/50 leading-relaxed mb-4">
              {results ? results.descriptions.chopping : "Truncates digits/bits past target precision toward zero."}
            </p>
          </div>
          <div>
            <div className="border-t border-zinc-300 my-4"></div>
            <div className="text-xl sm:text-2xl font-mono text-[#695C53] tracking-wider text-center py-4 font-semibold overflow-x-auto whitespace-nowrap">
              {results ? results.chopping : "-"}
            </div>
          </div>
        </div>

        {/* Card 2: Round-up */}
        <div className="bg-white border border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-mono font-semibold text-[#695C53] mb-1">Round-up</h3>
            <p className="text-xs font-mono text-[#695C53]/50 leading-relaxed mb-4">
              {results ? results.descriptions.roundUp : "Rounds up towards positive infinity (+∞)."}
            </p>
          </div>
          <div>
            <div className="border-t border-zinc-300 my-4"></div>
            <div className="text-xl sm:text-2xl font-mono text-[#695C53] tracking-wider text-center py-4 font-semibold overflow-x-auto whitespace-nowrap">
              {results ? results.roundUp : "-"}
            </div>
          </div>
        </div>

        {/* Card 3: Round-down */}
        <div className="bg-white border border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-mono font-semibold text-[#695C53] mb-1">Round-down</h3>
            <p className="text-xs font-mono text-[#695C53]/50 leading-relaxed mb-4">
              {results ? results.descriptions.roundDown : "Rounds down towards negative infinity (-∞)."}
            </p>
          </div>
          <div>
            <div className="border-t border-zinc-300 my-4"></div>
            <div className="text-xl sm:text-2xl font-mono text-[#695C53] tracking-wider text-center py-4 font-semibold overflow-x-auto whitespace-nowrap">
              {results ? results.roundDown : "-"}
            </div>
          </div>
        </div>

        {/* Card 4: Ties-to-even */}
        <div className="bg-white border border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-mono font-semibold text-[#695C53] mb-1">Ties-to-even</h3>
            <p className="text-xs font-mono text-[#695C53]/50 leading-relaxed mb-4">
              {results ? results.descriptions.tiesToEven : "Standard IEEE 754 round-to-nearest ties-to-even mode."}
            </p>
          </div>
          <div>
            <div className="border-t border-zinc-300 my-4"></div>
            <div className="text-xl sm:text-2xl font-mono text-[#695C53] tracking-wider text-center py-4 font-semibold overflow-x-auto whitespace-nowrap">
              {results ? results.tiesToEven : "-"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
