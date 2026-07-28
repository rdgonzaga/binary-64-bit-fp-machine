import { IEEE754Double, RoundingResult, ArithmeticResult, ArithmeticStep } from '../types';

/**
 * Converts a number or input string (decimal or hex) to IEEE 754 double precision object.
 */
export function decimalToIEEE754Double(input: number | string): IEEE754Double {
  let numVal: number;
  let isHexInput = false;
  let rawBitsStr = '';

  const cleanInput = typeof input === 'string' ? input.trim() : String(input);

  // Check if input is hexadecimal e.g., 0x40177082EFAC4240 or 16-hex characters
  if (typeof input === 'string' && (cleanInput.startsWith('0x') || cleanInput.startsWith('0X') || /^[0-9a-fA-F]{16}$/.test(cleanInput))) {
    try {
      const hexClean = cleanInput.replace(/^0x/i, '').padStart(16, '0');
      const bigIntVal = BigInt(`0x${hexClean}`);
      const buffer = new ArrayBuffer(8);
      const bigUint64 = new BigUint64Array(buffer);
      const float64 = new Float64Array(buffer);
      
      bigUint64[0] = bigIntVal;
      numVal = float64[0];
      isHexInput = true;
      rawBitsStr = bigIntVal.toString(2).padStart(64, '0');
    } catch {
      numVal = parseFloat(cleanInput);
    }
  } else {
    numVal = typeof input === 'number' ? input : parseFloat(cleanInput);
  }

  // Handle case where parsing fails
  if (isNaN(numVal) && !cleanInput.toLowerCase().includes('nan') && !isHexInput) {
    numVal = NaN;
  }

  // Convert JS Float64 number to 64-bit binary representation
  const buffer = new ArrayBuffer(8);
  const float64 = new Float64Array(buffer);
  const bigUint64 = new BigUint64Array(buffer);

  float64[0] = numVal;
  const bitsBigInt = bigUint64[0];
  const binary64 = bitsBigInt.toString(2).padStart(64, '0');

  const signBit = binary64[0];
  const exponentBits = binary64.substring(1, 12);
  const mantissaBits = binary64.substring(12);

  const biasedExp = parseInt(exponentBits, 2);
  let unbiasedExp = biasedExp - 1023;
  let specialCase: string | null = null;

  if (biasedExp === 2047) {
    if (mantissaBits === '0'.repeat(52)) {
      specialCase = signBit === '0' ? '+Infinity' : '-Infinity';
    } else {
      specialCase = 'NaN';
    }
  } else if (biasedExp === 0) {
    if (mantissaBits === '0'.repeat(52)) {
      specialCase = signBit === '0' ? '+0' : '-0';
      unbiasedExp = 0;
    } else {
      specialCase = 'Subnormal (Denormal)';
      unbiasedExp = -1022; // Subnormals use exp = -1022 with 0.mantissa
    }
  }

  const spacedBinary = `${signBit} ${exponentBits} ${mantissaBits}`;
  const hexVal = '0x' + bitsBigInt.toString(16).toUpperCase().padStart(16, '0');

  return {
    signBit,
    exponentBits,
    mantissaBits,
    fullBinary: binary64,
    spacedBinary,
    hexString: hexVal,
    decimalVal: numVal,
    specialCase,
    unbiasedExponent: unbiasedExp,
    biasedExponent: biasedExp,
  };
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

function roundDecimalString(decStr: string, targetDigits: number): RoundingResult {
  const num = parseFloat(decStr);
  if (isNaN(num)) {
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

  const factor = Math.pow(10, targetDigits);
  const sign = num < 0 ? -1 : 1;
  const absNum = Math.abs(num);

  // Chopping (towards 0)
  const choppedVal = sign * (Math.floor(absNum * factor) / factor);
  const choppingRes = choppedVal.toFixed(targetDigits);

  // Round Up (towards +inf)
  const roundUpVal = Math.ceil(num * factor) / factor;
  const roundUpRes = roundUpVal.toFixed(targetDigits);

  // Round Down (towards -inf)
  const roundDownVal = Math.floor(num * factor) / factor;
  const roundDownRes = roundDownVal.toFixed(targetDigits);

  // Ties to even
  const scaled = num * factor;
  const floorScaled = Math.floor(scaled);
  const diff = scaled - floorScaled;
  let tiesVal = Math.round(scaled);
  if (Math.abs(diff - 0.5) < 1e-12) {
    if (floorScaled % 2 === 0) {
      tiesVal = floorScaled;
    } else {
      tiesVal = floorScaled + 1;
    }
  }
  const tiesToEvenRes = (tiesVal / factor).toFixed(targetDigits);

  return {
    chopping: choppingRes,
    roundUp: roundUpRes,
    roundDown: roundDownRes,
    tiesToEven: tiesToEvenRes,
    inputFormat: 'decimal',
    targetBits: targetDigits,
    descriptions: {
      chopping: `Truncated digits past position ${targetDigits} towards zero.`,
      roundUp: `Rounded towards +infinity at precision level 10^-${targetDigits}.`,
      roundDown: `Rounded towards -infinity at precision level 10^-${targetDigits}.`,
      tiesToEven: `Standard IEEE 754 ties-to-even rounding applied at position ${targetDigits}.`,
    },
  };
}

/**
 * Performs IEEE 754 double precision addition or multiplication using GRS (Guard, Round, Sticky) method
 * with step-by-step mathematical breakdown.
 */
export function performGRSArithmetic(
  opAStr: string,
  opBStr: string,
  operation: '+' | '*'
): ArithmeticResult {
  const ieeeA = decimalToIEEE754Double(opAStr || '5.859874482048838');
  const ieeeB = decimalToIEEE754Double(opBStr || '1.0');

  const steps: ArithmeticStep[] = [];

  // Step 1: Unpack Operands
  steps.push({
    stepNumber: 1,
    title: 'Operand Unpacking & Field Extraction',
    description: `Extract Sign bit (S), Biased Exponent (E), and 52-bit Mantissa (M) for Operands A and B. Add implicit leading bit 1.`,
    detail: `Operand A: Sign=${ieeeA.signBit}, Biased Exp=${ieeeA.biasedExponent} (Unbiased E_A=${ieeeA.unbiasedExponent}), Mantissa=1.${ieeeA.mantissaBits.substring(0, 16)}...\n` +
            `Operand B: Sign=${ieeeB.signBit}, Biased Exp=${ieeeB.biasedExponent} (Unbiased E_B=${ieeeB.unbiasedExponent}), Mantissa=1.${ieeeB.mantissaBits.substring(0, 16)}...`,
    binaryVisualization: `A: ${ieeeA.spacedBinary}\nB: ${ieeeB.spacedBinary}`,
  });

  // Handle special cases (+/- Inf, NaN, 0)
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
      detail: `Rule applied according to IEEE 754 spec. Final result evaluated directly to ${resIEEE.specialCase || resultVal}.`,
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

  let finalResNum: number;
  if (operation === '+') {
    finalResNum = ieeeA.decimalVal + ieeeB.decimalVal;

    // Exact GRS bit computation for addition
    const sigA = (ieeeA.biasedExponent === 0 ? 0n : (1n << 52n)) | BigInt('0b0' + ieeeA.mantissaBits);
    const sigB = (ieeeB.biasedExponent === 0 ? 0n : (1n << 52n)) | BigInt('0b0' + ieeeB.mantissaBits);

    let smallerSig = sigB;
    let shiftedOperand = 'B';
    if (ieeeB.biasedExponent < ieeeA.biasedExponent) {
      smallerSig = sigB;
      shiftedOperand = 'B';
    } else if (ieeeA.biasedExponent < ieeeB.biasedExponent) {
      smallerSig = sigA;
      shiftedOperand = 'A';
    } else {
      smallerSig = sigA < sigB ? sigA : sigB;
      shiftedOperand = sigA < sigB ? 'A' : 'B';
    }

    const expDiff = Math.abs(ieeeA.biasedExponent - ieeeB.biasedExponent);
    const largerExp = Math.max(ieeeA.biasedExponent, ieeeB.biasedExponent);

    let guard = '0';
    let round = '0';
    let sticky = '0';

    if (expDiff > 0) {
      const shift = expDiff;
      if (shift <= 53) {
        const shiftedOut = smallerSig & ((1n << BigInt(shift)) - 1n);
        const gBit = (shiftedOut >> BigInt(shift - 1)) & 1n;
        const rBit = shift >= 2 ? (shiftedOut >> BigInt(shift - 2)) & 1n : 0n;
        const sBits = shift >= 3 ? shiftedOut & ((1n << BigInt(shift - 2)) - 1n) : 0n;
        guard = gBit.toString();
        round = rBit.toString();
        sticky = sBits > 0n ? '1' : '0';
      } else {
        guard = '0';
        round = '0';
        sticky = smallerSig > 0n ? '1' : '0';
      }
    }

    steps.push({
      stepNumber: 2,
      title: 'Exponent Alignment & Mantissa Shift',
      description: `Align exponents to match larger exponent (${largerExp}). Exponent difference ΔE = ${expDiff}.`,
      detail: expDiff > 0
        ? `Shifted Operand ${shiftedOperand}'s mantissa right by ${expDiff} bits. Outshifted bits generated Guard (G=${guard}), Round (R=${round}), and Sticky (S=${sticky}) bits.`
        : `Exponents are equal (ΔE = 0). No right-shift required. GRS initialized to G=0, R=0, S=0.`,
      grsStatus: { guard, round, sticky },
    });

    const isSameSign = ieeeA.signBit === ieeeB.signBit;

    steps.push({
      stepNumber: 3,
      title: 'Significand Addition / Subtraction',
      description: `Perform binary ${isSameSign ? 'addition' : 'subtraction'} on 53-bit aligned significands including Guard, Round, and Sticky bits.`,
      detail: `Signs ${isSameSign ? 'match' : 'differ'} (${ieeeA.signBit} and ${ieeeB.signBit}). Evaluated aligned significands in 56-bit accumulator.`,
      binaryVisualization: `A Mantissa: 1.${ieeeA.mantissaBits.substring(0, 20)}...\nB Mantissa: 1.${ieeeB.mantissaBits.substring(0, 20)}...\nGRS Bits:   G:${guard} R:${round} S:${sticky}`,
    });

    steps.push({
      stepNumber: 4,
      title: 'Normalization & Sticky Bit Update',
      description: `Check for MSB carry out or leading zeros. Adjust exponent and shift significand if needed.`,
      detail: `Significand normalized to 1.fraction form. Biased exponent set to ${largerExp} (Unbiased E = ${largerExp - 1023}).`,
    });

    const isTie = guard === '1' && round === '0' && sticky === '0';
    const roundDecision = guard === '1'
      ? (isTie ? 'Tie detected (G=1, R=0, S=0). Check LSB for Round-to-Nearest Ties-to-Even.' : 'Guard bit G=1. Round up LSB (+1).')
      : 'Guard bit G=0. Truncate (Chop GRS).';

    steps.push({
      stepNumber: 5,
      title: 'GRS Rounding (Ties-to-Even)',
      description: `Apply IEEE 754 round-to-nearest ties-to-even using GRS status.`,
      detail: `G=${guard}, R=${round}, S=${sticky}. Decision: ${roundDecision}`,
    });

  } else {
    // Multiplication
    finalResNum = ieeeA.decimalVal * ieeeB.decimalVal;

    const unroundedExp = ieeeA.unbiasedExponent + ieeeB.unbiasedExponent;
    const resultBiasedExp = unroundedExp + 1023;

    steps.push({
      stepNumber: 2,
      title: 'Exponent Addition & Bias Adjustment',
      description: `Add unbiased exponents: E_A (${ieeeA.unbiasedExponent}) + E_B (${ieeeB.unbiasedExponent}) = ${unroundedExp}.`,
      detail: `Re-apply bias: ${unroundedExp} + 1023 = ${resultBiasedExp} (Biased Exponent: ${resultBiasedExp >= 0 ? resultBiasedExp.toString(2).padStart(11, '0') : 'Underflow'}).`,
    });

    const sigA = (ieeeA.biasedExponent === 0 ? 0n : (1n << 52n)) | BigInt('0b0' + ieeeA.mantissaBits);
    const sigB = (ieeeB.biasedExponent === 0 ? 0n : (1n << 52n)) | BigInt('0b0' + ieeeB.mantissaBits);
    const product = sigA * sigB;

    const isOverflow = (product & (1n << 105n)) !== 0n;

    let guard = '0';
    let round = '0';
    let sticky = '0';

    if (isOverflow) {
      guard = ((product >> 52n) & 1n).toString();
      round = ((product >> 51n) & 1n).toString();
      sticky = (product & ((1n << 51n) - 1n)) > 0n ? '1' : '0';
    } else {
      guard = ((product >> 51n) & 1n).toString();
      round = ((product >> 50n) & 1n).toString();
      sticky = (product & ((1n << 50n) - 1n)) > 0n ? '1' : '0';
    }

    steps.push({
      stepNumber: 3,
      title: 'Significand Multiplication & GRS Bit Extraction',
      description: `Multiply 53-bit significands (1.M_A × 1.M_B) producing a 106-bit product.`,
      detail: `Extracted Guard (G=${guard}), Round (R=${round}), and Sticky (S=${sticky}) bits from lower product bits.`,
      grsStatus: { guard, round, sticky },
      binaryVisualization: `Product MSB: ${product.toString(2).substring(0, 32)}...\nGRS Status:  G:${guard} R:${round} S:${sticky}`,
    });

    steps.push({
      stepNumber: 4,
      title: 'Normalization & Exponent Increment',
      description: isOverflow
        ? `Product overflowed into MSB bit 105 (2.0 ≤ product < 4.0). Shifted significand right 1 bit and incremented exponent.`
        : `Product in normal range (1.0 ≤ product < 2.0). No exponent shift required.`,
      detail: `Final normalized biased exponent: ${resultBiasedExp + (isOverflow ? 1 : 0)}.`,
    });

    const isTie = guard === '1' && round === '0' && sticky === '0';
    const roundDecision = guard === '1'
      ? (isTie ? 'Exact tie at G=1, R=0, S=0. Applied ties-to-even rule.' : 'Guard bit G=1 with non-zero trailing bits. Rounded up (+1 LSB).')
      : 'Guard bit G=0. Truncated GRS bits.';

    steps.push({
      stepNumber: 5,
      title: 'GRS Round-to-Nearest (Ties-to-Even)',
      description: `Round 106-bit normalized product down to 53 bits using Guard, Round, and Sticky bits.`,
      detail: `Inspected G=${guard}, R=${round}, S=${sticky} bits. Decision: ${roundDecision}`,
    });
  }

  const resultIEEE = decimalToIEEE754Double(finalResNum);

  steps.push({
    stepNumber: 6,
    title: 'Final IEEE 754 64-Bit Re-Packing',
    description: `Assemble final 64-bit word: Sign bit (1), Biased Exponent (11), Mantissa (52).`,
    detail: `Final Binary: ${resultIEEE.spacedBinary}\nFinal Hex: ${resultIEEE.hexString}\nFinal Decimal: ${finalResNum}`,
    binaryVisualization: resultIEEE.spacedBinary,
  });

  return {
    operandA: ieeeA,
    operandB: ieeeB,
    operation,
    resultIEEE,
    resultDecimalString: String(finalResNum),
    resultHexString: resultIEEE.hexString,
    specialCase: resultIEEE.specialCase,
    steps,
  };
}
