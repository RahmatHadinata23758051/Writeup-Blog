import React, { useState } from 'react';
import type { WriteUp } from '../../data/writeups';
import { RichText } from '../docs/RichText';
import { MermaidDiagram, isMermaidCode } from '../docs/MermaidDiagram';
import { CollapsibleCodeBlock } from '../docs/CollapsibleCodeBlock';

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
      className="relative px-3 py-1 bg-[#F6F0E0] text-[#141413] font-mono text-[10px] uppercase tracking-wider border-2 border-[#141413] cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      style={{ boxShadow: '2px 2px 0 0 #141413' }}
      title="Copy to clipboard"
    >
      {copied ? 'COPIED!' : label}
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
    <RichText text={text} className="text-[#1B1A17]/90 text-base leading-relaxed font-serif" />
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* CASE FILE HEADER */}
      <header className="relative border-2 border-[#141413] bg-[#F6F0E0] p-6 overflow-hidden">
        {/* Classification watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-10">
          <span className="font-[Anton] text-[8rem] tracking-widest text-[#141413] transform rotate-[-15deg] whitespace-nowrap">
            DECLASSIFIED
          </span>
        </div>

        {/* Top meta bar */}
        <div className="relative flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#BF3511]">// CASE FILE</span>
            <span className="px-2 py-0.5 bg-[#141413] text-[#F6F0E0] font-mono text-[10px] uppercase tracking-widest border-2 border-[#141413]">
              {writeup.ctfName || 'UNKNOWN EVENT'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#BF3511] text-[#F6F0E0] font-mono text-[10px] uppercase tracking-widest border-2 border-[#141413]">
              SOLVED
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="relative space-y-3">
          <h1 className="font-[Anton] text-[2.5rem] sm:text-[3.5rem] tracking-tighter text-[#141413] uppercase leading-tight">
            {writeup.title}
          </h1>
          {(hasProblemDescription || hasDescription) && (
            <p className="font-serif text-lg text-[#1B1A17]/80 leading-relaxed max-w-3xl">
              {hasProblemDescription ? writeup.problemDescription : writeup.description}
            </p>
          )}
        </div>

        {/* Bottom meta row */}
        <div className="relative flex flex-wrap items-center gap-3 mt-4 pt-4 border-t-2 border-[#141413]">
          <div className="flex items-center gap-4 text-sm">
            {writeup.category && (
              <div className="flex items-center gap-1">
                <span className="font-mono text-[10px] text-[#BF3511]">CAT:</span>
                <span className="font-mono uppercase tracking-wider text-[#141413]">{writeup.category}</span>
              </div>
            )}
            {writeup.date && (
              <div className="flex items-center gap-1">
                <span className="font-mono text-[10px] text-[#BF3511]">DATE:</span>
                <span className="font-mono text-[#141413]">{writeup.date}</span>
              </div>
            )}
            {writeup.author && (
              <div className="flex items-center gap-1">
                <span className="font-mono text-[10px] text-[#BF3511]">OPERATIVE:</span>
                <span className="font-mono uppercase tracking-wider text-[#141413]">{writeup.author}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT - Tactical Phases */}
      <main className="space-y-8">
        {/* Tools Section */}
        {hasTools && (
          <section id="tools" className="relative border-2 border-[#141413] bg-[#F6F0E0] p-6">
            <div className="relative flex items-center gap-3 mb-4">
              <span className="px-2 py-1 bg-[#141413] text-[#F6F0E0] font-mono text-[10px] uppercase tracking-widest border-2 border-[#141413]">
                PHASE 1
              </span>
              <h2 className="font-[Anton] text-xl tracking-tight text-[#141413] uppercase">ARSENAL DEPLOYED</h2>
              <div className="flex-1 border-t-2 border-[#141413]" />
            </div>
            <div className="flex flex-wrap gap-2">
              {(writeup.tools as string[]).map((tool) => (
                <span
                  key={tool}
                  className="relative px-3 py-1.5 bg-[#141413] text-[#F6F0E0] font-mono text-xs uppercase tracking-wider border-2 border-[#141413] cursor-default"
                  style={{ boxShadow: '2px 2px 0 0 #141413' }}
                >
                  {tool}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Analysis Section */}
        {hasAnalysis && (
          <section id="analysis" className="relative border-2 border-[#141413] bg-[#F6F0E0] p-6">
            <div className="relative flex items-center gap-3 mb-4">
              <span className="px-2 py-1 bg-[#141413] text-[#F6F0E0] font-mono text-[10px] uppercase tracking-widest border-2 border-[#141413]">
                PHASE 2
              </span>
              <h2 className="font-[Anton] text-xl tracking-tight text-[#141413] uppercase">INTEL ANALYSIS</h2>
              <div className="flex-1 border-t-2 border-[#141413]" />
            </div>
            <div className="prose prose-sm max-w-none text-[#1B1A17]/90">
              {renderTextBlock(writeup.analysis)}
            </div>
          </section>
        )}

        {/* Solution Section */}
        {hasSolution && (
          <section id="solution" className="relative border-2 border-[#141413] bg-[#F6F0E0] p-6">
            <div className="relative flex items-center gap-3 mb-4">
              <span className="px-2 py-1 bg-[#141413] text-[#F6F0E0] font-mono text-[10px] uppercase tracking-widest border-2 border-[#141413]">
                PHASE 3
              </span>
              <h2 className="font-[Anton] text-xl tracking-tight text-[#141413] uppercase">EXECUTION LOG</h2>
              <div className="flex-1 border-t-2 border-[#141413]" />
            </div>
            <div className="space-y-4">
              {(writeup.solution as Array<{ title: string; content: string; code?: string }>).map(
                (step, idx) => (
                  <div
                    key={idx}
                    className="relative border-2 border-[#141413] bg-[#E6DFCB] p-4 space-y-3"
                    style={{ boxShadow: '3px 3px 0 0 #141413' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-[#BF3511] text-[#F6F0E0] font-mono text-[10px] uppercase tracking-widest border-2 border-[#141413]">
                        STEP {String(idx + 1).padStart(2, '0')}
                      </span>
                      {step.title && (
                        <h3 className="font-[Anton] text-lg tracking-tight text-[#141413]">{step.title}</h3>
                      )}
                    </div>

                    {isNonEmptyString(step.content) && (
                      <div className="prose prose-sm max-w-none text-[#1B1A17]/90">
                        {renderTextBlock(step.content)}
                      </div>
                    )}

                    {isNonEmptyString(step.code) && (
                      <div className="space-y-2 pt-2 border-t border-[#141413]/30">
                        {isMermaidCode(step.code as string) ? (
                          <MermaidDiagram code={step.code as string} title={step.title} />
                        ) : (
                          <CollapsibleCodeBlock code={step.code as string} />
                        )}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* Terminal Output Section */}
        {hasTerminalOutputs && (
          <section id="terminal-output" className="relative border-2 border-[#141413] bg-[#141413] p-6">
            <div className="relative flex items-center justify-between gap-3 mb-4">
              <span className="px-2 py-1 bg-[#BF3511] text-[#F6F0E0] font-mono text-[10px] uppercase tracking-widest border-2 border-[#141413]">
                PHASE 4
              </span>
              <h2 className="font-[Anton] text-xl tracking-tight text-[#F6F0E0] uppercase">TERMINAL TRANSCRIPTS</h2>
              <div className="flex-1 border-t-2 border-[#BF3511]" />
            </div>
            <div className="space-y-4">
              {(writeup.terminalOutputs as Array<{ command: string; output: string }>).map(
                (term, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-2 text-[#BF3511] font-mono text-xs">
                      <span>&gt; {term.command}</span>
                    </div>
                    <CollapsibleCodeBlock
                      code={term.output || ''}
                      command=""
                      language="terminal"
                    />
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* FLAG BANNER */}
        {hasFlag && (
          <section id="flag" className="relative border-4 border-[#BF3511] bg-[#141413] p-6 overflow-hidden">
            {/* Corner markers */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-[#BF3511]" />
            <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-[#BF3511]" />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-[#BF3511]" />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-[#BF3511]" />
            
            {/* CLASSIFIED stamp */}
            <div className="absolute top-4 right-4 transform rotate-6 opacity-20">
              <span className="px-3 py-1 bg-[#BF3511] text-[#F6F0E0] font-mono text-[10px] uppercase tracking-widest border-2 border-[#141413]">
                CLASSIFIED
              </span>
            </div>

            <div className="relative flex flex-col items-center text-center space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#BF3511] text-[#F6F0E0] font-mono text-[10px] uppercase tracking-widest border-2 border-[#141413]">
                  FLAG CAPTURED
                </span>
              </div>
              <div className="font-[Anton] text-2xl sm:text-3xl text-[#BF3511] tracking-wider select-all">
                {writeup.flag}
              </div>
              <div className="flex items-center gap-3">
                <CopyButton text={writeup.flag} label="EXTRACT INTEL" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#BF3511]/60">
                  // MISSION COMPLETE
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Lessons Learned Section */}
        {hasLessonsLearned && (
          <section id="lessons-learned" className="relative border-2 border-[#141413] bg-[#F6F0E0] p-6">
            <div className="relative flex items-center gap-3 mb-4">
              <span className="px-2 py-1 bg-[#141413] text-[#F6F0E0] font-mono text-[10px] uppercase tracking-widest border-2 border-[#141413]">
                PHASE 5
              </span>
              <h2 className="font-[Anton] text-xl tracking-tight text-[#141413] uppercase">AFTER ACTION REPORT</h2>
              <div className="flex-1 border-t-2 border-[#141413]" />
            </div>
            <div className="prose prose-sm max-w-none text-[#1B1A17]/90">
              {renderTextBlock(writeup.lessonsLearned)}
            </div>
          </section>
        )}
      </main>

      {/* FOOTER - Case Closure */}
      <footer className="relative border-t-4 border-[#BF3511] pt-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="w-12 h-px bg-[#141413]" />
            <span className="font-[Anton] text-xl tracking-widest text-[#BF3511]">CASE CLOSED</span>
            <span className="w-12 h-px bg-[#141413]" />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#5C574C]">
            ARCHIVED BY NATTT TACTICAL DIVISION
          </p>
        </div>
      </footer>
    </div>
  );
}
