import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MathBlock, MathRenderer } from '../MathRenderer';
import { BsArrowRight, BsCheck, BsX, BsArrowLeft } from 'react-icons/bs';

interface ShawWriteUpProps {
  onBack?: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-700/50 dark:border-slate-600/30 rounded-lg overflow-hidden bg-slate-900/30 dark:bg-slate-950/30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 dark:hover:bg-slate-900/50 transition-colors"
      >
        <h3 className="text-sm font-semibold text-slate-100 dark:text-slate-200">{title}</h3>
        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="px-6 py-4 border-t border-slate-700/30 dark:border-slate-700/20 bg-slate-950/50 dark:bg-black/20">
          {children}
        </div>
      )}
    </div>
  );
};

export const ShawWriteUp: React.FC<ShawWriteUpProps> = ({ onBack }) => {
  const flag = "INTECHFEST{964114fd72f319375a5c7fb3081a02b7}";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950 text-slate-100">
      {/* Header - Static, not sticky */}
      <div className="bg-gradient-to-r from-purple-900/20 via-slate-900/20 to-blue-900/20 border-b border-purple-500/20 px-6 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {onBack && (
            <Button
              onClick={onBack}
              variant="ghost"
              className="mb-4 -ml-2 text-slate-400 hover:text-slate-200 h-8"
            >
              <BsArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                Shaw
              </h1>
              <p className="text-slate-400 text-sm md:text-base">ElGamal + LCG Attack with Pohlig-Hellman & LLL</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-start md:justify-end">
              <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/50 text-xs">Cryptography</Badge>
              <Badge className="bg-red-500/20 text-red-300 border border-red-500/50 text-xs">Hard</Badge>
              <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/50 text-xs">LLL Attack</Badge>
            </div>
          </div>

          {/* Challenge Metadata - More compact */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-slate-900/50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-700/30">
              <p className="text-slate-400 text-xs uppercase tracking-wide">Event</p>
              <p className="text-purple-300 font-semibold text-sm mt-1">INTECHFEST</p>
            </div>
            <div className="bg-slate-900/50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-700/30">
              <p className="text-slate-400 text-xs uppercase tracking-wide">Category</p>
              <p className="text-blue-300 font-semibold text-sm mt-1">Crypto</p>
            </div>
            <div className="bg-slate-900/50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-700/30">
              <p className="text-slate-400 text-xs uppercase tracking-wide">Difficulty</p>
              <p className="text-red-300 font-semibold text-sm mt-1">★★★★★</p>
            </div>
            <div className="bg-slate-900/50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-700/30">
              <p className="text-slate-400 text-xs uppercase tracking-wide">Author</p>
              <p className="text-emerald-300 font-semibold text-sm mt-1">CTF Team</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Overview Section */}
          <CollapsibleSection title="Challenge Overview" defaultOpen={true}>
            <div className="space-y-6">
              <div>
                <h4 className="text-slate-200 font-semibold mb-3 text-lg">Challenge Description</h4>
                <p className="text-slate-300 leading-relaxed">
                  This challenge presents a server running <strong>ElGamal encryption</strong> over a <strong>Linear Congruential Generator (LCG)</strong> for random number generation. The server uses a 512-bit prime modulus that we can control, and we must recover both the initial seed and a secret constant used in the LCG.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/30">
                  <h5 className="text-purple-300 font-semibold mb-3 flex items-center gap-2">
                    <BsCheck className="text-green-400" /> Key Components
                  </h5>
                  <ul className="space-y-2 text-slate-300 text-sm">
                    <li>• ElGamal encryption with $(P, G, Y)$ keypair</li>
                    <li>• Custom 512-bit prime selection</li>
                    <li>• Truncated LCG for randomness</li>
                    <li>• 256-bit output truncation with XOR</li>
                  </ul>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/30">
                  <h5 className="text-blue-300 font-semibold mb-3 flex items-center gap-2">
                    <BsArrowRight className="text-blue-400" /> Attack Strategy
                  </h5>
                  <ul className="space-y-2 text-slate-300 text-sm">
                    <li>• Send smooth prime (Pohlig-Hellman)</li>
                    <li>• Extract LCG values via discrete log</li>
                    <li>• Apply LLL lattice reduction</li>
                    <li>• Verify and recover secret seed</li>
                  </ul>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Vulnerabilities Section */}
          <CollapsibleSection title="Vulnerabilities Breakdown">
            <div className="space-y-6">
              <div className="bg-slate-900/50 p-6 rounded-lg border border-orange-500/30 border-l-4 border-l-orange-500">
                <h4 className="text-orange-300 font-semibold mb-3 text-lg">1. Weak Prime Selection (Pohlig-Hellman Ready)</h4>
                <p className="text-slate-300 leading-relaxed mb-4">
                  The server accepts any prime <span className="text-purple-300">P</span> from the client. If we send a "smooth" prime where <span className="text-purple-300">P-1</span> has only small prime factors, the Discrete Logarithm Problem (DLP) becomes tractable via the Pohlig-Hellman algorithm.
                </p>
                <div className="bg-slate-950/50 p-3 rounded font-mono text-sm text-slate-400 overflow-x-auto">
                  P = 2 × 3 × 5 × 7 × 11 × ... (product of small primes) + 1
                </div>
              </div>

              <div className="bg-slate-900/50 p-6 rounded-lg border border-red-500/30 border-l-4 border-l-red-500">
                <h4 className="text-red-300 font-semibold mb-3 text-lg">2. Truncated LCG with Known Structure</h4>
                <p className="text-slate-300 leading-relaxed mb-4">
                  The LCG outputs are truncated (top 128 bits XORed with unknown constant) and the remaining bits are hidden. However, the LCG formula is linear, allowing us to construct a lattice of linear equations relating the unknown parts.
                </p>
                <div className="bg-slate-950/50 p-4 rounded mt-3">
                  <p className="text-slate-400 text-sm mb-2">LCG Formula:</p>
                  <div className="space-y-2">
                    <p className="text-slate-300 font-mono text-sm">S_{'i+1'} = (A × S_i + B) mod M</p>
                    <p className="text-slate-300 font-mono text-sm">r_i = (S_{'i+1'} ≫ 256) ⊕ c</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 p-6 rounded-lg border border-yellow-500/30 border-l-4 border-l-yellow-500">
                <h4 className="text-yellow-300 font-semibold mb-3 text-lg">3. Modular Ambiguity in Seed Recovery</h4>
                <p className="text-slate-300 leading-relaxed">
                  The seed is generated in range <span className="text-purple-300">[1, 2^512]</span> but modulo operation works on <span className="text-purple-300">M = P-1</span>. Multiple candidates must be checked: <span className="text-purple-300">s</span> and <span className="text-purple-300">s + M</span>.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Mathematical Formulas Section */}
          <CollapsibleSection title="Mathematical Analysis">
            <div className="space-y-6">
              <div>
                <h4 className="text-slate-200 font-semibold mb-4">ElGamal Encryption Schema</h4>
                <div className="space-y-4">
                  <MathBlock
                    title="Encryption Formula"
                    formula="c_1 = G^r \\pmod{P}, \\quad c_2 = Y^r \\cdot m \\pmod{P}"
                    description="Where c₁ is the ephemeral key and c₂ is the encrypted message"
                    variant="highlight"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-slate-200 font-semibold mb-4">LCG State Transition</h4>
                <div className="space-y-4">
                  <MathBlock
                    title="State Evolution"
                    formula="S_i \\equiv A^i S_0 + \\sum_{j=0}^{i-1} A^j B \\pmod{M}"
                    description="The state at iteration i can be expressed as a linear combination of initial seed and parameters"
                    variant="default"
                  />
                  <MathBlock
                    title="Output Truncation"
                    formula="r_i = (S_{i+1} \\gg 256) \\oplus c"
                    description="Top 256 bits are removed (right shift), result XORed with unknown constant c"
                    variant="default"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-slate-200 font-semibold mb-4">Lattice Construction for LLL</h4>
                <div className="space-y-4">
                  <p className="text-slate-300 text-sm mb-3">
                    We construct a lattice where rows represent linear equations. Each known relation gives us:
                  </p>
                  <MathBlock
                    title="Error Representation"
                    formula="S_i = k_i + e_i"
                    description="Where k_i is the known part (top 256 bits) and e_i is unknown error (bottom 256 bits)"
                    variant="default"
                  />
                  <MathBlock
                    title="Modular Congruence"
                    formula="k_i + e_i \\equiv A^i (k_0 + e_0) + \\sum_{j=0}^{i-1} A^j B \\pmod{M}"
                    description="This creates a system of equations that LLL can solve"
                    variant="subtle"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-slate-200 font-semibold mb-4">Pohlig-Hellman Algorithm</h4>
                <div className="space-y-4">
                  <MathBlock
                    title="Discrete Log on Smooth Prime"
                    formula="\\text{If } P-1 = \\prod p_i^{e_i} \\text{, then } \\log_G c_1 \\equiv \\sum r_i P_i^{-1} (P-1)/p_i^{e_i} \\pmod{P}"
                    description="Recover exponent by solving DLP on each prime power factor separately"
                    variant="default"
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Solution Steps */}
          <CollapsibleSection title="Solution Approach (5 Steps)" defaultOpen={true}>
            <div className="space-y-6">
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="bg-slate-900/50 p-6 rounded-lg border border-purple-500/30">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-500/20 text-purple-300 rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">1</div>
                    <div className="flex-1">
                      <h5 className="text-purple-300 font-semibold mb-2">Generate Ultra-Smooth Prime</h5>
                      <p className="text-slate-300 text-sm mb-3">
                        Create a 512-bit prime where P-1 = 2 × 3 × 5 × 7 × 11 × ... (product of small primes). This makes the DLP tractable.
                      </p>
                      <div className="bg-slate-950/50 p-3 rounded font-mono text-xs text-slate-400 overflow-x-auto">
                        <code>{`base = ∏(small_primes)\nwhile True:\n  p = base * k + 1\n  if is_prime(p): return p`}</code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-900/50 p-6 rounded-lg border border-blue-500/30">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-500/20 text-blue-300 rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">2</div>
                    <div className="flex-1">
                      <h5 className="text-blue-300 font-semibold mb-2">Extract LCG Parameters</h5>
                      <p className="text-slate-300 text-sm mb-3">
                        Query the server for LCG parameters (A, B) and generator G. These are fixed and remain constant.
                      </p>
                      <div className="bg-slate-950/50 p-3 rounded font-mono text-xs text-slate-400">
                        <code>{`params: A = 0x..., B = 0x..., G = 0x...`}</code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-900/50 p-6 rounded-lg border border-red-500/30">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-500/20 text-red-300 rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">3</div>
                    <div className="flex-1">
                      <h5 className="text-red-300 font-semibold mb-2">Recover r_i via Pohlig-Hellman</h5>
                      <p className="text-slate-300 text-sm mb-3">
                        For each encryption request, get c₁ and solve <MathRenderer formula="c_1 \\equiv G^r \\pmod{P}" inline className="text-purple-300" /> using Pohlig-Hellman to extract r.
                      </p>
                      <div className="bg-slate-950/50 p-3 rounded font-mono text-xs text-slate-400">
                        <code>{`enc 1 → c1 = 0x...\nr = discrete_log(c1, G) mod P`}</code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-slate-900/50 p-6 rounded-lg border border-emerald-500/30">
                  <div className="flex items-start gap-4">
                    <div className="bg-emerald-500/20 text-emerald-300 rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">4</div>
                    <div className="flex-1">
                      <h5 className="text-emerald-300 font-semibold mb-2">LLL Lattice Reduction</h5>
                      <p className="text-slate-300 text-sm mb-3">
                        Build lattice from known/unknown parts of multiple r_i values. LLL finds short vector containing unknown bits.
                      </p>
                      <div className="bg-slate-950/50 p-3 rounded font-mono text-xs text-slate-400">
                        <code>{`known_parts = [r >> 128 for r in rs]\nlattice = build_lattice(known_parts, A, B, M)\nreduced = lattice.LLL()`}</code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="bg-slate-900/50 p-6 rounded-lg border border-yellow-500/30">
                  <div className="flex items-start gap-4">
                    <div className="bg-yellow-500/20 text-yellow-300 rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">5</div>
                    <div className="flex-1">
                      <h5 className="text-yellow-300 font-semibold mb-2">Verify & Submit Seed</h5>
                      <p className="text-slate-300 text-sm mb-3">
                        Recover candidate seeds from LLL output. Check modular ambiguity (s and s+M). Verify locally before sending to server.
                      </p>
                      <div className="bg-slate-950/50 p-3 rounded font-mono text-xs text-slate-400">
                        <code>{`for s in [s_base, s_base + M]:\n  if verify_seed(s, c): \n    server.guess(s, c)\n    return FLAG`}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Flag Section */}
          <div className="bg-gradient-to-r from-green-900/20 via-emerald-900/20 to-teal-900/20 border border-green-500/30 rounded-lg p-8">
            <h3 className="text-green-300 font-semibold mb-4 flex items-center gap-2">
              <BsCheck className="text-2xl" /> Challenge Solved
            </h3>
            <div className="bg-slate-950/50 p-6 rounded-lg font-mono text-sm break-all border border-slate-700/50">
              <p className="text-slate-400 text-xs mb-2">FLAG</p>
              <p className="text-green-400 font-bold text-lg">{flag}</p>
            </div>
            <p className="text-slate-400 text-sm mt-4 italic">
              Successfully recovered LCG seed and constant through smooth prime exploitation and lattice reduction.
            </p>
          </div>

          {/* Key Takeaways */}
          <CollapsibleSection title="Key Takeaways & Lessons">
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                <BsArrowRight className="text-purple-300 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-slate-200 font-semibold">Pohlig-Hellman Attacks</p>
                  <p className="text-slate-400 text-sm mt-1">Never use prime parameters chosen by untrusted parties. Always generate primes with safe prime construction (p = 2q+1).</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                <BsArrowRight className="text-blue-300 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-slate-200 font-semibold">LCG Insecurity</p>
                  <p className="text-slate-400 text-sm mt-1">LCGs are not cryptographically secure. Linear structure makes them vulnerable to lattice attacks. Always use cryptographic PRNGs like ChaCha20 or /dev/urandom.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                <BsArrowRight className="text-red-300 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-slate-200 font-semibold">Truncation ≠ Security</p>
                  <p className="text-slate-400 text-sm mt-1">Removing bits from output doesn't guarantee security if the underlying generator is weak. The linear structure remains exploitable.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                <BsArrowRight className="text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-slate-200 font-semibold">Lattice Reduction Power</p>
                  <p className="text-slate-400 text-sm mt-1">LLL algorithm is incredibly powerful for solving systems with unknown small components. Many cryptographic breaks reduce to lattice problems.</p>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Challenge Stats */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700/30">
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Attacks Used</p>
              <div className="space-y-2">
                <Badge className="bg-purple-500/20 text-purple-300 text-xs">Pohlig-Hellman</Badge>
                <Badge className="bg-blue-500/20 text-blue-300 text-xs">LLL Reduction</Badge>
                <Badge className="bg-red-500/20 text-red-300 text-xs">Lattice Crypto</Badge>
              </div>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700/30">
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Tools & Tech</p>
              <div className="space-y-2">
                <Badge className="bg-slate-600/50 text-slate-300 text-xs">SageMath</Badge>
                <Badge className="bg-slate-600/50 text-slate-300 text-xs">pwntools</Badge>
                <Badge className="bg-slate-600/50 text-slate-300 text-xs">Python</Badge>
              </div>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700/30">
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">Concepts</p>
              <div className="space-y-2">
                <Badge className="bg-yellow-500/20 text-yellow-300 text-xs">DLP</Badge>
                <Badge className="bg-yellow-500/20 text-yellow-300 text-xs">Modular Arithmetic</Badge>
                <Badge className="bg-yellow-500/20 text-yellow-300 text-xs">RNG Analysis</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
