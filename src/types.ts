export type AppTab = 'welcome' | 'conversion' | 'rounding' | 'arithmetic';

export interface IEEE754Double {
  signBit: string;          // 1 bit
  exponentBits: string;     // 11 bits
  mantissaBits: string;     // 52 bits
  fullBinary: string;       // 64 bits
  spacedBinary: string;     // 1 10101010101 11001100...
  hexString: string;        // e.g. 0x40177082EFAC4240
  decimalVal: number;
  specialCase: string | null; // e.g. 'NaN', '+Infinity', '-Infinity', '+0', '-0', 'Subnormal'
  unbiasedExponent: number;
  biasedExponent: number;
  significandHex?: string;
}

export interface RoundingResult {
  chopping: string;
  roundUp: string;
  roundDown: string;
  tiesToEven: string;
  inputFormat: 'decimal' | 'binary';
  targetBits: number;
  descriptions: {
    chopping: string;
    roundUp: string;
    roundDown: string;
    tiesToEven: string;
  };
}

export interface ArithmeticStep {
  stepNumber: number;
  title: string;
  description: string;
  detail?: string;
  binaryVisualization?: string;
  grsStatus?: {
    guard: string;
    round: string;
    sticky: string;
  };
}

export interface ArithmeticResult {
  operandA: IEEE754Double;
  operandB: IEEE754Double;
  operation: '+' | '*';
  resultIEEE: IEEE754Double;
  resultDecimalString: string;
  resultHexString: string;
  specialCase: string | null;
  steps: ArithmeticStep[];
}
