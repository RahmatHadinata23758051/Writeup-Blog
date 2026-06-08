import React, { useState } from 'react';
import type { WriteUp } from '../../data/writeups';
import { RichText } from '../docs/RichText';

interface DocsWriteupPageProps {
  writeup: WriteUp;
}

// ===== HELPER COMPONENTS =====

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

// ===== HELPER FUNCTIONS =====

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

function renderTextBlock(value: unknown) {
  if (!isNonEmptyString(value) && !isNonEmptyArray(value)) {
    return null;
  }

  const text = normalizeToString(value);
  return (
    <RichText text={text} className="text-[var(--docs-text-muted)] text-sm" />
  );
}

function renderStringList(values: unknown) {
  if (!isNonEmptyArray(values)) return null;

  const items = (values as unknown[])
    .filter((v) => isNonEmptyString(v))
    .map((v) => String(v));

  if (items.length === 0) return null;

  return (
    <ul className="list-inside space-y-1 text-[var(--docs-text-muted)]">
      {items.map((item, idx) => (
        <li key={idx}>• {item}</li>
      ))}
    </ul>
  );
}

// ===== PAGE COMPONENT =====

export function DocsWriteupPage({ writeup }: DocsWriteupPageProps) {
  const hasProblemDescription = isNonEmptyString(writeup.problemDescription);
  const hasDescription = isNonEmptyString(writeup.description);
  const hasTools = isNonEmptyArray(writeup.tools);
  const hasAnalysis = isNonEmptyString(writeup.analysis);
  const hasSolution = isNonEmptyArray(writeup.solution);
  const hasTerminalOutputs = isNonEmptyArray(writeup.terminalOutputs);
  const hasFlag = isNonEmptyString(writeup.flag);
  const hasLessonsLearned = isNonEmptyString(writeup.lessonsLearned);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="space-y-4 border-b border-[var(--docs-border-soft)] pb-8">
        <h1 className="text-4xl font-bold text-[var(--docs-text)]">{writeup.title}</h1>
        {hasDescription && (
          <p className="text-lg text-[var(--docs-text-muted)]">{writeup.description}</p>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-6 text-sm">
          {writeup.ctfName && (
            <div>
              <span className="text-[var(--docs-text-soft)]">Event:</span>{' '}
              <span className="text-[var(--docs-text)]">{writeup.ctfName}</span>
            </div>
          )}
          {writeup.category && (
            <div>
              <span className="text-[var(--docs-text-soft)]">Category:</span>{' '}
              <span className="text-[var(--docs-text)]">{writeup.category}</span>
            </div>
          )}
          {writeup.difficulty && (
            <div>
              <span className="text-[var(--docs-text-soft)]">Difficulty:</span>{' '}
              <span
                className={
                  writeup.difficulty === 'Easy'
                    ? 'text-[var(--docs-success)]'
                    : writeup.difficulty === 'Medium'
                      ? 'text-[var(--docs-accent)]'
                      : 'text-[var(--docs-danger)]'
                }
              >
                {writeup.difficulty}
              </span>
            </div>
          )}
          {writeup.points !== undefined && writeup.points !== null && (
            <div>
              <span className="text-[var(--docs-text-soft)]">Points:</span>{' '}
              <span className="text-[var(--docs-text)]">{writeup.points}</span>
            </div>
          )}
          {writeup.date && (
            <div>
              <span className="text-[var(--docs-text-soft)]">Date:</span>{' '}
              <span className="text-[var(--docs-text)]">{writeup.date}</span>
            </div>
          )}
          {writeup.author && (
            <div>
              <span className="text-[var(--docs-text-soft)]">Author:</span>{' '}
              <span className="text-[var(--docs-text)]">{writeup.author}</span>
            </div>
          )}
        </div>
      </section>

      {/* Challenge Description */}
      {(hasProblemDescription || hasDescription) && (
        <section id="description" className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--docs-text)]">Challenge Description</h2>
          {hasProblemDescription
            ? renderTextBlock(writeup.problemDescription)
            : renderTextBlock(writeup.description)}
        </section>
      )}

      {/* Tools */}
      {hasTools && (
        <section id="tools" className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--docs-text)]">Tools Used</h2>
          <div className="flex flex-wrap gap-2">
            {(writeup.tools as string[]).map((tool) => (
              <span
                key={tool}
                className="rounded bg-[var(--docs-surface)] px-3 py-1 text-xs text-[var(--docs-text-muted)] border border-[var(--docs-border)]"
              >
                {tool}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Analysis */}
      {hasAnalysis && (
        <section id="analysis" className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--docs-text)]">Analysis</h2>
          {renderTextBlock(writeup.analysis)}
        </section>
      )}

      {/* Solution */}
      {hasSolution && (
        <section id="solution" className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--docs-text)]">Solution</h2>
          <div className="space-y-6">
            {(writeup.solution as Array<{ title: string; content: string; code?: string }>).map(
              (step, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)] p-4 space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--docs-accent)]">
                        Step {idx + 1}
                      </span>
                      {step.title && (
                        <h3 className="font-semibold text-[var(--docs-text)]">{step.title}</h3>
                      )}
                    </div>
                  </div>

                  {isNonEmptyString(step.content) && (
                    <RichText text={step.content} className="text-[var(--docs-text-muted)] text-sm" />
                  )}

                  {isNonEmptyString(step.code) && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[var(--docs-text-soft)]">Solver Script</span>
                      </div>
                      <div className="relative rounded bg-[var(--docs-code-bg)] border border-[var(--docs-code-border)] p-3.5 shadow-sm group">
                        <div className="absolute right-2 top-2 z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                          <CopyButton text={step.code as string} />
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

      {/* Terminal Output */}
      {hasTerminalOutputs && (
        <section id="terminal-output" className="space-y-3">
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
        <section id="flag" className="space-y-2">
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
              <CopyButton text={writeup.flag} />
            </div>
          </div>
        </section>
      )}

      {/* Lessons Learned */}
      {hasLessonsLearned && (
        <section id="lessons-learned" className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--docs-text)]">Lessons Learned</h2>
          {renderTextBlock(writeup.lessonsLearned)}
        </section>
      )}
    </div>
  );
}
