import React, { useState, useMemo } from 'react';
import { decimalToIEEE754Double } from '../utils/ieee754';
import { CopyButton } from './CopyButton';
import { X, Play } from 'lucide-react';

const MAX_HISTORY = 6;

export const ConversionView: React.FC = () => {
  const [inputMode, setInputMode] = useState<'decimal' | 'hex'>('decimal');
  const [inputText, setInputText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const commitToHistory = (val: string) => {
    setHistory((prev) => {
      const next = [val, ...prev.filter((h) => h !== val)];
      return next.slice(0, MAX_HISTORY);
    });
  };

  const validateInput = (val: string, mode: 'decimal' | 'hex'): boolean => {
    const clean = val.trim();
    if (!clean) return true;
    const hexClean = clean.replace(/^0x/i, '').replace(/\s+/g, '');
    const isHex64 = /^[0-9a-fA-F]{16}$/.test(hexClean);
    const isHexPrefixed = /^0x[0-9a-fA-F]+(\.[0-9a-fA-F]+)?$/i.test(clean);
    const isSpecial = clean.toLowerCase().includes('nan') || clean.toLowerCase().includes('inf');
    const isDecimal = !isNaN(parseFloat(clean)) && /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?$/.test(clean);

    if (mode === 'hex') {
      return isHex64 || isHexPrefixed || isSpecial;
    } else {
      return isHex64 || isHexPrefixed || isSpecial || isDecimal;
    }
  };

  const handleInput = (val: string, modeOverride?: 'decimal' | 'hex') => {
    const currentMode = modeOverride || inputMode;
    setInputText(val);
    if (!val.trim()) {
      setErrorMessage(null);
      return;
    }
    if (!validateInput(val, currentMode)) {
      setErrorMessage(
        currentMode === 'hex'
          ? 'Invalid IEEE 754 64-bit hex string. Must be 16 hexadecimal characters (0-9, A-F).'
          : 'Invalid input format. Enter a valid decimal value.'
      );
    } else {
      setErrorMessage(null);
    }
  };

  const commitCurrent = (val: string, mode: 'decimal' | 'hex' = inputMode) => {
    const clean = val.trim();
    if (clean && validateInput(clean, mode)) commitToHistory(clean);
  };

  const handleModeChange = (nextMode: 'decimal' | 'hex') => {
    setInputMode(nextMode);
    setErrorMessage(null);
    if (inputText.trim()) {
      handleInput(inputText, nextMode);
    }
  };

  const handleCompute = () => {
    if (!inputText.trim()) {
      setErrorMessage('Please enter an input value.');
      return;
    }
    handleInput(inputText, inputMode);
    commitCurrent(inputText, inputMode);
  };

  // Compute IEEE 754 representation
  const ieeeData = useMemo(() => {
    if (!inputText.trim() || errorMessage) return null;
    return decimalToIEEE754Double(inputText, inputMode);
  }, [inputText, inputMode, errorMessage]);

  const formatBitGroup = (bitsStr: string) => {
    return bitsStr.split('').join(' ');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* Input Control Bar */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-900 p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center gap-3 shadow-xs">
        {/* Clear Button */}
        <button
          id="btn-clear-conversion"
          onClick={() => {
            setInputText('');
            setErrorMessage(null);
          }}
          disabled={!inputText}
          title="Clear input"
          className="bg-white border border-zinc-900 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-900 font-body text-sm font-semibold px-6 py-3 rounded-xl sm:rounded-2xl transition-all cursor-pointer text-center shadow-2xs hover:scale-105 active:scale-95 inline-flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Clear
        </button>

        {/* Compute Button */}
        <button
          id="btn-convert"
          onClick={handleCompute}
          className="bg-[#8EBD6D] border border-zinc-900 hover:bg-[#7EB25B] text-zinc-900 font-mono text-sm font-semibold px-6 py-2.5 rounded-xl sm:rounded-2xl transition-all cursor-pointer text-center shadow-2xs hover:scale-105 active:scale-95 inline-flex items-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          Compute
        </button>

        {/* Mode Dropdown Select */}
        <select
          id="select-conversion-mode"
          value={inputMode}
          onChange={(e) => handleModeChange(e.target.value as 'decimal' | 'hex')}
          className="bg-white border border-zinc-900 rounded-xl px-4 py-2.5 font-mono text-sm text-zinc-900 outline-none cursor-pointer hover:bg-zinc-50 font-medium"
        >
          <option value="decimal">Decimal Input</option>
          <option value="hex">Hexadecimal Input</option>
        </select>

        {/* Input Text Box */}
        <input
          id="input-conversion-val"
          type="text"
          value={inputText}
          onChange={(e) => handleInput(e.target.value)}
          onBlur={(e) => commitCurrent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCompute()}
          placeholder={
            inputMode === 'hex'
              ? 'Input 16-hex IEEE 754 string (e.g. 40177082EFAC4240 or 0x40177082EFAC4240)...'
              : 'Input decimal value (e.g. 5.8598744 or -0.15625)...'
          }
          className="bg-white border border-zinc-900 rounded-xl sm:rounded-2xl px-6 py-3 font-mono text-sm sm:text-base flex-1 min-w-[200px] outline-none text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-zinc-800"
        />
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 font-body text-xs px-4 py-2.5 rounded-xl flex items-center gap-2.5 animate-in fade-in duration-150">
          <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-200 border border-amber-400 px-2 py-0.5 rounded-md text-amber-950">
            Notice
          </span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Preset Example Badges */}
      <div className="flex flex-wrap items-center gap-2 px-2 text-xs font-body text-zinc-600">
        <span className="font-semibold text-zinc-900">Quick Examples:</span>
        {(inputMode === 'hex'
          ? ['0x40177082EFAC4240', '0x3FF0000000000000', '0x400921FB54442D18', '0x7FF0000000000000', '0x0000000000000000']
          : ['5.859874482048838', '-0.15625', '3.141592653589793', 'Infinity', 'NaN', '0']
        ).map((example) => (
          <button
            key={example}
            onClick={() => {
              handleInput(example, inputMode);
              commitCurrent(example, inputMode);
            }}
            className="px-3 py-1 bg-white border border-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer text-zinc-800 font-mono text-xs font-normal"
          >
            {example}
          </button>
        ))}
      </div>

      {/* Recent History */}
      {history.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-2 text-xs font-body text-zinc-600">
          <span className="font-semibold text-zinc-900">Recent:</span>
          {history.map((h, idx) => (
            <button
              key={`${h}-${idx}`}
              onClick={() => handleInput(h)}
              className="px-3 py-1 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer text-zinc-700 font-mono text-xs font-normal"
            >
              {h}
            </button>
          ))}
        </div>
      )}

      {/* Card 1: Binary Representation */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <div className="inline-block bg-white border border-zinc-900 border-b-0 rounded-t-2xl px-6 py-2.5 font-display text-sm font-semibold text-zinc-900 -mb-[1px] relative z-10 shadow-xs">
            Binary
          </div>
          {ieeeData && (
            <CopyButton value={ieeeData.spacedBinary} label="Copy binary" className="mb-1" />
          )}
        </div>

        <div className="bg-white border border-zinc-900 rounded-b-3xl rounded-tr-3xl p-6 sm:p-10 shadow-xs">
          {ieeeData ? (
            <div className="flex flex-col gap-6 max-w-4xl mx-auto">
              {/* Top Row: Sign & Exponent */}
              <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-6">
                {/* Sign Box */}
                <div className="flex flex-col items-center">
                  <div className="bg-white border border-zinc-900 rounded-2xl px-6 py-4 font-mono text-base font-normal text-zinc-700 text-center min-w-[80px] shadow-2xs">
                    {ieeeData.signBit}
                  </div>
                  <span className="text-xs font-mono font-bold tracking-wider text-zinc-900 mt-2">
                    sign
                  </span>
                </div>

                {/* Exponent Box */}
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className="bg-white border border-zinc-900 rounded-2xl px-4 py-4 sm:px-6 font-mono text-sm sm:text-base font-normal text-zinc-700 text-center w-full shadow-2xs">
                    <div className="flex flex-wrap justify-center gap-x-2 sm:gap-x-3 gap-y-1 tracking-widest">
                      {formatBitGroup(ieeeData.exponentBits)}
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold tracking-wider text-zinc-900 mt-2">
                    exponent
                  </span>
                </div>
              </div>

              {/* Bottom Row: Mantissa */}
              <div className="flex flex-col items-center w-full">
                <div className="bg-white border border-zinc-900 rounded-2xl px-4 py-4 sm:px-6 font-mono text-sm sm:text-base font-normal text-zinc-700 text-center w-full shadow-2xs">
                  <div className="flex flex-wrap justify-center gap-x-2.5 sm:gap-x-3.5 gap-y-1.5">
                    {ieeeData.mantissaBits.match(/.{1,4}/g)?.map((nibble, idx) => (
                      <span key={idx} className="whitespace-nowrap tracking-wider">
                        {nibble.split('').join(' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-xs font-mono font-bold tracking-wider text-zinc-900 mt-2">
                  mantissa
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 font-body text-sm text-zinc-500 italic">
              Enter a {inputMode === 'hex' ? '16-character hexadecimal IEEE 754 string' : 'decimal number'} above to view its 64-bit binary representation.
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Hexadecimal Representation */}
      <div>
        <div className="flex items-center justify-between">
          <div className="inline-block bg-white border border-zinc-900 border-b-0 rounded-t-2xl px-6 py-2.5 font-display text-sm font-semibold text-zinc-900 -mb-[1px] relative z-10 shadow-xs">
            Hexadecimal Representation
          </div>
          {ieeeData && (
            <CopyButton value={ieeeData.hexString} label="Copy hex" className="mb-1" />
          )}
        </div>

        <div className="bg-white border border-zinc-900 rounded-b-3xl rounded-tr-3xl p-6 sm:p-8 shadow-xs">
          <div className="bg-white border border-zinc-900 rounded-2xl p-6 text-center shadow-2xs">
            {ieeeData ? (
              <>
                <span className="font-mono text-lg sm:text-xl font-medium text-zinc-800 tracking-wider">
                  {ieeeData.hexString}
                </span>
                {ieeeData.specialCase && (
                  <span className="ml-4 inline-block px-3 py-1 bg-amber-100 border border-amber-300 text-amber-950 rounded-full text-xs font-body font-medium">
                    Special Case: {ieeeData.specialCase}
                  </span>
                )}
              </>
            ) : (
              <span className="font-body text-sm text-zinc-500 italic">
                Hexadecimal value will appear here...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};