import React, { useState, useMemo } from 'react';
import { calculateRounding } from '../utils/ieee754';
import { CopyButton } from './CopyButton';
import { X } from 'lucide-react';

const MAX_HISTORY = 6;

export const RoundingView: React.FC = () => {
  const [format, setFormat] = useState<'decimal' | 'binary'>('binary');
  const [targetBits, setTargetBits] = useState<number>(10);
  const [inputVal, setInputVal] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<{ value: string; format: 'decimal' | 'binary'; bits: number }[]>([]);

  const commitToHistory = (value: string, fmt: 'decimal' | 'binary', bits: number) => {
    setHistory((prev) => {
      const next = [{ value, format: fmt, bits }, ...prev.filter((h) => !(h.value === value && h.format === fmt && h.bits === bits))];
      return next.slice(0, MAX_HISTORY);
    });
  };

  // Validate and sanitize input based on format
  // Note: binary mode intentionally disallows "-" — this demonstrator only rounds magnitudes.
  const handleInputChange = (val: string) => {
    setErrorMessage(null);
    if (format === 'binary') {
      // Allow only binary characters: 0, 1, and a decimal point
      if (/[^01.\s]/.test(val)) {
        setErrorMessage('Binary mode active: Only 0s, 1s, and a decimal point "." are allowed.');
        const sanitized = val.replace(/[^01.\s]/g, '');
        setInputVal(sanitized);
        return;
      }
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

  const commitCurrent = (val: string) => {
    const clean = val.trim();
    if (clean && !errorMessage) commitToHistory(clean, format, targetBits);
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
        {/* Clear Button */}
        <button
          id="btn-clear-rounding"
          onClick={() => {
            setInputVal('');
            setErrorMessage(null);
          }}
          disabled={!inputVal}
          title="Clear input"
          className="bg-white border border-zinc-900 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-[#5A4D44] font-body text-sm font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 inline-flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Clear
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
                setInputVal(inputVal.replace(/[^01.\s]/g, ''));
              }
            }
          }}
          className="bg-white border border-zinc-900 rounded-xl px-4 py-2.5 font-body text-sm text-[#5A4D44] outline-none cursor-pointer hover:bg-zinc-50"
        >
          <option value="binary">Binary (0s and 1s only)</option>
          <option value="decimal">Decimal (0-9)</option>
        </select>

        {/* Target Bits Input */}
        <div className="flex items-center gap-2 bg-white border border-zinc-900 rounded-xl px-3 py-2 font-body text-sm">
          <span className="text-xs text-[#5A4D44]/50 font-medium">{format === 'binary' ? 'bits' : 'digits'}</span>
          <input
            id="input-target-bits"
            type="number"
            min={1}
            max={52}
            value={targetBits}
            onChange={(e) => setTargetBits(Math.max(1, Math.min(52, parseInt(e.target.value) || 1)))}
            className="w-12 outline-none font-data text-center text-[#5A4D44] font-semibold"
          />
        </div>

        {/* Input Text Box */}
        <input
          id="input-rounding-val"
          type="text"
          value={inputVal}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={(e) => commitCurrent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commitCurrent(inputVal)}
          placeholder={format === 'binary' ? "Enter binary (e.g. 11.0010010000101)..." : "Enter decimal (e.g. 3.141592653589)..."}
          className="bg-white border border-zinc-900 rounded-xl px-6 py-2.5 font-data text-sm sm:text-base flex-1 min-w-[200px] outline-none text-[#5A4D44] placeholder-[#5A4D44]/50 focus:ring-2 focus:ring-zinc-800"
        />
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 font-body text-xs px-4 py-2.5 rounded-xl flex items-center gap-2.5 animate-in fade-in duration-150">
          <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-200 border border-amber-400 px-2 py-0.5 rounded-md text-amber-950">
            Notice
          </span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Preset Quick Test Buttons */}
      <div className="flex flex-wrap items-center gap-2 px-2 text-xs font-body text-[#5A4D44]/50">
        <span className="font-semibold text-[#5A4D44]">Quick Examples:</span>
        {format === 'binary' ? (
          <>
            <button
              onClick={() => {
                setInputVal('11.0010010000101');
                setTargetBits(10);
                setErrorMessage(null);
                commitToHistory('11.0010010000101', 'binary', 10);
              }}
              className="px-3 py-1 bg-white border border-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer text-[#5A4D44] font-data"
            >
              11.0010010000101 (10 bits)
            </button>
            <button
              onClick={() => {
                setInputVal('1.1011001011');
                setTargetBits(4);
                setErrorMessage(null);
                commitToHistory('1.1011001011', 'binary', 4);
              }}
              className="px-3 py-1 bg-white border border-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer text-[#5A4D44] font-data"
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
                commitToHistory('3.141592653589', 'decimal', 4);
              }}
              className="px-3 py-1 bg-white border border-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer text-[#5A4D44] font-data"
            >
              3.141592 (4 digits)
            </button>
            <button
              onClick={() => {
                setInputVal('2.718281828459');
                setTargetBits(5);
                setErrorMessage(null);
                commitToHistory('2.718281828459', 'decimal', 5);
              }}
              className="px-3 py-1 bg-white border border-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer text-[#5A4D44] font-data"
            >
              2.718281 (5 digits)
            </button>
          </>
        )}
      </div>

      {/* Recent History */}
      {history.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-2 text-xs font-body text-[#5A4D44]/50">
          <span className="font-semibold text-[#5A4D44]">Recent:</span>
          {history.map((h, idx) => (
            <button
              key={`${h.value}-${h.format}-${h.bits}-${idx}`}
              onClick={() => {
                setFormat(h.format);
                setTargetBits(h.bits);
                setInputVal(h.value);
                setErrorMessage(null);
              }}
              className="px-3 py-1 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer text-[#5A4D44]/80 font-data"
            >
              {h.value} <span className="text-[#5A4D44]/40">({h.bits}{h.format === 'binary' ? 'b' : 'd'})</span>
            </button>
          ))}
        </div>
      )}

      {/* 4 Cards 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Chopping */}
        <div className="bg-white border border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-display font-semibold text-[#5A4D44]">Chopping</h3>
              {results && <CopyButton value={results.chopping} label="Copy" />}
            </div>
            <p className="text-xs font-body text-[#5A4D44]/50 leading-relaxed mb-4">
              {results ? results.descriptions.chopping : "Truncates digits/bits past target precision toward zero."}
            </p>
          </div>
          <div>
            <div className="border-t border-zinc-300 my-4"></div>
            <div className="text-xl sm:text-2xl font-data text-[#5A4D44] tracking-wider text-center py-4 font-semibold overflow-x-auto whitespace-nowrap">
              {results ? results.chopping : "-"}
            </div>
          </div>
        </div>

        {/* Card 2: Round-up */}
        <div className="bg-white border border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-display font-semibold text-[#5A4D44]">Round-up</h3>
              {results && <CopyButton value={results.roundUp} label="Copy" />}
            </div>
            <p className="text-xs font-body text-[#5A4D44]/50 leading-relaxed mb-4">
              {results ? results.descriptions.roundUp : "Rounds up towards positive infinity (+∞)."}
            </p>
          </div>
          <div>
            <div className="border-t border-zinc-300 my-4"></div>
            <div className="text-xl sm:text-2xl font-data text-[#5A4D44] tracking-wider text-center py-4 font-semibold overflow-x-auto whitespace-nowrap">
              {results ? results.roundUp : "-"}
            </div>
          </div>
        </div>

        {/* Card 3: Round-down */}
        <div className="bg-white border border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-display font-semibold text-[#5A4D44]">Round-down</h3>
              {results && <CopyButton value={results.roundDown} label="Copy" />}
            </div>
            <p className="text-xs font-body text-[#5A4D44]/50 leading-relaxed mb-4">
              {results ? results.descriptions.roundDown : "Rounds down towards negative infinity (-∞)."}
            </p>
          </div>
          <div>
            <div className="border-t border-zinc-300 my-4"></div>
            <div className="text-xl sm:text-2xl font-data text-[#5A4D44] tracking-wider text-center py-4 font-semibold overflow-x-auto whitespace-nowrap">
              {results ? results.roundDown : "-"}
            </div>
          </div>
        </div>

        {/* Card 4: Ties-to-even */}
        <div className="bg-white border border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-display font-semibold text-[#5A4D44]">Ties-to-even</h3>
              {results && <CopyButton value={results.tiesToEven} label="Copy" />}
            </div>
            <p className="text-xs font-body text-[#5A4D44]/50 leading-relaxed mb-4">
              {results ? results.descriptions.tiesToEven : "Standard IEEE 754 round-to-nearest ties-to-even mode."}
            </p>
          </div>
          <div>
            <div className="border-t border-zinc-300 my-4"></div>
            <div className="text-xl sm:text-2xl font-data text-[#5A4D44] tracking-wider text-center py-4 font-semibold overflow-x-auto whitespace-nowrap">
              {results ? results.tiesToEven : "-"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};