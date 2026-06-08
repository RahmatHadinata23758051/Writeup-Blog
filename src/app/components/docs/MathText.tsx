import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathTextProps {
  text: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split text by block math ($$...$$), inline math ($...$), and inline code (`...`)
  // The parenthesis capture group ensures the delimiters are kept in the split array
  const parts = text.split(/(\$\$.*?\$\$|\$.*?\$|`.*?`)/gs);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const formula = part.slice(2, -2).trim();
          if (!formula) return null;
          
          try {
            return (
              <span key={index} className="math-block">
                <BlockMath math={formula} />
              </span>
            );
          } catch (e) {
            // Safe fallback if parsing fails
            return <span key={index} className="font-mono text-xs text-[var(--docs-accent)] bg-[var(--docs-bg-soft)] px-1 py-0.5 rounded">{part}</span>;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const formula = part.slice(1, -1).trim();
          if (!formula) return null;

          try {
            return (
              <span key={index} className="inline-block mx-0.5">
                <InlineMath math={formula} />
              </span>
            );
          } catch (e) {
            // Safe fallback if parsing fails
            return <span key={index} className="font-mono text-xs text-[var(--docs-accent)] bg-[var(--docs-bg-soft)] px-1 py-0.5 rounded">{part}</span>;
          }
        } else if (part.startsWith('`') && part.endsWith('`')) {
          const code = part.slice(1, -1);
          if (!code) return null;
          return (
            <code 
              key={index} 
              className="inline-block font-mono text-[var(--docs-code-text)] bg-[var(--docs-code-bg)] px-1.5 py-0.5 rounded border border-[var(--docs-code-border)] text-[0.875em] mx-0.5 align-middle select-all leading-none"
            >
              {code}
            </code>
          );
        } else {
          // Standard text segment
          // We can render line breaks for readability
          return <React.Fragment key={index}>{part}</React.Fragment>;
        }
      })}
    </span>
  );
};
