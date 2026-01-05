/**
 * Formula Demo Page - Showcase untuk berbagai formula matematika dan cryptography
 * Menggunakan MathRenderer dan MathBlock untuk rendering KaTeX
 */

import React from 'react';
import { MathRenderer, MathBlock } from '../MathRenderer';
import { mathUtils, cryptoFormulas } from '../math-utils';

export function FormulaDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:bg-slate-950 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Mathematical Formula Showcase
          </h1>
          <p className="text-slate-400 text-lg">
            Professional rendering of cryptography and mathematics formulas for CTF write-ups
          </p>
        </div>

        {/* Basic Math Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-purple-300 mb-8 pb-4 border-b border-purple-500/30">
            📐 Basic Mathematics
          </h2>

          <div className="space-y-8">
            {/* Quadratic Formula */}
            <div>
              <h3 className="text-lg font-semibold text-purple-200 mb-4">Quadratic Formula</h3>
              <MathBlock
                title="Solving ax² + bx + c = 0"
                formula={mathUtils.fraction(
                  `-b \\pm ${mathUtils.sqrt('b^2 - 4ac')}`,
                  '2a'
                )}
                description="Standard quadratic formula for solving second-degree polynomial equations"
                variant="highlight"
              />
            </div>

            {/* Pythagorean Theorem */}
            <div>
              <h3 className="text-lg font-semibold text-purple-200 mb-4">Pythagorean Theorem</h3>
              <MathBlock
                title="Right Triangle Relationship"
                formula="a^2 + b^2 = c^2"
                description="Fundamental relationship in Euclidean geometry"
                variant="default"
              />
            </div>

            {/* Sum Notation */}
            <div>
              <h3 className="text-lg font-semibold text-purple-200 mb-4">Summation</h3>
              <MathBlock
                title="Sum of First N Natural Numbers"
                formula={mathUtils.sum('i=1', 'n', 'i')} 
                description={`Common example: ${mathUtils.sum('i=1', 'n', 'i')} = ${mathUtils.fraction('n(n+1)', '2')}`}
                variant="subtle"
              />
            </div>

            {/* Derivative */}
            <div>
              <h3 className="text-lg font-semibold text-purple-200 mb-4">Calculus</h3>
              <p className="text-slate-300 mb-4">
                The derivative <MathRenderer formula={mathUtils.derivative('f', 'x')} inline /> represents rate of change.
              </p>
              <MathBlock
                title="Derivative Definition"
                formula={`${mathUtils.derivative('f', 'x')} = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}`}
                description="Formal definition using limit"
                variant="default"
              />
            </div>
          </div>
        </section>

        {/* Modular Arithmetic Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-blue-300 mb-8 pb-4 border-b border-blue-500/30">
            🔢 Modular Arithmetic
          </h2>

          <div className="space-y-8">
            {/* Basic Modulo */}
            <div>
              <h3 className="text-lg font-semibold text-blue-200 mb-4">Modulo Operation</h3>
              <p className="text-slate-300 mb-4">
                Find remainder: <MathRenderer formula={mathUtils.mod('a', 'n')} inline />
              </p>
              <MathBlock
                title="Division with Remainder"
                formula="a = qn + r \\text{ where } 0 \\leq r < n"
                description="Any integer a can be expressed this way using divisor n"
                variant="default"
              />
            </div>

            {/* Congruence */}
            <div>
              <h3 className="text-lg font-semibold text-blue-200 mb-4">Modular Congruence</h3>
              <p className="text-slate-300 mb-4">
                Two numbers are congruent modulo n: <MathRenderer formula={mathUtils.equiv('a', 'b', 'n')} inline />
              </p>
              <MathBlock
                title="Definition"
                formula="a \\equiv b \\pmod{n} \\Leftrightarrow n \\mid (a - b)"
                description="a and b leave the same remainder when divided by n"
                variant="highlight"
              />
            </div>

            {/* Modular Arithmetic Properties */}
            <div>
              <h3 className="text-lg font-semibold text-blue-200 mb-4">Properties</h3>
              <div className="space-y-4">
                <MathBlock
                  title="Addition"
                  formula="a \\equiv b \\pmod{n} \\land c \\equiv d \\pmod{n} \\Rightarrow (a+c) \\equiv (b+d) \\pmod{n}"
                  variant="subtle"
                />
                <MathBlock
                  title="Multiplication"
                  formula="a \\equiv b \\pmod{n} \\land c \\equiv d \\pmod{n} \\Rightarrow ac \\equiv bd \\pmod{n}"
                  variant="subtle"
                />
                <MathBlock
                  title="Exponentiation"
                  formula="a \\equiv b \\pmod{n} \\Rightarrow a^k \\equiv b^k \\pmod{n}"
                  variant="subtle"
                />
              </div>
            </div>
          </div>
        </section>

        {/* RSA Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-red-300 mb-8 pb-4 border-b border-red-500/30">
            🔐 RSA Cryptography
          </h2>

          <div className="space-y-8">
            {/* Key Generation */}
            <div>
              <h3 className="text-lg font-semibold text-red-200 mb-4">Key Generation</h3>
              <div className="space-y-4">
                <MathBlock
                  title="Step 1: Choose Primes"
                  formula="p, q \\text{ are large primes}"
                  description="Select two distinct large prime numbers"
                  variant="default"
                />
                <MathBlock
                  title="Step 2: Compute Modulus"
                  formula={`n = ${mathUtils.inline('p')} \\times ${mathUtils.inline('q')}`}
                  description="Public modulus used in all operations"
                  variant="default"
                />
                <MathBlock
                  title="Step 3: Euler's Totient"
                  formula={`\\phi(n) = (p-1)(q-1)`}
                  description="Total count of integers less than n coprime to n"
                  variant="default"
                />
                <MathBlock
                  title="Step 4: Choose Public Exponent"
                  formula={`1 < e < \\phi(n) \\text{ and } \\gcd(e, \\phi(n)) = 1`}
                  description="Usually e = 65537 (common choice)"
                  variant="default"
                />
                <MathBlock
                  title="Step 5: Compute Private Exponent"
                  formula={`d \\equiv e^{-1} \\pmod{\\phi(n)}`}
                  description="Secret exponent, inverse of e modulo φ(n)"
                  variant="highlight"
                />
              </div>
            </div>

            {/* Encryption & Decryption */}
            <div>
              <h3 className="text-lg font-semibold text-red-200 mb-4">Encryption & Decryption</h3>
              <div className="space-y-4">
                <MathBlock
                  title="Public Key"
                  formula="(e, n)"
                  description="Shared with everyone"
                  variant="default"
                />
                <MathBlock
                  title="Private Key"
                  formula="(d, n)"
                  description="Kept secret"
                  variant="highlight"
                />
                <MathBlock
                  title="Encryption"
                  formula={cryptoFormulas.rsa.encryption}
                  description="Ciphertext from plaintext message m"
                  variant="default"
                />
                <MathBlock
                  title="Decryption"
                  formula={cryptoFormulas.rsa.decryption}
                  description="Recover plaintext from ciphertext c"
                  variant="default"
                />
              </div>
            </div>

            {/* Why RSA Works */}
            <div>
              <h3 className="text-lg font-semibold text-red-200 mb-4">Why It Works (Fermat's Little Theorem)</h3>
              <MathBlock
                title="Decryption Correctness"
                formula={`(m^e)^d \\equiv m^{ed} \\equiv m^{1 + k\\phi(n)} \\equiv m \\pmod{n}`}
                description="Because ed ≡ 1 (mod φ(n)) and by Euler's theorem"
                variant="highlight"
              />
            </div>
          </div>
        </section>

        {/* Diffie-Hellman Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-green-300 mb-8 pb-4 border-b border-green-500/30">
            🤝 Diffie-Hellman Key Exchange
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-green-200 mb-4">Setup</h3>
              <div className="space-y-4">
                <MathBlock
                  title="Public Parameters"
                  formula="p \\text{ (large prime)}, \\, g \\text{ (generator)}"
                  description="Known to both Alice and Bob"
                  variant="default"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-200 mb-4">Key Exchange Process</h3>
              <div className="space-y-4">
                <MathBlock
                  title="Alice's Secret"
                  formula="a \\text{ (random, secret)}"
                  variant="default"
                />
                <MathBlock
                  title="Alice's Public Value"
                  formula={cryptoFormulas.diffieHellman.publicKey}
                  description="Alice sends A to Bob (publicly)"
                  variant="default"
                />
                <MathBlock
                  title="Bob's Secret"
                  formula="b \\text{ (random, secret)}"
                  variant="default"
                />
                <MathBlock
                  title="Bob's Public Value"
                  formula="B = g^b \\bmod p"
                  description="Bob sends B to Alice (publicly)"
                  variant="default"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-200 mb-4">Shared Secret Calculation</h3>
              <div className="space-y-4">
                <MathBlock
                  title="Alice Computes"
                  formula="S = B^a \\bmod p = g^{ab} \\bmod p"
                  description="Using her secret a and Bob's public B"
                  variant="highlight"
                />
                <MathBlock
                  title="Bob Computes"
                  formula="S = A^b \\bmod p = g^{ab} \\bmod p"
                  description="Using his secret b and Alice's public A"
                  variant="highlight"
                />
                <p className="text-slate-300 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  ✨ Both arrive at the same shared secret <MathRenderer formula="S = g^{ab} \\bmod p" inline /> without ever transmitting a or b!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Elliptic Curve Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-cyan-300 mb-8 pb-4 border-b border-cyan-500/30">
            📈 Elliptic Curve Cryptography
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-cyan-200 mb-4">EC Definition</h3>
              <MathBlock
                title="Weierstrass Form"
                formula={cryptoFormulas.ecc.curve}
                description="Elliptic curve equation over prime field Fp"
                variant="highlight"
              />
              <p className="text-slate-400 text-sm mt-4">
                The curve consists of all points (x, y) satisfying the equation plus a special point at infinity.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-cyan-200 mb-4">Point Addition</h3>
              <MathBlock
                title="EC Point Addition Law"
                formula={cryptoFormulas.ecc.pointAddition}
                description="Adding two points on the curve via algebraic method"
                variant="default"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-cyan-200 mb-4">Scalar Multiplication</h3>
              <MathBlock
                title="Repeated Addition"
                formula="Q = k \\cdot P = \\underbrace{P + P + \\cdots + P}_{k \\text{ times}}"
                description="Efficient computation via binary method"
                variant="default"
              />
            </div>
          </div>
        </section>

        {/* ECDSA Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-pink-300 mb-8 pb-4 border-b border-pink-500/30">
            ✍️ ECDSA (Elliptic Curve Digital Signature Algorithm)
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-pink-200 mb-4">Signing</h3>
              <MathBlock
                title="Signature Generation"
                formula={cryptoFormulas.ecdsa.sign}
                description="r is x-coordinate of R, s is derived from message hash z"
                variant="highlight"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-pink-200 mb-4">Verification</h3>
              <MathBlock
                title="Signature Verification"
                formula={cryptoFormulas.ecdsa.verify}
                description="Verify signature using public key and message hash"
                variant="default"
              />
              <MathBlock
                title="Accept If"
                formula="r \\equiv x_1 \\pmod{n}"
                description="Signature is valid if r matches x-coordinate of computed point"
                variant="default"
              />
            </div>
          </div>
        </section>

        {/* Linear Congruential Generator */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-yellow-300 mb-8 pb-4 border-b border-yellow-500/30">
            🎲 Linear Congruential Generator (LCG)
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-yellow-200 mb-4">LCG Formula</h3>
              <MathBlock
                title="Recurrence Relation"
                formula="S_{i+1} = (A \\cdot S_i + B) \\bmod M"
                description="Generate pseudo-random sequence from seed S₀"
                variant="highlight"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-yellow-200 mb-4">Parameters</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <span className="text-yellow-400 font-semibold min-w-fit">S₀</span>
                  <span className="text-slate-300">Seed (initial value, secret)</span>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <span className="text-yellow-400 font-semibold min-w-fit">A</span>
                  <span className="text-slate-300">Multiplier (typically prime or ≡ 3,5 mod 8)</span>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <span className="text-yellow-400 font-semibold min-w-fit">B</span>
                  <span className="text-slate-300">Increment (typically odd)</span>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <span className="text-yellow-400 font-semibold min-w-fit">M</span>
                  <span className="text-slate-300">Modulus (typically 2³² or 2⁶⁴)</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-yellow-200 mb-4">Cryptographic Weakness</h3>
              <p className="text-slate-300 mb-4">
                LCG is NOT cryptographically secure. With enough output samples, an attacker can:
              </p>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start space-x-3">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span>Recover the internal state using lattice reduction (LLL algorithm)</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span>Predict future values from past outputs</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span>Break truncated versions using hidden number problem techniques</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* XOR Operations */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-orange-300 mb-8 pb-4 border-b border-orange-500/30">
            ⊕ XOR (Exclusive OR)
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-orange-200 mb-4">XOR Operation</h3>
              <MathBlock
                title="Definition"
                formula={`A \\oplus B = \\begin{cases} 1 & \\text{if } A \\neq B \\\\ 0 & \\text{if } A = B \\end{cases}`}
                variant="default"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-orange-200 mb-4">Properties</h3>
              <div className="space-y-4">
                <MathBlock
                  title="Commutative"
                  formula="A \\oplus B = B \\oplus A"
                  variant="subtle"
                />
                <MathBlock
                  title="Associative"
                  formula="(A \\oplus B) \\oplus C = A \\oplus (B \\oplus C)"
                  variant="subtle"
                />
                <MathBlock
                  title="Identity Element"
                  formula="A \\oplus 0 = A"
                  variant="subtle"
                />
                <MathBlock
                  title="Self-Inverse"
                  formula="A \\oplus A = 0 \\text{ and } A \\oplus B \\oplus B = A"
                  variant="subtle"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-orange-200 mb-4">Cryptographic Use</h3>
              <p className="text-slate-300 mb-4">
                XOR is used as the basis for stream ciphers:
              </p>
              <div className="space-y-4">
                <MathBlock
                  title="Stream Cipher Encryption"
                  formula="C = P \\oplus K"
                  description="Ciphertext = Plaintext ⊕ Keystream"
                  variant="default"
                />
                <MathBlock
                  title="Stream Cipher Decryption"
                  formula="P = C \\oplus K"
                  description="Plaintext = Ciphertext ⊕ Keystream (same operation!)"
                  variant="default"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Complex Example */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-violet-300 mb-8 pb-4 border-b border-violet-500/30">
            🔬 Complex Real-World Example
          </h2>

          <div className="space-y-8">
            <p className="text-slate-300 leading-relaxed">
              Consider a cryptographic protocol combining multiple concepts:
            </p>

            <div className="space-y-4">
              <MathBlock
                title="Step 1: Shared Secret via Diffie-Hellman"
                formula="K = g^{ab} \\bmod p"
                description="Both parties derive identical shared secret K"
                variant="default"
              />

              <MathBlock
                title="Step 2: Key Derivation"
                formula="K_i = H(K || i)"
                description="Generate multiple keys from single shared secret using hash function"
                variant="default"
              />

              <MathBlock
                title="Step 3: Encryption with XOR"
                formula="C = P \\oplus K_1"
                description="Encrypt plaintext using derived key via XOR"
                variant="default"
              />

              <MathBlock
                title="Step 4: Authentication with HMAC"
                formula="T = HMAC(K_2, C) = H((K_2 \\oplus \\text{opad}) || H((K_2 \\oplus \\text{ipad}) || C))"
                description="Provide authentication tag to ensure integrity"
                variant="default"
              />
            </div>

            <p className="text-slate-400 text-sm mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              💡 This demonstrates how mathematical components combine to build secure protocols. Understanding each piece is crucial for identifying vulnerabilities.
            </p>
          </div>
        </section>

        {/* Footer Note */}
        <div className="mt-20 p-6 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 rounded-xl border border-purple-500/20">
          <p className="text-slate-300 text-sm">
            <strong>Note:</strong> All formulas are rendered using KaTeX for professional mathematical typesetting. This styling is optimized for CTF write-ups, cryptography research, and technical documentation.
          </p>
        </div>
      </div>
    </div>
  );
}
