import { IEEE754Double, RoundingResult, ArithmeticResult, ArithmeticStep } from '../types';

/** Parses a hex-float string like "1A.8" into a JS number. Fallback for non-16-digit hex input. */
function parseHexFloat(hexStr: string): number {
  let clean = hexStr.trim().replace(/^0x/i, '');
  if (!clean) return NaN;
  let sign = 1;
  if (clean.startsWith('-')) {
    sign = -1;
    clean = clean.substring(1);
  } else if (clean.startsWith('+')) {
    clean = clean.substring(1);
  }
  const parts = clean.split('.');
  const intPart = parseInt(parts[0] || '0', 16);
  if (isNaN(intPart)) return NaN;
  let fracPart = 0;
  if (parts[1]) {
    for (let i = 0; i < parts[1].length; i++) {
      const digitVal = parseInt(parts[1][i], 16);
      if (isNaN(digitVal)) break;
      fracPart += digitVal / Math.pow(16, i + 1);
    }
  }
  return sign * (intPart + fracPart);
}

/** Builds a full IEEE754Double descriptor directly from a raw 64-bit pattern. */
function buildIEEE754FromBits(bitsBigInt: bigint): IEEE754Double {
  const buffer = new ArrayBuffer(8);
  const bigUint64 = new BigUint64Array(buffer);
  const float64 = new Float64Array(buffer);
  bigUint64[0] = BigInt.asUintN(64, bitsBigInt);
  const numVal = float64[0];

  const binary64 = bigUint64[0].toString(2).padStart(64, '0');
  const signBit = binary64[0];
  const exponentBits = binary64.substring(1, 12);
  const mantissaBits = binary64.substring(12);

  const biasedExp = parseInt(exponentBits, 2);
  let unbiasedExp = biasedExp - 1023;
  let specialCase: string | null = null;

  if (biasedExp === 2047) {
    specialCase = mantissaBits === '0'.repeat(52) ? (signBit === '0' ? '+Infinity' : '-Infinity') : 'NaN';
  } else if (biasedExp === 0) {
    if (mantissaBits === '0'.repeat(52)) {
      specialCase = signBit === '0' ? '+0' : '-0';
      unbiasedExp = 0;
    } else {
      specialCase = 'Subnormal (Denormal)';
      unbiasedExp = -1022; // Subnormals use exp = -1022 with 0.mantissa
    }
  }

  return {
    signBit,
    exponentBits,
    mantissaBits,
    fullBinary: binary64,
    spacedBinary: `${signBit} ${exponentBits} ${mantissaBits}`,
    hexString: '0x' + bigUint64[0].toString(16).toUpperCase().padStart(16, '0'),
    decimalVal: numVal,
    specialCase,
    unbiasedExponent: unbiasedExp,
    biasedExponent: biasedExp,
  };
}

/**
 * Converts a number or input string (decimal or hex) to IEEE 754 double precision object.
 */
export function decimalToIEEE754Double(input: number | string, mode?: 'decimal' | 'hex'): IEEE754Double {
  let numVal: number;

  const cleanInput = typeof input === 'string' ? input.trim() : String(input);

  // Check if input is hexadecimal (starts with 0x/0X or is 16 hex chars or mode is hex)
  if (mode === 'hex' || (mode !== 'decimal' && typeof input === 'string' && (cleanInput.startsWith('0x') || cleanInput.startsWith('0X') || /^[0-9a-fA-F]{16}$/.test(cleanInput.replace(/^0x/i, ''))))) {
    const hexClean = cleanInput.replace(/^0x/i, '').replace(/\s+/g, '');
    if (/^[0-9a-fA-F]{16}$/.test(hexClean)) {
      try {
        const bigIntVal = BigInt(`0x${hexClean}`);
        const buffer = new ArrayBuffer(8);
        const bigUint64 = new BigUint64Array(buffer);
        const float64 = new Float64Array(buffer);

        bigUint64[0] = bigIntVal;
        numVal = float64[0];
      } catch {
        numVal = parseHexFloat(cleanInput);
      }
    } else {
      numVal = parseHexFloat(cleanInput);
    }
  } else {
    numVal = typeof input === 'number' ? input : parseFloat(cleanInput);
  }

  // Handle case where parsing fails
  if (isNaN(numVal) && !cleanInput.toLowerCase().includes('nan')) {
    numVal = NaN;
  }

  // Convert JS Float64 number to 64-bit binary representation
  const buffer = new ArrayBuffer(8);
  const float64 = new Float64Array(buffer);
  const bigUint64 = new BigUint64Array(buffer);
  float64[0] = numVal;

  return buildIEEE754FromBits(bigUint64[0]);
}

/**
 * Demonstrate rounding methods for binary or decimal inputs.
 */
export function calculateRounding(
  inputStr: string,
  format: 'decimal' | 'binary',
  targetBits: number
): RoundingResult {
  const target = Math.max(1, Math.min(52, targetBits || 10));
  const cleanInput = inputStr.trim() || (format === 'binary' ? '11.0010010000101' : '3.141592653589');

  if (format === 'binary') {
    return roundBinaryString(cleanInput, target);
  } else {
    return roundDecimalString(cleanInput, target);
  }
}

function roundBinaryString(binaryStr: string, targetFractionalBits: number): RoundingResult {
  // Strip spaces, validate binary float representation
  let clean = binaryStr.replace(/\s+/g, '');
  const isNegative = clean.startsWith('-');
  if (isNegative) clean = clean.substring(1);

  const parts = clean.split('.');
  const integerPart = parts[0] || '0';
  const fracPart = parts[1] || '0';

  if (fracPart.length <= targetFractionalBits) {
    const paddedFrac = fracPart.padEnd(targetFractionalBits, '0');
    const full = `${isNegative ? '-' : ''}${integerPart}.${paddedFrac}`;
    return {
      chopping: full,
      roundUp: full,
      roundDown: full,
      tiesToEven: full,
      inputFormat: 'binary',
      targetBits: targetFractionalBits,
      descriptions: {
        chopping: 'Fraction length is already within target bits.',
        roundUp: 'Fraction length is already within target bits.',
        roundDown: 'Fraction length is already within target bits.',
        tiesToEven: 'Fraction length is already within target bits.',
      },
    };
  }

  const keptFrac = fracPart.substring(0, targetFractionalBits);
  const droppedFrac = fracPart.substring(targetFractionalBits);

  const prefix = isNegative ? '-' : '';

  // 1. Chopping (Truncation)
  const choppingRes = `${prefix}${integerPart}.${keptFrac}`;

  // Helper to increment binary fractional part by 1 bit
  function addOneToBinary(intP: string, fracP: string): string {
    const fullBits = (intP + fracP).split('');
    let carry = 1;
    for (let i = fullBits.length - 1; i >= 0; i--) {
      const bit = parseInt(fullBits[i], 10) + carry;
      if (bit >= 2) {
        fullBits[i] = (bit % 2).toString();
        carry = 1;
      } else {
        fullBits[i] = bit.toString();
        carry = 0;
        break;
      }
    }
    let combined = fullBits.join('');
    if (carry === 1) {
      combined = '1' + combined;
    }
    const newFracLen = fracP.length;
    const newIntP = combined.substring(0, combined.length - newFracLen);
    const newFracP = combined.substring(combined.length - newFracLen);
    return `${prefix}${newIntP}.${newFracP}`;
  }

  const hasNonZeroDropped = /[1]/.test(droppedFrac);

  // 2. Round-Up (Ceiling: towards +infinity)
  let roundUpRes = choppingRes;
  if (hasNonZeroDropped) {
    if (!isNegative) {
      roundUpRes = addOneToBinary(integerPart, keptFrac);
    } else {
      roundUpRes = choppingRes; // towards +infty for negative means truncating magnitude
    }
  }

  // 3. Round-Down (Floor: towards -infinity)
  let roundDownRes = choppingRes;
  if (hasNonZeroDropped) {
    if (isNegative) {
      roundDownRes = addOneToBinary(integerPart, keptFrac);
    } else {
      roundDownRes = choppingRes;
    }
  }

  // 4. Ties-to-Even (Round to nearest, ties to even)
  let tiesToEvenRes = choppingRes;
  const guardBit = droppedFrac[0];
  const restDroppedHasOne = /[1]/.test(droppedFrac.substring(1));
  const lsbBit = keptFrac[keptFrac.length - 1] || integerPart[integerPart.length - 1];

  if (guardBit === '1') {
    if (restDroppedHasOne) {
      // Strictly greater than half-way: round up magnitude
      tiesToEvenRes = addOneToBinary(integerPart, keptFrac);
    } else {
      // Exact tie! Round to even LSB
      if (lsbBit === '1') {
        tiesToEvenRes = addOneToBinary(integerPart, keptFrac);
      } else {
        tiesToEvenRes = choppingRes;
      }
    }
  } else {
    tiesToEvenRes = choppingRes;
  }

  return {
    chopping: choppingRes,
    roundUp: roundUpRes,
    roundDown: roundDownRes,
    tiesToEven: tiesToEvenRes,
    inputFormat: 'binary',
    targetBits: targetFractionalBits,
    descriptions: {
      chopping: `Truncates fractional bits past bit ${targetFractionalBits}. Dropped bits: "${droppedFrac}".`,
      roundUp: isNegative ? `Negative input: truncation shifts towards +infinity.` : `Positive input with dropped bits "${droppedFrac}" > 0: adds 1 LSB bit.`,
      roundDown: isNegative ? `Negative input with dropped bits "${droppedFrac}" > 0: subtracts 1 LSB (increases magnitude towards -infinity).` : `Positive input: truncation shifts towards -infinity.`,
      tiesToEven: guardBit === '1' && !restDroppedHasOne ? `Exact tie at bit ${targetFractionalBits + 1}. LSB was '${lsbBit}', rounded to nearest even bit.` : `Rounds to nearest value based on guard bit '${guardBit}'.`,
    },
  };
}

/** Rounds a decimal string using exact digit-string arithmetic (no float scaling). */
function roundDecimalString(decStr: string, targetDigits: number): RoundingResult {
  const cleanStr = decStr.trim().replace(/\s+/g, '');
  const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(cleanStr);
  const hasDigits = !!match && (!!match[2] || !!match[3]);

  if (!match || !hasDigits) {
    return {
      chopping: 'Invalid input',
      roundUp: 'Invalid input',
      roundDown: 'Invalid input',
      tiesToEven: 'Invalid input',
      inputFormat: 'decimal',
      targetBits: targetDigits,
      descriptions: {
        chopping: 'Unable to parse decimal number',
        roundUp: 'Unable to parse decimal number',
        roundDown: 'Unable to parse decimal number',
        tiesToEven: 'Unable to parse decimal number',
      },
    };
  }

  const isNegative = match[1] === '-';
  const integerPart = match[2] || '0';
  const fracPart = (match[3] || '').padEnd(targetDigits + 1, '0');

  const keptFrac = fracPart.substring(0, targetDigits);
  const droppedFrac = fracPart.substring(targetDigits);
  const hasNonZeroDropped = /[1-9]/.test(droppedFrac);

  const prefix = isNegative ? '-' : '';
  const format = (intP: string, fracP: string) => `${prefix}${intP}.${fracP}`;

  // Increments the combined integer+fraction digit string by 1 (magnitude only), handling carry-out.
  function incrementMagnitude(intP: string, fracP: string): [string, string] {
    const digits = (intP + fracP).split('');
    let carry = 1;
    for (let i = digits.length - 1; i >= 0 && carry; i--) {
      const d = digits[i].charCodeAt(0) - 48 + carry;
      digits[i] = String(d % 10);
      carry = d >= 10 ? 1 : 0;
    }
    let combined = digits.join('');
    if (carry) combined = '1' + combined;
    const newIntLen = combined.length - fracP.length;
    return [combined.substring(0, newIntLen), combined.substring(newIntLen)];
  }

  const choppingRes = format(integerPart, keptFrac);

  // Round-Up (towards +infinity): positive magnitudes with dropped digits round away from zero.
  let roundUpRes = choppingRes;
  if (hasNonZeroDropped && !isNegative) {
    const [i, f] = incrementMagnitude(integerPart, keptFrac);
    roundUpRes = format(i, f);
  }

  // Round-Down (towards -infinity): negative magnitudes with dropped digits round away from zero.
  let roundDownRes = choppingRes;
  if (hasNonZeroDropped && isNegative) {
    const [i, f] = incrementMagnitude(integerPart, keptFrac);
    roundDownRes = format(i, f);
  }

  // Ties-to-Even
  const firstDropped = droppedFrac[0];
  const restDroppedHasNonZero = /[1-9]/.test(droppedFrac.substring(1));
  const lastKeptDigit = keptFrac[keptFrac.length - 1];
  const isExactTie = firstDropped === '5' && !restDroppedHasNonZero;

  let tiesToEvenRes = choppingRes;
  if (firstDropped > '5' || (isExactTie && parseInt(lastKeptDigit, 10) % 2 === 1)) {
    const [i, f] = incrementMagnitude(integerPart, keptFrac);
    tiesToEvenRes = format(i, f);
  }

  return {
    chopping: choppingRes,
    roundUp: roundUpRes,
    roundDown: roundDownRes,
    tiesToEven: tiesToEvenRes,
    inputFormat: 'decimal',
    targetBits: targetDigits,
    descriptions: {
      chopping: `Truncated digits past position ${targetDigits} towards zero. Dropped digits: "${droppedFrac}".`,
      roundUp: isNegative ? `Negative input: truncation already shifts towards +infinity.` : `Dropped digits "${droppedFrac}" > 0: rounded away from zero towards +infinity.`,
      roundDown: isNegative ? `Dropped digits "${droppedFrac}" > 0: rounded away from zero towards -infinity.` : `Positive input: truncation already shifts towards -infinity.`,
      tiesToEven: isExactTie ? `Exact tie at digit ${targetDigits + 1} (dropped digits are exactly "5" followed by zeros). Last kept digit was '${lastKeptDigit}', rounded to nearest even.` : `Rounded to nearest based on the first dropped digit '${firstDropped}'.`,
    },
  };
}

/** Extracts the 53-bit significand (implicit bit included for normals) from an IEEE754Double. */
function toSignificand(v: IEEE754Double): bigint {
  const implicit = v.biasedExponent === 0 ? 0n : (1n << 52n);
  return implicit | BigInt('0b0' + v.mantissaBits);
}

/** Rounds [53-bit significand][Guard][Round] (bits 1,0 of `ext`) to the nearest even significand. */
function roundTiesToEven(ext: bigint, sticky: boolean): { mantissa: bigint; guard: string; round: string; sticky: string; carriedOut: boolean } {
  const guard = (ext >> 1n) & 1n;
  const round = ext & 1n;
  const main = ext >> 2n;
  const shouldRoundUp = guard === 1n && (round === 1n || sticky || (main & 1n) === 1n);
  let mantissa = shouldRoundUp ? main + 1n : main;
  const carriedOut = mantissa >= (1n << 53n);
  if (carriedOut) mantissa = mantissa >> 1n; // 1.111..1 + 1 ulp -> 10.000... -> renormalize
  return { mantissa, guard: guard.toString(), round: round.toString(), sticky: sticky ? '1' : '0', carriedOut };
}

/** Packs (sign, unbiasedExp, significand) into an IEEE754Double, handling overflow/underflow. */
function packSignificand(sign: string, unbiasedExp: number, significand53: bigint): IEEE754Double {
  let biasedExp = unbiasedExp + 1023;

  if (biasedExp <= 0) {
    const extraShift = BigInt(1 - biasedExp);
    const ext = significand53 << 2n;
    const lost = ext & ((1n << extraShift) - 1n);
    const shifted = ext >> extraShift;
    const rounded = roundTiesToEven(shifted, lost !== 0n);
    significand53 = rounded.mantissa;
    biasedExp = significand53 >= (1n << 52n) ? 1 : 0;
  }

  if (biasedExp >= 2047) {
    const bits = ((sign === '1' ? 1n : 0n) << 63n) | (2047n << 52n);
    return buildIEEE754FromBits(bits);
  }

  const bits = ((sign === '1' ? 1n : 0n) << 63n) | (BigInt(biasedExp) << 52n) | (significand53 & ((1n << 52n) - 1n));
  return buildIEEE754FromBits(bits);
}

interface GRSAdditionResult {
  resultIEEE: IEEE754Double;
  guard: string;
  round: string;
  sticky: string;
  expDiff: number;
  shiftedLabel: 'A' | 'B';
  isSameSign: boolean;
  isTie: boolean;
  cancelled: boolean;
}

/** Computes A (+/-) B via GRS rounding on the raw significands (not native float addition). */
function computeGRSAddition(ieeeA: IEEE754Double, ieeeB: IEEE754Double): GRSAdditionResult {
  const sigA = toSignificand(ieeeA);
  const sigB = toSignificand(ieeeB);
  const expA = ieeeA.unbiasedExponent;
  const expB = ieeeB.unbiasedExponent;

  const aIsRef = expA > expB || (expA === expB && sigA >= sigB);
  const refSig = aIsRef ? sigA : sigB;
  const refExp = aIsRef ? expA : expB;
  const refSign = aIsRef ? ieeeA.signBit : ieeeB.signBit;
  const othSig = aIsRef ? sigB : sigA;
  const othExp = aIsRef ? expB : expA;
  const othSign = aIsRef ? ieeeB.signBit : ieeeA.signBit;
  const shiftedLabel: 'A' | 'B' = aIsRef ? 'B' : 'A';

  const shift = BigInt(refExp - othExp); // >= 0, since ref has the larger exponent (or equal)

  // Extend by 2 bits (Guard/Round) before shifting, so subtraction can borrow through
  // precision that would otherwise be discarded near exact cancellation.
  const extRef = refSig << 2n;
  let extOth = othSig << 2n;
  let sticky = false;
  if (shift > 0n) {
    const lost = extOth & ((1n << shift) - 1n);
    sticky = lost !== 0n;
    extOth = extOth >> shift;
  }

  const isSameSign = refSign === othSign;
  let ext = isSameSign ? extRef + extOth : extRef - extOth;

  if (ext === 0n) {
    // Exact cancellation: IEEE 754 defines this as +0 under round-to-nearest.
    return {
      resultIEEE: buildIEEE754FromBits(0n),
      guard: '0', round: '0', sticky: '0',
      expDiff: Number(shift), shiftedLabel, isSameSign, isTie: false, cancelled: true,
    };
  }

  // Normalize so the implicit bit sits at position 54 (carry-out if normShift > 0, cancellation if < 0).
  const bitLen = ext.toString(2).length;
  const normShift = bitLen - 1 - 54;
  let resultExp = refExp;
  if (normShift > 0) {
    const lostDuringNorm = ext & ((1n << BigInt(normShift)) - 1n);
    if (lostDuringNorm !== 0n) sticky = true;
    ext = ext >> BigInt(normShift);
    resultExp += normShift;
  } else if (normShift < 0) {
    ext = ext << BigInt(-normShift);
    resultExp += normShift;
  }

  const rounded = roundTiesToEven(ext, sticky);
  if (rounded.carriedOut) resultExp += 1;

  return {
    resultIEEE: packSignificand(refSign, resultExp, rounded.mantissa),
    guard: rounded.guard,
    round: rounded.round,
    sticky: rounded.sticky,
    expDiff: Number(shift),
    shiftedLabel,
    isSameSign,
    isTie: rounded.guard === '1' && rounded.round === '0' && rounded.sticky === '0',
    cancelled: false,
  };
}

interface GRSMultiplicationResult {
  resultIEEE: IEEE754Double;
  guard: string;
  round: string;
  sticky: string;
  topBit: number;
  product: bigint;
}

/** Computes A * B via GRS rounding on the raw significand product (not native float multiply). */
function computeGRSMultiplication(ieeeA: IEEE754Double, ieeeB: IEEE754Double): GRSMultiplicationResult {
  const sigA = toSignificand(ieeeA);
  const sigB = toSignificand(ieeeB);
  const product = sigA * sigB;

  const topBit = product.toString(2).length - 1; // MSB index of the raw product
  const shiftAmount = topBit - 54;
  let ext: bigint;
  let sticky: boolean;
  if (shiftAmount >= 0) {
    const lost = product & ((1n << BigInt(shiftAmount)) - 1n);
    ext = product >> BigInt(shiftAmount);
    sticky = lost !== 0n;
  } else {
    ext = product << BigInt(-shiftAmount);
    sticky = false;
  }

  const rounded = roundTiesToEven(ext, sticky);
  let resultExp = topBit + ieeeA.unbiasedExponent + ieeeB.unbiasedExponent - 104;
  if (rounded.carriedOut) resultExp += 1;
  const resultSign = ieeeA.signBit === ieeeB.signBit ? '0' : '1';

  return {
    resultIEEE: packSignificand(resultSign, resultExp, rounded.mantissa),
    guard: rounded.guard,
    round: rounded.round,
    sticky: rounded.sticky,
    topBit,
    product,
  };
}

/** Performs IEEE 754 double-precision addition/multiplication via GRS rounding, with a step-by-step trace. */
export function performGRSArithmetic(
  opAStr: string,
  opBStr: string,
  operation: '+' | '*',
  mode?: 'decimal' | 'hex'
): ArithmeticResult {
  const defaultA = mode === 'hex' ? '0x40177082EFAC4240' : '5.859874482048838';
  const defaultB = mode === 'hex' ? '0x3FF0000000000000' : '1.0';
  const ieeeA = decimalToIEEE754Double(opAStr || defaultA, mode);
  const ieeeB = decimalToIEEE754Double(opBStr || defaultB, mode);

  const steps: ArithmeticStep[] = [];

  // Step 1: Unpack Operands (Using E and E' notation)
  steps.push({
    stepNumber: 1,
    title: 'Operand Unpacking & Field Extraction',
    description: `Extract Sign bit (S), Biased Exponent, and 52-bit Mantissa for Operands A and B. Add implicit leading bit 1.`,
    detail: `Operand A: Sign=${ieeeA.signBit}, Biased Exp=${ieeeA.biasedExponent} (Unbiased E=${ieeeA.unbiasedExponent}), Mantissa (M)=1.${ieeeA.mantissaBits.substring(0, 16)}...\n` +
            `Operand B: Sign=${ieeeB.signBit}, Biased Exp=${ieeeB.biasedExponent} (Unbiased E'=${ieeeB.unbiasedExponent}), Mantissa (M')=1.${ieeeB.mantissaBits.substring(0, 16)}...`,
    binaryVisualization: `A: ${ieeeA.spacedBinary}\nB: ${ieeeB.spacedBinary}`,
  });

  // Special cases (Inf, NaN, 0): GRS rounding doesn't apply, IEEE 754 defines these directly.
  if (ieeeA.specialCase || ieeeB.specialCase) {
    let resultVal = 0;
    if (operation === '+') {
      resultVal = ieeeA.decimalVal + ieeeB.decimalVal;
    } else {
      resultVal = ieeeA.decimalVal * ieeeB.decimalVal;
    }
    const resIEEE = decimalToIEEE754Double(resultVal);

    steps.push({
      stepNumber: 2,
      title: 'Special Case Evaluation',
      description: `Detected special IEEE 754 value: Operand A (${ieeeA.specialCase || 'Normal'}), Operand B (${ieeeB.specialCase || 'Normal'}).`,
      detail: `Rule applied according to IEEE 754 spec (GRS rounding does not apply to special values). Final result evaluated directly to ${resIEEE.specialCase || resultVal}.`,
    });

    return {
      operandA: ieeeA,
      operandB: ieeeB,
      operation,
      resultIEEE: resIEEE,
      resultDecimalString: String(resultVal),
      resultHexString: resIEEE.hexString,
      specialCase: resIEEE.specialCase,
      steps,
    };
  }

  if (operation === '+') {
    const add = computeGRSAddition(ieeeA, ieeeB);

    if (add.cancelled) {
      steps.push({
        stepNumber: 2,
        title: 'Exact Cancellation',
        description: `Operands are equal in magnitude with opposite signs: A + B cancels exactly.`,
        detail: `Result is exactly +0 under round-to-nearest ties-to-even.`,
      });
    } else {
      steps.push({
        stepNumber: 2,
        title: 'Exponent Alignment (ΔE) & Mantissa Shift',
        description: `Calculate exponent difference: ΔE = |E - E'| = ${add.expDiff}. Align to the larger-magnitude operand.`,
        detail: add.expDiff > 0
          ? `Shifted Operand ${add.shiftedLabel}'s mantissa right by ΔE (${add.expDiff}) bits. Outshifted bits generated Guard (G=${add.guard}), Round (R=${add.round}), and Sticky (S=${add.sticky}) bits.`
          : `Exponents are equal (ΔE = 0). No right-shift required.`,
        grsStatus: { guard: add.guard, round: add.round, sticky: add.sticky },
      });

      steps.push({
        stepNumber: 3,
        title: 'Significand Addition / Subtraction',
        description: `Perform binary ${add.isSameSign ? 'addition' : 'subtraction'} on the aligned significands, including the Guard, Round, and Sticky bits.`,
        detail: `Signs ${add.isSameSign ? 'match' : 'differ'} (${ieeeA.signBit} and ${ieeeB.signBit}).`,
        binaryVisualization: `A Mantissa: 1.${ieeeA.mantissaBits.substring(0, 20)}...\nB Mantissa: 1.${ieeeB.mantissaBits.substring(0, 20)}...\nGRS Bits:   G:${add.guard} R:${add.round} S:${add.sticky}`,
      });

      steps.push({
        stepNumber: 4,
        title: 'Normalization',
        description: `Check for significand carry-out or cancellation-driven leading zeros. Adjust the exponent and re-derive the Guard/Round bits if the significand shifted.`,
        detail: `Normalized result exponent: ${add.resultIEEE.unbiasedExponent} (Biased ${add.resultIEEE.biasedExponent}).`,
      });

      steps.push({
        stepNumber: 5,
        title: 'GRS Rounding (Ties-to-Even)',
        description: `Apply IEEE 754 round-to-nearest ties-to-even using the Guard, Round, and Sticky bits.`,
        detail: `G=${add.guard}, R=${add.round}, S=${add.sticky}. ${add.guard === '1' ? (add.isTie ? 'Exact tie: rounded to make the mantissa LSB even.' : 'More than halfway: rounded up.') : 'Less than halfway: truncated.'}`,
        grsStatus: { guard: add.guard, round: add.round, sticky: add.sticky },
      });
    }

    steps.push({
      stepNumber: 6,
      title: 'Final IEEE 754 64-Bit Re-Packing',
      description: `Assemble final 64-bit word: Sign bit (1), Biased Exponent (11), Mantissa (52).`,
      detail: `Final Binary: ${add.resultIEEE.spacedBinary}\nFinal Hex: ${add.resultIEEE.hexString}\nFinal Decimal: ${add.resultIEEE.decimalVal}`,
      binaryVisualization: add.resultIEEE.spacedBinary,
    });

    return {
      operandA: ieeeA,
      operandB: ieeeB,
      operation,
      resultIEEE: add.resultIEEE,
      resultDecimalString: String(add.resultIEEE.decimalVal),
      resultHexString: add.resultIEEE.hexString,
      specialCase: add.resultIEEE.specialCase,
      steps,
    };
  } else {
    const mul = computeGRSMultiplication(ieeeA, ieeeB);
    const unroundedExp = ieeeA.unbiasedExponent + ieeeB.unbiasedExponent;
    const isTie = mul.guard === '1' && mul.round === '0' && mul.sticky === '0';

    steps.push({
      stepNumber: 2,
      title: 'Exponent Addition & Bias Adjustment',
      description: `Add unbiased exponents: E (${ieeeA.unbiasedExponent}) + E' (${ieeeB.unbiasedExponent}) = ${unroundedExp}.`,
      detail: `Product significand's leading bit sits at position ${mul.topBit}. Normalized biased exponent before final rounding: ${mul.resultIEEE.biasedExponent}.`,
    });

    steps.push({
      stepNumber: 3,
      title: 'Significand Multiplication & GRS Bit Extraction',
      description: `Multiply the 53-bit significands (1.M × 1.M') producing a wide product.`,
      detail: `Extracted Guard (G=${mul.guard}), Round (R=${mul.round}), and Sticky (S=${mul.sticky}) bits from the product's low-order bits.`,
      grsStatus: { guard: mul.guard, round: mul.round, sticky: mul.sticky },
      binaryVisualization: `Product MSB: ${mul.product.toString(2).substring(0, 32)}...\nGRS Status:  G:${mul.guard} R:${mul.round} S:${mul.sticky}`,
    });

    steps.push({
      stepNumber: 4,
      title: 'Normalization & Exponent Increment',
      description: mul.topBit === 105
        ? `Product overflowed into MSB bit 105 (2.0 ≤ product < 4.0). Shifted significand right 1 bit and incremented exponent.`
        : `Product in normal range (1.0 ≤ product < 2.0). No exponent shift required.`,
      detail: `Final normalized biased exponent: ${mul.resultIEEE.biasedExponent}.`,
    });

    steps.push({
      stepNumber: 5,
      title: 'GRS Round-to-Nearest (Ties-to-Even)',
      description: `Round the normalized product down to 53 bits using the Guard, Round, and Sticky bits.`,
      detail: `G=${mul.guard}, R=${mul.round}, S=${mul.sticky}. ${mul.guard === '1' ? (isTie ? 'Exact tie: rounded to make the mantissa LSB even.' : 'More than halfway: rounded up.') : 'Less than halfway: truncated.'}`,
    });

    steps.push({
      stepNumber: 6,
      title: 'Final IEEE 754 64-Bit Re-Packing',
      description: `Assemble final 64-bit word: Sign bit (1), Biased Exponent (11), Mantissa (52).`,
      detail: `Final Binary: ${mul.resultIEEE.spacedBinary}\nFinal Hex: ${mul.resultIEEE.hexString}\nFinal Decimal: ${mul.resultIEEE.decimalVal}`,
      binaryVisualization: mul.resultIEEE.spacedBinary,
    });

    return {
      operandA: ieeeA,
      operandB: ieeeB,
      operation,
      resultIEEE: mul.resultIEEE,
      resultDecimalString: String(mul.resultIEEE.decimalVal),
      resultHexString: mul.resultIEEE.hexString,
      specialCase: mul.resultIEEE.specialCase,
      steps,
    };
  }
}
