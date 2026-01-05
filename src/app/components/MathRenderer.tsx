import React, { useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import './math-renderer.css';

interface MathRendererProps {
  formula: string;
  inline?: boolean;
  className?: string;
}

/**
 * Component untuk render formula matematika
 * @param formula - String formula dalam format LaTeX (tanpa $)
 * @param inline - Jika true, tampilkan inline; jika false, tampilkan block
 * @param className - Custom CSS class untuk styling tambahan
 * 
 * Contoh:
 * - Inline: <MathRenderer formula="E = mc^2" inline />
 * - Block: <MathRenderer formula="x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}" />
 */
export const MathRenderer: React.FC<MathRendererProps> = ({ 
  formula, 
  inline = false,
  className = ''
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="text-red-500 text-sm p-2">
        ⚠️ Error rendering formula: {formula}
      </div>
    );
  }

  try {
    return inline ? (
      <span className={`math-inline ${className}`}>
        <InlineMath math={formula} onError={() => setHasError(true)} />
      </span>
    ) : (
      <div className={`math-block ${className}`}>
        <BlockMath math={formula} onError={() => setHasError(true)} />
      </div>
    );
  } catch (error) {
    setHasError(true);
    return (
      <div className="text-red-500 text-sm p-2">
        ⚠️ Error rendering formula
      </div>
    );
  }
};

// Component untuk menampilkan multiple formula dengan label
interface MathBlockProps {
  title?: string;
  formula: string;
  description?: string;
  variant?: 'default' | 'highlight' | 'subtle';
}

export const MathBlock: React.FC<MathBlockProps> = ({ 
  title, 
  formula, 
  description,
  variant = 'default'
}) => {
  const variantClasses = {
    default: 'bg-slate-900 dark:bg-slate-950 border-purple-500/30 dark:border-purple-500/20',
    highlight: 'bg-gradient-to-r from-purple-900/40 to-blue-900/40 dark:from-purple-900/30 dark:to-blue-900/30 border-purple-500/50 dark:border-purple-400/40 shadow-lg shadow-purple-500/10',
    subtle: 'bg-slate-800/50 dark:bg-slate-900/50 border-slate-600/30 dark:border-slate-700/30'
  };

  return (
    <div className={`math-block-container ${variantClasses[variant]}`}>
      {title && (
        <h3 className="text-xs font-bold text-purple-400 dark:text-purple-300 mb-4 uppercase tracking-widest opacity-80">
          {title}
        </h3>
      )}
      <div className="math-content-wrapper">
        <BlockMath math={formula} />
      </div>
      {description && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 italic leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};

// Component untuk crypto formula yang common
export const CryptoFormulas = {
  /**
   * RSA Encryption/Decryption
   * c ≡ m^e (mod n) - Encryption
   * m ≡ c^d (mod n) - Decryption
   */
  RSA: {
    encryption: "c \\equiv m^e \\pmod{n}",
    decryption: "m \\equiv c^d \\pmod{n}",
  },

  /**
   * AES Key Expansion (Simplified)
   */
  AES: {
    keySchedule: "W[i] = W[i-4] \\oplus SubWord(RotWord(W[i-1])) \\oplus Rcon[i/4]",
  },

  /**
   * Diffie-Hellman Key Exchange
   */
  DiffieHellman: {
    publicKey: "A = g^a \\bmod p",
    sharedSecret: "S = B^a \\bmod p = g^{ab} \\bmod p",
  },

  /**
   * SHA-256 Hash Function (Simplified)
   */
  SHA256: {
    iteration: "T = (A + F(B, C, D) + X_i + K) \\text{ rotated by } s \\text{ bits}",
  },

  /**
   * Elliptic Curve Point Addition
   */
  EllipticCurve: {
    equation: "y^2 = x^3 + ax + b \\pmod{p}",
    pointAddition: "P + Q = R \\text{ where } m = \\frac{y_2 - y_1}{x_2 - x_1} \\pmod{p}",
  },

  /**
   * ECDSA Signature
   */
  ECDSA: {
    sign: "r = x_1 \\bmod n, \\quad s = k^{-1}(z + r \\cdot d_A) \\bmod n",
    verify: "w = s^{-1} \\bmod n, \\quad u_1 = zw \\bmod n, \\quad u_2 = rw \\bmod n",
  },

  /**
   * XOR Operation (Common in crypto)
   */
  XOR: "A \\oplus B = C",

  /**
   * Modular Exponentiation
   */
  ModExp: "a^b \\bmod m",
};
