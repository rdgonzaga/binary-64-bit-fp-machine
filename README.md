# Binary 64-bit Floating-Point Machine

An interactive, high-precision web application for **Machine 3: IEEE 754 Binary 64-Bit Double-Precision Floating-Point Architecture Visualization**.

Click here for the **[Live Deployment](https://binary-64-bit-fp-machine.vercel.app/)**, and click here for the **[Youtube Video Walkthrough](https://www.youtube.com/watch?v=lVyBRyUnwGo)**

---

## Features

### 1. Conversion Module (IEEE 754 Double-Precision)
- **Input Formats**: Accepts decimal floating-point numbers or 16-character hexadecimal values (e.g. `5.8598744`, `0x40177082EFAC4240`, `NaN`, `Infinity`).
- **Bit Breakdown**: Displays exact field allocation:
  - **Sign (1 bit)**
  - **Exponent (11 bits)** with biased ($E$) and unbiased ($e$) values
  - **Mantissa / Fraction (52 bits)**
- **Format Outputs**: Spaced binary representation and hexadecimal memory format.
- **Scroll-Free Layout**: Responsive wrapped 4-bit nibble formatting guarantees no horizontal scrolling.

### 2. Rounding Demonstrator
- **Input Modes**: Accepts either Decimal ($0-9$) or Binary ($0s$ and $1s$ only) inputs.
- **Target Precision**: Custom target bit or digit limits ($1$ to $52$).
- **Four Standard Methods**:
  - **Chopping** (Truncation toward zero)
  - **Round-Up** (Toward $+\infty$)
  - **Round-Down** (Toward $-\infty$)
  - **Round-to-Nearest (Ties-to-Even)** (Standard IEEE 754 default)

### 3. Step-by-Step GRS Arithmetic Module
- **Operations**: Floating-Point Addition ($+$) and Multiplication ($*$).
- **Input Formats**: Decimal or 16-character hexadecimal operands.
- **Guard, Round, & Sticky (GRS) Logic**: the displayed result is derived bit-for-bit from this pipeline, not shortcut to native arithmetic:
  - Exponent alignment & significand shifting
  - Explicit Guard ($G$), Round ($R$), and Sticky ($S$) bit calculation
  - Normalization (carry-out / cancellation), overflow/underflow checks, and final round-to-nearest-ties-to-even rounding
- **Detailed Step Breakdown**: Accordion step-by-step trace with binary shift visualizations.

---

## Testing

Each module was exercised against normal, special-case (`NaN`, `±Infinity`, `±0`, subnormal), overflow/underflow, and mixed decimal/hex inputs. Screenshots are stored in [`public/screenshots/`](public/screenshots/) and demonstrated live in the video walkthrough linked at the top of this README.

### Conversion

- **Normal decimal input**

  <img src="public/screenshots/conversion-decimal.png" width="700" alt="Conversion: normal decimal input">

- **Normal hexadecimal input**

  <img src="public/screenshots/conversion-hex.png" width="700" alt="Conversion: normal hexadecimal input">

- **NaN**

  <img src="public/screenshots/conversion-nan.png" width="700" alt="Conversion: NaN">

- **+Infinity**

  <img src="public/screenshots/conversion-inf-pos.png" width="700" alt="Conversion: +Infinity">

- **-Infinity**

  <img src="public/screenshots/conversion-inf-neg.png" width="700" alt="Conversion: -Infinity">

- **+0**

  <img src="public/screenshots/conversion-zero-pos.png" width="700" alt="Conversion: +0">

- **-0**

  <img src="public/screenshots/conversion-zero-neg.png" width="700" alt="Conversion: -0">

- **Subnormal (denormalized)**

  <img src="public/screenshots/conversion-subnormal.png" width="700" alt="Conversion: subnormal denormalized value">

### Rounding Demonstrator

- **Binary input, non-tie case**

  <img src="public/screenshots/rounding-binary-non.png" width="700" alt="Rounding: binary input, non-tie case">

- **Binary input, exact-tie case (ties-to-even)**

  <img src="public/screenshots/rounding-binary-exact1.png" width="700" alt="Rounding: binary input, exact tie, LSB odd rounds up">

  <img src="public/screenshots/rounding-binary-exact2.png" width="700" alt="Rounding: binary input, exact tie, LSB even stays">

- **Decimal input, non-tie case**

  <img src="public/screenshots/rounding-decimal-non.png" width="700" alt="Rounding: decimal input, non-tie case">

- **Decimal input, exact-tie case (ties-to-even)**

  <img src="public/screenshots/rounding-decimal-exact1.png" width="700" alt="Rounding: decimal input, exact tie, last kept digit even stays">

  <img src="public/screenshots/rounding-decimal-exact2.png" width="700" alt="Rounding: decimal input, exact tie, last kept digit odd rounds up">

- **Negative input**

  <img src="public/screenshots/rounding-decimal-neg.png" width="700" alt="Rounding: negative decimal input">

### GRS Arithmetic

- **Addition, decimal operands, normal range**

  <img src="public/screenshots/arithmetic-add-decimal-normal.png" width="700" alt="Arithmetic: addition, decimal operands, normal range">

- **Addition, hexadecimal operands, normal range**

  <img src="public/screenshots/arithmetic-add-hex-normal.png" width="700" alt="Arithmetic: addition, hexadecimal operands, normal range">

- **Addition producing an exact tie (G=1, R=0, S=0)**

  <img src="public/screenshots/arithmetic-add-exact.png" width="700" alt="Arithmetic: addition producing an exact tie">

- **Addition with catastrophic cancellation (near-equal operands, opposite signs)**

  <img src="public/screenshots/arithmetic-catastrophic.png" width="700" alt="Arithmetic: addition with catastrophic cancellation">

- **Multiplication, decimal operands, normal range**

  <img src="public/screenshots/arithmetic-multi-decimal-normal.png" width="700" alt="Arithmetic: multiplication, decimal operands, normal range">

- **Multiplication, hexadecimal operands, normal range**

  <img src="public/screenshots/arithmetic-multi-hex-normal.png" width="700" alt="Arithmetic: multiplication, hexadecimal operands, normal range">

- **Overflow to `Infinity`**

  <img src="public/screenshots/arithmetic-overflow-inf.png" width="700" alt="Arithmetic: overflow to Infinity">

- **Underflow to subnormal/zero**

  <img src="public/screenshots/arithmetic-underflow-inf.png" width="700" alt="Arithmetic: underflow to subnormal">

- **One operand is `NaN` / `Infinity` / `0`**

  <img src="public/screenshots/arithmetic-nan.png" width="700" alt="Arithmetic: one operand is NaN">

---

## Tech Stack

- **Framework**: React 19 + Vite 6
- **Styling**: Tailwind CSS v4
- **Typography**: Google Fonts (DM Mono)
- **Deployment**: Vercel (pre-configured via `vercel.json`)

---

## Local Development

### Prerequisites
- Node.js (v18 or higher)
- npm / pnpm / yarn

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/rdgonzaga/binary-64-bit-fp-machine.git
   cd binary-64-bit-fp-machine
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

---

## Group Members

- Rainer Gonzaga
- Aaron James Gonzales
- Kennese Ross Manalang
- Duncan Joseph Marcaida
- Richmond Jose Ramos