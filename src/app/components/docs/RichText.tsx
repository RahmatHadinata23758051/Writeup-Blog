import React, { useState } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface RichTextProps {
  text: string;
  className?: string;
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail if clipboard is unavailable
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded bg-[var(--docs-surface)] px-2 py-0.5 text-[9px] font-sans font-bold uppercase tracking-wider text-[var(--docs-text-muted)] hover:bg-[var(--docs-surface-hover)] hover:text-[var(--docs-text)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--docs-accent)] cursor-pointer"
      title="Copy to clipboard"
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}

const renderInline = (inputText: string): React.ReactNode[] => {
  if (!inputText) return [];

  const preprocessedInput = inputText
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // Split by block math ($$...$$), inline math ($...$), inline code (`...`), bold (**...**), markdown images (![alt](url)), and markdown links ([text](url))
  const regex = /(\$\$.*?\$\$|\$[^\$\n]+?\$|`.*?`|\*\*.*?\*\*|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\))/gs;
  const parts = preprocessedInput.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const formula = part.slice(2, -2).trim();
      if (!formula) return null;
      try {
        return (
          <span key={index} className="block my-2 text-center">
            <BlockMath math={formula} />
          </span>
        );
      } catch (e) {
        return (
          <span key={index} className="font-mono text-xs text-[var(--docs-accent)] bg-[var(--docs-bg-soft)] px-1 py-0.5 rounded">
            {part}
          </span>
        );
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
        return (
          <span key={index} className="font-mono text-xs text-[var(--docs-accent)] bg-[var(--docs-bg-soft)] px-1 py-0.5 rounded">
            {part}
          </span>
        );
      }
    } else if (part.startsWith('`') && part.endsWith('`')) {
      const code = part.slice(1, -1);
      return (
        <code key={index} className="docs-inline-code">
          {code}
        </code>
      );
    } else if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return <strong key={index}>{renderInline(boldText)}</strong>;
    } else if (part.startsWith('![') && part.endsWith(')')) {
      const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        const altText = imgMatch[1];
        const src = imgMatch[2];
        return (
          <span key={index} className="block my-6 text-center">
            <img
              src={src}
              alt={altText}
              className="mx-auto rounded-lg border border-[var(--docs-border-soft)] shadow-md max-w-full h-auto object-contain bg-[var(--docs-surface)]"
              style={{ maxHeight: '450px' }}
            />
            {altText && (
              <span className="block mt-2 text-xs font-mono text-[var(--docs-text-soft)] tracking-wider">
                {altText}
              </span>
            )}
          </span>
        );
      }
      return part;
    } else if (part.startsWith('[') && part.endsWith(')')) {
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const url = linkMatch[2];
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-medium text-[var(--docs-accent)] hover:text-[var(--docs-accent)] border-b border-dashed border-[var(--docs-accent)]/30 hover:border-[var(--docs-accent)] transition-all duration-200 group no-underline"
          >
            {renderInline(linkText)}
            <svg
              className="inline-block w-3 h-3 ml-0.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        );
      }
      return part;
    } else {
      const lines = part.split('\n');
      return (
        <React.Fragment key={index}>
          {lines.map((line, lineIdx) => (
            <React.Fragment key={lineIdx}>
              {lineIdx > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </React.Fragment>
      );
    }
  });
};

export const RichText: React.FC<RichTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  const preprocessedText = text
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  const lines = preprocessedText.split('\n');
  const elements: React.ReactNode[] = [];

  let currentType: 'p' | 'ul' | 'ol' | 'math' | 'code' | 'table' | 'blockquote' | null = null;
  let currentLines: string[] = [];
  let currentLanguage = '';
  let currentHeaderLine = '';

  const flush = (key: string | number) => {
    if (!currentType) return;

    if (currentLines.length === 0 && currentType !== 'code') {
      currentType = null;
      return;
    }

    if (currentType === 'code') {
      const codeContent = currentLines.join('\n');
      elements.push(
        <div key={key} className="relative rounded bg-[var(--docs-code-bg)] border border-[var(--docs-code-border)] p-3.5 my-3 shadow-sm group">
          <div className="absolute right-2 top-2 z-10 opacity-60 group-hover:opacity-100 transition-opacity">
            <CopyButton text={codeContent} label="Copy" />
          </div>
          <pre className="overflow-x-auto text-[11.5px] font-mono text-[var(--docs-code-text)] leading-relaxed whitespace-pre font-light pr-12">
            <code>{codeContent}</code>
          </pre>
        </div>
      );
      currentLanguage = '';
    } else if (currentType === 'table') {
      const parseRow = (rowLine: string) => {
        const trimmed = rowLine.trim().replace(/^\||\|$/g, '');
        return trimmed.split('|').map(cell => cell.trim());
      };

      const headerRow = parseRow(currentHeaderLine);
      const rows = currentLines.map(parseRow);

      elements.push(
        <div key={key} className="overflow-x-auto my-4 rounded border border-[var(--docs-border-soft)] shadow-sm bg-[var(--docs-bg-soft)]/10">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--docs-bg-soft)] border-b border-[var(--docs-border-soft)] text-[var(--docs-text-muted)] uppercase tracking-widest text-[9px] font-bold font-sans">
                {headerRow.map((cell, idx) => (
                  <th key={idx} className="p-3">{renderInline(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--docs-border-soft)]">
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-[var(--docs-bg-soft)]/20 transition">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="p-3 text-[var(--docs-text)] font-serif text-sm">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentHeaderLine = '';
    } else if (currentType === 'math') {
      const formula = currentLines.join('\n').trim();
      try {
        elements.push(
          <div key={key} className="my-4 overflow-x-auto">
            <BlockMath math={formula} />
          </div>
        );
      } catch (e) {
        elements.push(
          <pre key={key} className="font-mono text-xs text-[var(--docs-accent)] bg-[var(--docs-bg-soft)] p-2 rounded overflow-x-auto">
            {currentLines.join('\n')}
          </pre>
        );
      }
    } else if (currentType === 'ul') {
      elements.push(
        <ul key={key} className="list-disc pl-6 my-2 space-y-1">
          {currentLines.map((line, idx) => (
            <li key={idx}>{renderInline(line)}</li>
          ))}
        </ul>
      );
    } else if (currentType === 'ol') {
      elements.push(
        <ol key={key} className="list-decimal pl-6 my-2 space-y-1">
          {currentLines.map((line, idx) => (
            <li key={idx}>{renderInline(line)}</li>
          ))}
        </ol>
      );
    } else if (currentType === 'blockquote') {
      elements.push(
        <blockquote key={key} className="pl-4 border-l-4 border-[var(--docs-accent)] italic text-[var(--docs-text-muted)] my-4 bg-[var(--docs-bg-soft)]/30 py-2 pr-2 rounded-r">
          {renderInline(currentLines.join('\n'))}
        </blockquote>
      );
    } else if (currentType === 'p') {
      elements.push(
        <p key={key} className="my-3">
          {renderInline(currentLines.join('\n'))}
        </p>
      );
    }

    currentLines = [];
    currentType = null;
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 0. Check for code block start/end (MUST be checked first so code content is not parsed as markdown)
    if (trimmed.startsWith('```')) {
      if (currentType === 'code') {
        flush(i);
      } else {
        flush(i);
        currentType = 'code';
        currentLanguage = trimmed.slice(3).trim();
      }
      i++;
      continue;
    }

    if (currentType === 'code') {
      currentLines.push(line);
      i++;
      continue;
    }

    // 0000. Check for horizontal rule (e.g., ---)
    if (/^-{3,}$/.test(trimmed)) {
      flush(i);
      elements.push(<hr key={`hr-${i}`} className="my-6 border-[var(--docs-border-soft)]" />);
      i++;
      continue;
    }

    // 00000. Check for blockquote line (e.g. > Quote)
    const blockquoteMatch = line.match(/^>\s?(.*)$/);
    if (blockquoteMatch) {
      if (currentType !== 'blockquote') {
        flush(i);
        currentType = 'blockquote';
      }
      currentLines.push(blockquoteMatch[1]);
      i++;
      continue;
    }

    // 000. Check for markdown headings (e.g. #, ##, ###)
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      flush(i);
      const level = headerMatch[1].length;
      const titleText = headerMatch[2].trim();
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;

      const id = titleText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      elements.push(
        <Tag key={i} id={id} className={`docs-prose-${Tag}`}>
          {renderInline(titleText)}
        </Tag>
      );
      i++;
      continue;
    }

    // 00. Check for table row
    const hasPipe = trimmed.includes('|');
    if (hasPipe) {
      if (currentType === 'table') {
        currentLines.push(line);
        i++;
        continue;
      } else {
        const nextLine = lines[i + 1];
        if (nextLine) {
          const nextTrimmed = nextLine.trim();
          if (nextTrimmed.includes('|') && /^[|:\-\s]+$/.test(nextTrimmed)) {
            flush(i);
            currentType = 'table';
            currentHeaderLine = line;
            i += 2; // skip header line and delimiter line
            continue;
          }
        }
      }
    } else if (currentType === 'table') {
      flush(i);
      // Let the rest of the loop process this non-table line
    }

    // 1. Check for block math start/end
    if (trimmed.startsWith('$$')) {
      if (currentType === 'math') {
        const content = trimmed.endsWith('$$') && trimmed.length > 2
          ? trimmed.slice(0, -2)
          : '';
        if (content) currentLines.push(content);
        flush(i);
      } else {
        flush(i);
        currentType = 'math';
        if (trimmed.endsWith('$$') && trimmed.length > 2) {
          currentLines.push(trimmed.slice(2, -2));
          flush(i);
        } else {
          currentLines.push(trimmed.slice(2));
        }
      }
      i++;
      continue;
    }

    if (currentType === 'math') {
      if (trimmed.endsWith('$$')) {
        const content = trimmed.slice(0, -2);
        if (content) currentLines.push(content);
        flush(i);
      } else {
        currentLines.push(line);
      }
      i++;
      continue;
    }

    // 2. Empty line resets current block
    if (trimmed === '') {
      flush(i);
      i++;
      continue;
    }

    // 3. Bullet list item
    const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (currentType !== 'ul') {
        flush(i);
        currentType = 'ul';
      }
      currentLines.push(bulletMatch[2]);
      i++;
      continue;
    }

    // 4. Numbered list item
    const numberedMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (numberedMatch) {
      if (currentType !== 'ol') {
        flush(i);
        currentType = 'ol';
      }
      currentLines.push(numberedMatch[2]);
      i++;
      continue;
    }

    // 5. Normal paragraph text
    if (currentType !== 'p') {
      flush(i);
      currentType = 'p';
    }
    currentLines.push(line);
    i++;
  }
  flush('final');

  return <div className={`docs-prose ${className}`}>{elements}</div>;
};
