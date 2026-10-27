import React, { useState } from 'react';
import type { WriteUp } from '../../data/writeups';
import { RichText } from './RichText';
import { MermaidDiagram, isMermaidCode } from './MermaidDiagram';
import { MathBlock } from '../MathRenderer';
import { CollapsibleCodeBlock } from './CollapsibleCodeBlock';
import { Copy, FileCode, Terminal, Flag as FlagIcon, BookOpen, ShieldCheck, Key, Hash } from 'lucide-react';

interface InlineWriteupProps {
  writeup: WriteUp;
  index?: number;
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="relative px-3 py-1.5 bg-[#FFFDF5] text-[#141413] font-mono text-[10px] uppercase tracking-wider border-2 border-[#141413] cursor-pointer transition-all hover:bg-[#141413] hover:text-[#FFFDF5] shadow-[2px_2px_0_0_#141413] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
      title="Copy to clipboard"
    >
      {copied ? (
        <span className="flex items-center gap-1 text-[#BF3511]">COPIED! <Copy className="w-3 h-3" /></span>
      ) : (
        <span className="flex items-center gap-1">{label} <Copy className="w-3 h-3" /></span>
      )}
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

export function InlineWriteup({ writeup, index = 0 }: InlineWriteupProps) {
  const hasProblemDescription = isNonEmptyString(writeup.problemDescription);
  const hasDescription = isNonEmptyString(writeup.description);
  const hasTools = isNonEmptyArray(writeup.tools);
  const hasAnalysis = isNonEmptyString(writeup.analysis);
  const hasSolution = isNonEmptyArray(writeup.solution);
  const hasTerminalOutputs = isNonEmptyArray(writeup.terminalOutputs);
  const hasFlag = isNonEmptyString(writeup.flag);
  const hasLessonsLearned = isNonEmptyString(writeup.lessonsLearned);
  const hasMathAnalysis = isNonEmptyArray(writeup.mathAnalysis);

  // Section IDs for TOC tracking
  const writeupSlug = writeup.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const sectionIds = {
    briefing: `writeup-${writeupSlug}-briefing`,
    analysis: `writeup-${writeupSlug}-analysis`,
    math: `writeup-${writeupSlug}-math`,
    solution: `writeup-${writeupSlug}-solution`,
    terminal: `writeup-${writeupSlug}-terminal`,
    lessons: `writeup-${writeupSlug}-lessons`,
    flag: `writeup-${writeupSlug}-flag`,
  };

  // Sub-sections available for this writeup
  const availableSections = [
    { id: sectionIds.briefing, label: 'BRIEFING', icon: BookOpen, condition: hasProblemDescription || hasDescription || hasTools },
    { id: sectionIds.analysis, label: 'VULNERABILITY ANALYSIS', icon: FileCode, condition: hasAnalysis },
    { id: sectionIds.math, label: 'MATHEMATICAL MODEL', icon: FileCode, condition: hasMathAnalysis },
    { id: sectionIds.solution, label: 'EXPLOIT EXECUTION', icon: Terminal, condition: hasSolution },
    { id: sectionIds.terminal, label: 'TERMINAL EVIDENCE', icon: Terminal, condition: hasTerminalOutputs },
    { id: sectionIds.lessons, label: 'LESSONS LEARNED', icon: BookOpen, condition: hasLessonsLearned },
    { id: sectionIds.flag, label: 'FLAG SECURED', icon: FlagIcon, condition: hasFlag },
  ].filter(s => s.condition);

  return (
    <article
      id={`writeup-${writeup.id}`}
      className="relative"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Corner fold effect */}
      <div className="absolute top-0 right-0 w-0 h-0 border-8 border-transparent border-t-[8px] border-r-[8px] border-t-[#BF3511] border-r-[#BF3511] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Main Dossier Card - Clean cream card */}
      <div className="bg-[#EFE9D8] border-2 border-[#141413] shadow-[4px_4px_0_0_#141413] overflow-hidden transition-all duration-200 hover:shadow-[6px_6px_0_0_#141413] hover:-translate-x-0.5 hover:-translate-y-0.5">
        
        {/* ===== HEADER BAR - Cream background for readability ===== */}
        <header className="px-5 py-4 bg-[#FFFDF5] border-b border-[#141413]/20 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Category & Title */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {writeup.category && (
                <span className="px-2.5 py-1 bg-[#BF3511] text-[#FFFDF5] font-mono text-[10px] font-bold uppercase tracking-wider border-2 border-[#BF3511] shadow-[1px_1px_0_0_#BF3511] whitespace-nowrap">
                  <ShieldCheck className="w-3 h-3 mr-1.5" />
                  {writeup.category.toUpperCase()}
                </span>
              )}
              {writeup.author && (
                <span className="text-[11px] font-mono text-[#5C574C] flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  by {writeup.author}
                </span>
              )}
            </div>
            <h3 className="font-['Anton'] text-xl sm:text-2xl text-[#141413] uppercase tracking-wider leading-tight">
              {writeup.title}
            </h3>

            {/* ===== DOSSIER INDEX - Section list in header ===== */}
            {availableSections.length > 0 && (
              <nav className="mt-3 pt-3 border-t border-[#141413]/10" aria-label="Dossier sections">
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#BF3511] mb-2">// DOSSIER INDEX</p>
                <ol className="flex flex-wrap items-center gap-1.5" role="list">
                  {availableSections.map((section, idx) => (
                    <li key={section.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          document.getElementById(section.id)?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          });
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-[#EFE9D8] text-[#141413] font-mono text-[9px] uppercase tracking-wider border border-[#141413]/30 hover:bg-[#BF3511] hover:text-[#FFFDF5] hover:border-[#BF3511] transition-all duration-150 shadow-[1px_1px_0_0_#141413] whitespace-nowrap"
                        title={section.label}
                        aria-label={`Go to ${section.label}`}
                      >
                        <section.icon className="w-3 h-3" />
                        <span>{idx + 1}. {section.label}</span>
                      </button>
                      {idx < availableSections.length - 1 && (
                        <span className="text-[#5C574C] font-mono text-[10px]">/</span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </div>

          {/* Badges - Right side */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <span className="px-2.5 py-1 bg-[#BF3511] text-[#FFFDF5] font-mono text-[9px] font-bold uppercase tracking-wider border-2 border-[#BF3511] shadow-[1px_1px_0_0_#BF3511] flex items-center gap-1">
              <Hash className="w-3 h-3" />
              SOLVED
            </span>
            <span className="px-2 py-1 bg-[#141413]/5 text-[#5C574C] font-mono text-[9px] uppercase tracking-wider border border-[#141413]/20 hidden sm:block">
              TARGET #{index + 1}
            </span>
          </div>
        </header>

        {/* ===== CONTENT - All phases flow naturally ===== */}
        <div className="p-5 space-y-8">
          
          {/* ---- PHASE 1: BRIEFING ---- */}
          {(hasProblemDescription || hasDescription || hasTools) && (
            <section id={sectionIds.briefing} className="space-y-4 pt-2 border-t-2 border-[#BF3511]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-[#BF3511] text-[#FFFDF5] font-mono text-[10px] font-bold border-2 border-[#141413] shadow-[1px_1px_0_0_#141413]">01</span>
                <span className="font-['Anton'] text-[12px] uppercase tracking-wider text-[#141413]">BRIEFING</span>
                <BookOpen className="w-4 h-4 text-[#BF3511]" />
                <div className="flex-1 border-t border-[#141413]/20" />
              </div>

              {(hasProblemDescription || hasDescription) && (
                <div className="space-y-2 ml-8">
                  <p className="font-sans text-[10px] uppercase tracking-wider text-[#5C574C]">TARGET DESCRIPTION</p>
                  <div className="text-sm font-serif text-[#141413] leading-relaxed bg-[#FFFDF5] p-4 border border-[#141413]/20 rounded-none">
                    <RichText text={hasProblemDescription ? normalizeToString(writeup.problemDescription) : normalizeToString(writeup.description)} />
                  </div>
                </div>
              )}

              {hasTools && (
                <div className="space-y-2 ml-8 pt-3 border-t border-[#141413]/10">
                  <p className="font-sans text-[10px] uppercase tracking-wider text-[#5C574C]">ARSENAL DEPLOYED</p>
                  <div className="flex flex-wrap gap-2">
                    {(writeup.tools as string[]).map((tool, i) => (
                      <span key={i} className="px-2.5 py-1 bg-[#141413] text-[#FFFDF5] font-mono text-[9px] uppercase tracking-wider border border-[#141413] shadow-[1px_1px_0_0_#141413]">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ---- PHASE 2: VULNERABILITY ANALYSIS ---- */}
          {(hasAnalysis || hasMathAnalysis) && (
            <section id={sectionIds.analysis} className="space-y-4 pt-2 border-t-2 border-[#BF3511]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-[#BF3511] text-[#FFFDF5] font-mono text-[10px] font-bold border-2 border-[#141413] shadow-[1px_1px_0_0_#141413]">02</span>
                <span className="font-['Anton'] text-[12px] uppercase tracking-wider text-[#141413]">VULNERABILITY ANALYSIS</span>
                <FileCode className="w-4 h-4 text-[#BF3511]" />
                <div className="flex-1 border-t border-[#141413]/20" />
              </div>

              {hasAnalysis && (
                <div className="space-y-2 ml-8">
                  <p className="font-sans text-[10px] uppercase tracking-wider text-[#5C574C]">TECHNICAL ANALYSIS</p>
                  <div className="text-sm font-serif text-[#141413] leading-relaxed">
                    <RichText text={normalizeToString(writeup.analysis)} />
                  </div>
                </div>
              )}

              {hasMathAnalysis && (
                <section id={sectionIds.math} className="space-y-3 ml-8 pt-3 border-t border-[#141413]/10">
                  <p className="font-sans text-[10px] uppercase tracking-wider text-[#5C574C]">MATHEMATICAL MODEL</p>
                  <div className="space-y-3">
                    {(writeup.mathAnalysis as any[]).map((formula, idx) => (
                      <MathBlock
                        key={idx}
                        title={formula.title}
                        formula={formula.formula}
                        description={formula.description}
                        variant={formula.variant as 'default' | 'highlight' | 'subtle' | undefined}
                      />
                    ))}
                  </div>
                </section>
              )}
            </section>
          )}

          {/* ---- PHASE 3: EXPLOIT EXECUTION ---- */}
          {hasSolution && (
            <section id={sectionIds.solution} className="space-y-4 pt-2 border-t-2 border-[#BF3511]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-[#BF3511] text-[#FFFDF5] font-mono text-[10px] font-bold border-2 border-[#141413] shadow-[1px_1px_0_0_#141413]">03</span>
                <span className="font-['Anton'] text-[12px] uppercase tracking-wider text-[#141413]">EXPLOIT EXECUTION</span>
                <Terminal className="w-4 h-4 text-[#BF3511]" />
                <div className="flex-1 border-t border-[#141413]/20" />
              </div>

              <div className="space-y-6 ml-8">
                <p className="font-sans text-[10px] uppercase tracking-wider text-[#5C574C]">SOLUTION METHODOLOGY</p>
                <div className="space-y-6">
                  {(writeup.solution as Array<{ title: string; content: string; code?: string }>).map((step, idx) => (
                    <div key={idx} className="space-y-3 pl-4 border-l-2 border-[#BF3511]/30">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#BF3511]">
                          STEP {idx + 1}
                        </span>
                        {step.title && (
                          <h5 className="font-bold font-serif text-sm text-[#141413]">{step.title}</h5>
                        )}
                      </div>
                      {isNonEmptyString(step.content) && (
                        <div className="text-sm font-serif text-[#5C574C] leading-relaxed">
                          <RichText text={step.content} />
                        </div>
                      )}
                      {isNonEmptyString(step.code) && (
                        <div className="space-y-2 pt-1">
                          {isMermaidCode(step.code as string) ? (
                            <MermaidDiagram code={step.code as string} title={step.title} />
                          ) : (
                            <CollapsibleCodeBlock code={step.code as string} />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ---- PHASE 4: TERMINAL EVIDENCE ---- */}
          {hasTerminalOutputs && (
            <section id={sectionIds.terminal} className="space-y-4 pt-2 border-t-2 border-[#BF3511]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-[#BF3511] text-[#FFFDF5] font-mono text-[10px] font-bold border-2 border-[#141413] shadow-[1px_1px_0_0_#141413]">04</span>
                <span className="font-['Anton'] text-[12px] uppercase tracking-wider text-[#141413]">TERMINAL EVIDENCE</span>
                <Terminal className="w-4 h-4 text-[#BF3511]" />
                <div className="flex-1 border-t border-[#141413]/20" />
              </div>

              <div className="space-y-3 ml-8">
                <p className="font-sans text-[10px] uppercase tracking-wider text-[#5C574C]">CAPTURED OUTPUT</p>
                <div className="space-y-3">
                  {(writeup.terminalOutputs as Array<{ command: string; output: string }>).map((term, idx) => (
                    <div key={idx} className="space-y-2 pl-4 border-l-2 border-[#141413]/20">
                      <CollapsibleCodeBlock
                        code={term.output || ''}
                        command={term.command}
                        language="terminal"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ---- PHASE 5: LESSONS LEARNED ---- */}
          {hasLessonsLearned && (
            <section id={sectionIds.lessons} className="space-y-4 pt-2 border-t-2 border-[#BF3511]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-[#BF3511] text-[#FFFDF5] font-mono text-[10px] font-bold border-2 border-[#141413] shadow-[1px_1px_0_0_#141413]">05</span>
                <span className="font-['Anton'] text-[12px] uppercase tracking-wider text-[#141413]">LESSONS LEARNED</span>
                <BookOpen className="w-4 h-4 text-[#BF3511]" />
                <div className="flex-1 border-t border-[#141413]/20" />
              </div>

              <div className="space-y-2 ml-8">
                <p className="font-sans text-[10px] uppercase tracking-wider text-[#5C574C]">DEBRIEFING NOTES</p>
                <div className="text-sm font-serif text-[#5C574C] leading-relaxed bg-[#FFFDF5] p-4 border border-[#141413]/20 rounded-none">
                  <RichText text={normalizeToString(writeup.lessonsLearned)} />
                </div>
              </div>
            </section>
          )}

          {/* ===== FLAG SECTION - Always at bottom ===== */}
          {hasFlag && (
            <section id={sectionIds.flag} className="relative pt-4 border-t-2 border-[#BF3511]">
              <div className="absolute -top-6 left-5">
                <span className="px-3 py-1 bg-[#EFE9D8] font-['Anton'] text-[11px] text-[#BF3511] uppercase tracking-wider border-2 border-[#BF3511] shadow-[2px_2px_0_0_#BF3511]">
                  FLAG SECURED
                </span>
              </div>
              <div className="mt-4 bg-[#141413] border-2 border-[#BF3511] p-5 shadow-[3px_3px_0_0_#BF3511]">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <FlagIcon className="w-5 h-5 text-[#BF3511]" />
                    <span className="font-['Anton'] text-[12px] text-[#BF3511] tracking-wider">CTF FLAG</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-[220px] flex-1">
                    <code className="flex-1 font-mono text-base text-[#BF3511] bg-[#FFFDF5] px-4 py-3 border-2 border-[#141413] break-all select-all">
                      {writeup.flag}
                    </code>
                    <CopyButton text={writeup.flag} label="COPY FLAG" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Data attributes for TOC tracking */}
          <div
            hidden
            data-writeup-id={writeup.id}
            data-writeup-title={writeup.title}
            data-sections={JSON.stringify(availableSections.map(s => ({ id: s.id, label: s.label })))}
          />
        </div>
      </div>
    </article>
  );
}