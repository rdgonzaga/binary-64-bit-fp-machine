# Binary 64-bit Floating-Point Machine

[![Live Demo](https://img.shields.io/badge/Vercel-Live%20Demo-success?style=for-the-badge&logo=vercel)](https://binary-64-bit-fp-machine.vercel.app/)

An interactive, high-precision web application for **Machine 3: IEEE 754 Binary 64-Bit Double-Precision Floating-Point Architecture Visualization**. Access the live deployment at **[https://binary-64-bit-fp-machine.vercel.app/](https://binary-64-bit-fp-machine.vercel.app/)**.

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
- **Guard, Round, & Sticky (GRS) Logic**:
  - Exponent alignment & significand shifting
  - Explicit Guard ($G$), Round ($R$), and Sticky ($S$) bit calculation
  - Normalization, overflow/underflow checks, and final rounding
- **Detailed Step Breakdown**: Accordion step-by-step trace with binary shift visualizations.

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

## License

Created for CS ARCH2 / Architecture 3 coursework.
