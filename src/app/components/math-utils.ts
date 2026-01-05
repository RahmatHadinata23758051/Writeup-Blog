/**
 * Utility functions untuk formula matematika
 * Helper untuk simplify penggunaan MathRenderer
 */

export const mathUtils = {
  /**
   * Fractions - Pecahan
   * contoh: mathUtils.fraction('a', 'b') -> "\\frac{a}{b}"
   */
  fraction: (numerator: string, denominator: string): string => 
    `\\frac{${numerator}}{${denominator}}`,

  /**
   * Square root - Akar kuadrat
   * contoh: mathUtils.sqrt('x') -> "\\sqrt{x}"
   */
  sqrt: (value: string): string => `\\sqrt{${value}}`,

  /**
   * Power/Exponent - Pangkat
   * contoh: mathUtils.power('a', 'b') -> "a^b"
   */
  power: (base: string, exponent: string): string => `${base}^${exponent}`,

  /**
   * Subscript - Indeks bawah
   * contoh: mathUtils.subscript('x', '1') -> "x_1"
   */
  subscript: (base: string, index: string): string => `${base}_{${index}}`,

  /**
   * Modulo - Sisa bagi
   * contoh: mathUtils.mod('a', 'b') -> "a \\bmod b"
   */
  mod: (value: string, divisor: string): string => `${value} \\bmod ${divisor}`,

  /**
   * Congruent - Kongruen (untuk modulo)
   * contoh: mathUtils.equiv('a', 'b', 'n') -> "a \\equiv b \\pmod{n}"
   */
  equiv: (left: string, right: string, modulo: string): string => 
    `${left} \\equiv ${right} \\pmod{${modulo}}`,

  /**
   * XOR - Operasi XOR
   * contoh: mathUtils.xor('a', 'b') -> "a \\oplus b"
   */
  xor: (left: string, right: string): string => `${left} \\oplus ${right}`,

  /**
   * Matrix
   * contoh: mathUtils.matrix([['a', 'b'], ['c', 'd']]) -> "\\begin{matrix}a&b\\\\c&d\\end{matrix}"
   */
  matrix: (values: string[][]): string => {
    const rows = values.map(row => row.join('&')).join('\\\\');
    return `\\begin{matrix}${rows}\\end{matrix}`;
  },

  /**
   * Sum - Notasi sigma
   * contoh: mathUtils.sum('i=1', 'n', 'x_i') -> "\\sum_{i=1}^{n}x_i"
   */
  sum: (lower: string, upper: string, expression: string): string => 
    `\\sum_{${lower}}^{${upper}}${expression}`,

  /**
   * Product - Notasi pi
   * contoh: mathUtils.product('i=1', 'n', 'x_i') -> "\\prod_{i=1}^{n}x_i"
   */
  product: (lower: string, upper: string, expression: string): string => 
    `\\prod_{${lower}}^{${upper}}${expression}`,

  /**
   * Integral
   * contoh: mathUtils.integral('a', 'b', 'f(x)', 'dx') -> "\\int_a^b f(x) dx"
   */
  integral: (lower: string, upper: string, expression: string, variable: string = 'dx'): string => 
    `\\int_{${lower}}^{${upper}}${expression} ${variable}`,

  /**
   * Derivative
   * contoh: mathUtils.derivative('f', 'x') -> "\\frac{df}{dx}"
   */
  derivative: (numerator: string = 'f', denominator: string = 'x'): string => 
    `\\frac{d${numerator}}{d${denominator}}`,

  /**
   * Absolute value / Norm
   * contoh: mathUtils.abs('x') -> "\\left|x\\right|"
   */
  abs: (value: string): string => `\\left|${value}\\right|`,

  /**
   * Set notation
   * contoh: mathUtils.set('x \\in \\mathbb{R}') -> "\\{x \\in \\mathbb{R}\\}"
   */
  set: (notation: string): string => `\\{${notation}\\}`,

  /**
   * Binomial coefficient
   * contoh: mathUtils.binom('n', 'k') -> "\\binom{n}{k}"
   */
  binom: (n: string, k: string): string => `\\binom{${n}}{${k}}`,

  /**
   * Right arrow / implies
   * contoh: mathUtils.implies('A', 'B') -> "A \\Rightarrow B"
   */
  implies: (left: string, right: string): string => `${left} \\Rightarrow ${right}`,

  /**
   * If and only if
   * contoh: mathUtils.iff('A', 'B') -> "A \\Leftrightarrow B"
   */
  iff: (left: string, right: string): string => `${left} \\Leftrightarrow ${right}`,

  /**
   * For all
   * contoh: mathUtils.forall('x', 'P(x)') -> "\\forall x : P(x)"
   */
  forall: (variable: string, expression: string): string => 
    `\\forall ${variable} : ${expression}`,

  /**
   * There exists
   * contoh: mathUtils.exists('x', 'P(x)') -> "\\exists x : P(x)"
   */
  exists: (variable: string, expression: string): string => 
    `\\exists ${variable} : ${expression}`,

  /**
   * GCD - Greatest Common Divisor
   * contoh: mathUtils.gcd('a', 'b') -> "\\gcd(a, b)"
   */
  gcd: (left: string, right: string): string => `\\gcd(${left}, ${right})`,

  /**
   * LCM - Least Common Multiple
   * contoh: mathUtils.lcm('a', 'b') -> "\\text{lcm}(a, b)"
   */
  lcm: (left: string, right: string): string => `\\text{lcm}(${left}, ${right})`,

  /**
   * BigO Notation
   * contoh: mathUtils.bigO('n^2') -> "O(n^2)"
   */
  bigO: (complexity: string): string => `O(${complexity})`,

  /**
   * Log notation
   * contoh: mathUtils.log('x', '2') -> "\\log_2 x"
   */
  log: (value: string, base?: string): string => 
    base ? `\\log_{${base}} ${value}` : `\\log ${value}`,

  /**
   * Natural log
   * contoh: mathUtils.ln('x') -> "\\ln x"
   */
  ln: (value: string): string => `\\ln ${value}`,

  /**
   * Inline expression - untuk display inline
   * Tidak mengubah formula, hanya helper untuk clarity
   */
  inline: (formula: string): string => formula,

  /**
   * Display expression - untuk display block
   * Tidak mengubah formula, hanya helper untuk clarity
   */
  display: (formula: string): string => formula,
};

/**
 * Common crypto formulas helper
 */
export const cryptoFormulas = {
  // RSA
  rsa: {
    encryption: 'c \\equiv m^e \\pmod{n}',
    decryption: 'm \\equiv c^d \\pmod{n}',
    keyGeneration: 'n = p \\times q, \\quad \\phi(n) = (p-1)(q-1)',
  },

  // AES
  aes: {
    keySchedule: 'W[i] = W[i-4] \\oplus SubWord(RotWord(W[i-1])) \\oplus Rcon[i/4]',
    addRoundKey: 'State \\oplus RoundKey',
  },

  // Diffie-Hellman
  diffieHellman: {
    publicKey: 'A = g^a \\bmod p',
    sharedSecret: 'S = B^a \\bmod p = g^{ab} \\bmod p',
  },

  // SHA
  sha256: {
    compression: 'T = (A + F(B, C, D) + X_i + K) \\text{ ROL } s',
  },

  // ECC
  ecc: {
    curve: 'y^2 = x^3 + ax + b \\pmod{p}',
    pointAddition: 'P + Q = R \\text{ where } m = \\frac{y_2 - y_1}{x_2 - x_1} \\pmod{p}',
  },

  // ECDSA
  ecdsa: {
    sign: 'r = x_1 \\bmod n, \\quad s = k^{-1}(z + r \\cdot d_A) \\bmod n',
    verify: 'w = s^{-1} \\bmod n, \\quad u_1 = zw \\bmod n, \\quad u_2 = rw \\bmod n',
  },

  // Hash
  hash: {
    collision: 'H(x_1) = H(x_2) \\text{ where } x_1 \\neq x_2',
    preimage: 'y = H(x)',
  },
};
