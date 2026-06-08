import React, { useState } from 'react';
import type { WriteUp } from '../../data/writeups';
import { RichText } from './RichText';
import { MathBlock } from '../MathRenderer';

interface InlineWriteupProps {
  writeup: WriteUp;
  compact?: boolean;
}

// Copy button with proper type attribute
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
      className="rounded bg-[var(--docs-surface)] px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-wider text-[var(--docs-text-muted)] hover:bg-[var(--docs-surface-hover)] hover:text-[var(--docs-text)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--docs-accent)] cursor-pointer"
      title="Copy to clipboard"
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

function normalizeToString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join('\n');
  return String(value || '');
}

export function InlineWriteup({ writeup }: InlineWriteupProps) {
  const hasProblemDescription = isNonEmptyString(writeup.problemDescription);
  const hasDescription = isNonEmptyString(writeup.description);
  const hasTools = isNonEmptyArray(writeup.tools);
  const hasAnalysis = isNonEmptyString(writeup.analysis);
  const hasSolution = isNonEmptyArray(writeup.solution);
  const hasTerminalOutputs = isNonEmptyArray(writeup.terminalOutputs);
  const hasFlag = isNonEmptyString(writeup.flag);
  const hasLessonsLearned = isNonEmptyString(writeup.lessonsLearned);

  return (
    <article
      id={`writeup-${writeup.id}`}
      className="space-y-6 pt-10 border-t border-[var(--docs-border-soft)] first:pt-0 first:border-0 scroll-mt-20"
    >
      {/* Title & Metadata */}
      <div className="space-y-3">
        <h3 className="text-2xl font-bold font-serif text-[var(--docs-text)] tracking-tight">
          {writeup.title}
        </h3>
        
        {/* Metadata row matching krauq design */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--docs-text-soft)] bg-[var(--docs-bg-soft)]/50 p-2.5 rounded border border-[var(--docs-border-soft)] font-mono">
          {writeup.category && (
            <div>
              <span className="font-sans uppercase text-[10px] tracking-wider text-[var(--docs-text-soft)] mr-1">Category:</span>
              <span className="text-[var(--docs-text)] font-semibold font-sans">{writeup.category}</span>
            </div>
          )}
          {writeup.points !== undefined && writeup.points !== null && (
            <div>
              <span className="font-sans uppercase text-[10px] tracking-wider text-[var(--docs-text-soft)] mr-1">Points:</span>
              <span className="text-[var(--docs-text)] font-bold">{writeup.points}</span>
            </div>
          )}
          {writeup.difficulty && (
            <div>
              <span className="font-sans uppercase text-[10px] tracking-wider text-[var(--docs-text-soft)] mr-1">Difficulty:</span>
              <span
                className={`font-semibold ${
                  writeup.difficulty === 'Easy'
                    ? 'text-[var(--docs-success)]'
                    : writeup.difficulty === 'Medium'
                      ? 'text-[var(--docs-accent)]'
                      : 'text-[var(--docs-danger)]'
                }`}
              >
                {writeup.difficulty}
              </span>
            </div>
          )}
          {writeup.date && (
            <div>
              <span className="font-sans uppercase text-[10px] tracking-wider text-[var(--docs-text-soft)] mr-1">Date:</span>
              <span className="text-[var(--docs-text)]">{writeup.date}</span>
            </div>
          )}
          {writeup.author && (
            <div>
              <span className="font-sans uppercase text-[10px] tracking-wider text-[var(--docs-text-soft)] mr-1">Author:</span>
              <span className="text-[var(--docs-text)]">{writeup.author}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {(hasProblemDescription || hasDescription) && (
        <section className="space-y-2">
          <h4 className="text-xs uppercase tracking-widest text-[var(--docs-text-soft)] font-bold font-sans">
            Description
          </h4>
          <div className="text-sm font-serif text-[var(--docs-text)] leading-relaxed bg-[var(--docs-bg-soft)]/20 p-4 rounded border border-[var(--docs-border-soft)]">
            <RichText text={hasProblemDescription ? normalizeToString(writeup.problemDescription) : normalizeToString(writeup.description)} />
          </div>
        </section>
      )}



      {/* Analysis */}
      {(hasAnalysis || isNonEmptyArray(writeup.mathAnalysis)) && (
        <section className="space-y-2">
          <h4 className="text-xs uppercase tracking-widest text-[var(--docs-text-soft)] font-bold font-sans">
            Analysis
          </h4>
          {hasAnalysis && (
            <div className="text-sm font-serif text-[var(--docs-text)] leading-relaxed">
              <RichText text={normalizeToString(writeup.analysis)} />
            </div>
          )}
          {isNonEmptyArray(writeup.mathAnalysis) && (
            <div className="space-y-4 pt-2">
              {(writeup.mathAnalysis as any[]).map((formula, index) => (
                <MathBlock
                  key={index}
                  title={formula.title}
                  formula={formula.formula}
                  description={formula.description}
                  variant={formula.variant as 'default' | 'highlight' | 'subtle' | undefined}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Solution */}
      {hasSolution && (
        <section className="space-y-4">
          <h4 className="text-xs uppercase tracking-widest text-[var(--docs-text-soft)] font-bold font-sans">
            Solution & Methodology
          </h4>
          <div className="space-y-6">
            {(writeup.solution as Array<{ title: string; content: string; code?: string }>).map(
              (step, idx) => (
                <div
                  key={idx}
                  className="space-y-3 pl-4 border-l-2 border-[var(--docs-border)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[var(--docs-accent)]">
                      Step {idx + 1}
                    </span>
                    {step.title && (
                      <h5 className="font-bold font-serif text-sm text-[var(--docs-text)]">{step.title}</h5>
                    )}
                  </div>

                  {isNonEmptyString(step.content) && (
                    <div className="text-sm font-serif text-[var(--docs-text-muted)] leading-relaxed">
                      <RichText text={step.content} />
                    </div>
                  )}

                  {isNonEmptyString(step.code) && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[var(--docs-text-soft)]">Solver Script</span>
                      </div>
                      <div className="relative rounded bg-[var(--docs-code-bg)] border border-[var(--docs-code-border)] p-3.5 shadow-sm group">
                        <div className="absolute right-2 top-2 z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                          <CopyButton text={step.code as string} label="Copy" />
                        </div>
                        <pre className="overflow-x-auto text-[11.5px] font-mono text-[var(--docs-code-text)] leading-relaxed whitespace-pre font-light pr-12">
                          <code>{step.code}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* Terminal Outputs */}
      {hasTerminalOutputs && (
        <section className="space-y-3">
          <h4 className="text-xs uppercase tracking-widest text-[var(--docs-text-soft)] font-bold font-sans">
            Terminal Output
          </h4>
          <div className="space-y-4">
            {(writeup.terminalOutputs as Array<{ command: string; output: string }>).map(
              (term, idx) => (
                <div key={idx} className="space-y-2 pl-4 border-l-2 border-[var(--docs-border-soft)]">
                  {isNonEmptyString(term.command) && (
                    <div className="flex items-center">
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[var(--docs-text-soft)]">
                        Command
                      </span>
                    </div>
                  )}
                  <div className="relative rounded bg-[var(--docs-code-bg)] border border-[var(--docs-code-border)] p-3.5 shadow-sm group">
                    <div className="absolute right-2 top-2 z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                      <CopyButton 
                        text={isNonEmptyString(term.command) ? term.command : term.output} 
                        label="Copy" 
                      />
                    </div>
                    <pre className="overflow-x-auto text-[11.5px] font-mono text-[var(--docs-code-text)] leading-relaxed whitespace-pre font-light pr-12">
                      {isNonEmptyString(term.command) && (
                        <code className="text-[var(--docs-accent)] font-semibold">
                          $ {term.command}
                          {isNonEmptyString(term.output) && '\n'}
                        </code>
                      )}
                      <code>{term.output}</code>
                    </pre>
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* Flag */}
      {hasFlag && (
        <section className="space-y-2">
          <h4 className="text-xs uppercase tracking-widest text-[var(--docs-text-soft)] font-bold font-sans">
            Flag
          </h4>
          <div className="flex items-stretch rounded border border-[var(--docs-accent)] bg-[var(--docs-accent-soft)] max-w-xl shadow-sm overflow-hidden">
            <div className="bg-[var(--docs-accent)] px-4 flex items-center shrink-0 text-[var(--docs-bg)] font-sans font-bold text-[10px] uppercase tracking-widest">
              Flag
            </div>
            <div className="p-3 px-4 font-mono text-sm text-[var(--docs-accent)] select-all truncate flex-1 font-bold">
              {writeup.flag}
            </div>
            <div className="flex items-center px-3 shrink-0 border-l border-[var(--docs-border-soft)]">
              <CopyButton text={writeup.flag} label="Copy" />
            </div>
          </div>
        </section>
      )}

      {/* Lessons Learned */}
      {hasLessonsLearned && (
        <section className="space-y-2">
          <h4 className="text-xs uppercase tracking-widest text-[var(--docs-text-soft)] font-bold font-sans">
            Lessons Learned
          </h4>
          <div className="text-sm font-serif text-[var(--docs-text-muted)] leading-relaxed bg-[var(--docs-bg-soft)]/20 p-4 rounded border border-[var(--docs-border-soft)]">
            <RichText text={normalizeToString(writeup.lessonsLearned)} />
          </div>
        </section>
      )}
    </article>
  );
}
