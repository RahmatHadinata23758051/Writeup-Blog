import React, { useState } from 'react';
import type { WriteUp } from '../../data/writeups';
import { RichText } from '../docs/RichText';
import { MermaidDiagram, isMermaidCode } from '../docs/MermaidDiagram';
import { MathBlock } from '../MathRenderer';
import { CollapsibleCodeBlock } from '../docs/CollapsibleCodeBlock';
import { ChevronDown, Copy, FileCode, Terminal, Flag as FlagIcon, BookOpen } from 'lucide-react';

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
  const [openPhase, setOpenPhase] = useState<number | null>(0); // Open first phase by default
  const [showFullReport, setShowFullReport] = useState(false);
  
  const hasProblemDescription = isNonEmptyString(writeup.problemDescription);
  const hasDescription = isNonEmptyString(writeup.description);
  const hasTools = isNonEmptyArray(writeup.tools);
  const hasAnalysis = isNonEmptyString(writeup.analysis);
  const hasSolution = isNonEmptyArray(writeup.solution);
  const hasTerminalOutputs = isNonEmptyArray(writeup.terminalOutputs);
  const hasFlag = isNonEmptyString(writeup.flag);
  const hasLessonsLearned = isNonEmptyString(writeup.lessonsLearned);
  const hasMathAnalysis = isNonEmptyArray(writeup.mathAnalysis);

  // Build phases from available data
  const phases: Array<{ id: number; title: string; icon: React.ReactNode; content: React.ReactNode }> = [];

  // Phase 1: Briefing
  if (hasProblemDescription || hasDescription || hasTools) {
    phases.push({
      id: 1,
      title: 'BRIEFING',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-4 pt-2">
          {(hasProblemDescription || hasDescription) && (
            <div className="space-y-2">
              <p className="font-sans text-[10px] uppercase tracking-wider text-[#5C574C]">TARGET DESCRIPTION</p>
              <div className="text-sm font-serif text-[#141413] leading-relaxed bg-[#FFFDF5] p-4 border border-[#141413]/20 rounded-none">
                <RichText text={hasProblemDescription ? normalizeToString(writeup.problemDescription) : normalizeToString(writeup.description)} />
              </div>
            </div>
          )}
          {hasTools && (
            <div className="space-y-2 border-t border-[#141413]/10 pt-4">
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
        </div>
      ),
    });
  }

  // Phase 2: Vulnerability Analysis / Math
  if (hasAnalysis || hasMathAnalysis) {
    phases.push({
      id: 2,
      title: 'VULNERABILITY ANALYSIS',
      icon: <FileCode className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-4 pt-2">
          {hasAnalysis && (
            <div className="space-y-2">
              <p className="font-sans text-[10px] uppercase tracking-wider text-[#5C574C]">TECHNICAL ANALYSIS</p>
              <div className="text-sm font-serif text-[#141413] leading-relaxed">
                <RichText text={normalizeToString(writeup.analysis)} />
              </div>
            </div>
          )}
          {hasMathAnalysis && (
            <div className="space-y-3 border-t border-[#141413]/10 pt-4">
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
            </div>
          )}
        </div>
      ),
    });
  }

  // Phase 3: Exploit Execution / Solution
  if (hasSolution) {
    phases.push({
      id: 3,
      title: 'EXPLOIT EXECUTION',
      icon: <Terminal className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-4 pt-2">
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
      ),
    });
  }

  // Phase 4: Terminal Evidence
  if (hasTerminalOutputs) {
    phases.push({
      id: 4,
      title: 'TERMINAL EVIDENCE',
      icon: <Terminal className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-3 pt-2">
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
      ),
    });
  }

  // Phase 5: Lessons Learned
  if (hasLessonsLearned) {
    phases.push({
      id: 5,
      title: 'LESSONS LEARNED',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      content: (
        <div className="space-y-2 pt-2">
          <p className="font-sans text-[10px] uppercase tracking-wider text-[#5C574C]">DEBRIEFING NOTES</p>
          <div className="text-sm font-serif text-[#5C574C] leading-relaxed bg-[#FFFDF5] p-4 border border-[#141413]/20 rounded-none">
            <RichText text={normalizeToString(writeup.lessonsLearned)} />
          </div>
        </div>
      ),
    });
  }

  return (
    <article
      id={`writeup-${writeup.id}`}
      className="relative group"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Corner fold effect */}
      <div className="absolute top-0 right-0 w-0 h-0 border-8 border-transparent border-t-[8px] border-r-[8px] border-t-[#BF3511] border-r-[#BF3511] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Main Dossier Card */}
      <div className="bg-[#EFE9D8] border-2 border-[#141413] shadow-[4px_4px_0_0_#141413] overflow-hidden transition-all duration-200 hover:shadow-[6px_6px_0_0_#141413] hover:-translate-x-0.5 hover:-translate-y-0.5">
        
        {/* Header Bar */}
        <div className="relative px-4 py-3 bg-[#141413] border-b-2 border-[#BF3511] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Category & Title */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {writeup.category && (
                <span className="px-2 py-0.5 bg-[#BF3511] text-[#FFFDF5] font-mono text-[9px] font-bold uppercase tracking-wider border border-[#BF3511] shadow-[1px_1px_0_0_#BF3511] whitespace-nowrap">
                  {writeup.category.toUpperCase()}
                </span>
              )}
              {writeup.author && (
                <span className="text-[10px] font-mono text-[#FFFDF5]/70">
                  by {writeup.author}
                </span>
              )}
            </div>
            <h3 className="font-['Anton'] text-lg sm:text-xl text-[#FFFDF5] uppercase tracking-wider leading-tight truncate">
              {writeup.title}
            </h3>
          </div>

          {/* Target Badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="px-2.5 py-1 bg-[#BF3511] text-[#FFFDF5] font-mono text-[9px] font-bold uppercase tracking-wider border-2 border-[#BF3511] shadow-[1px_1px_0_0_#BF3511]">
              SOLVED
            </span>
            <span className="text-[10px] font-mono text-[#FFFDF5]/50 hidden sm:block">
              TARGET #{index + 1}
            </span>
          </div>
        </div>

        {/* Expand All Toggle */}
        <button
          type="button"
          onClick={() => setShowFullReport(!showFullReport)}
          className="w-full px-4 py-2 bg-[#FFFDF5] border-t border-[#141413]/10 flex items-center justify-between gap-2 text-left hover:bg-[#141413]/5 transition-colors"
        >
          <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#141413]">
            <span className="w-5 h-5 flex items-center justify-center bg-[#141413] text-[#FFFDF5] font-bold text-[11px]">
              {showFullReport ? '−' : '+'}
            </span>
            FULL FIELD REPORT
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[#141413] transition-transform ${showFullReport ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Accordion Phases */}
        <div className="divide-y divide-[#141413]/10">
          {phases.map((phase) => (
            <PhaseAccordion
              key={phase.id}
              phase={phase}
              isOpen={showFullReport || openPhase === phase.id}
              onToggle={() => setOpenPhase(openPhase === phase.id ? null : phase.id)}
              isLast={phase.id === phases[phases.length - 1].id}
            />
          ))}

          {/* Flag Section - Always visible at bottom */}
          {hasFlag && (
            <div className="px-4 py-4 bg-[#141413] border-t-2 border-[#BF3511]">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 bg-[#BF3511] px-3 py-2 border-2 border-[#BF3511] shadow-[2px_2px_0_0_#BF3511]">
                  <FlagIcon className="w-4 h-4 text-[#FFFDF5]" />
                  <span className="font-['Anton'] text-[11px] text-[#FFFDF5] tracking-wider">FLAG SECURED</span>
                </div>
                <div className="flex items-center gap-2 min-w-[200px] flex-1">
                  <code className="flex-1 font-mono text-sm text-[#BF3511] bg-[#FFFDF5] px-3 py-2 border-2 border-[#141413] break-all select-all">
                    {writeup.flag}
                  </code>
                  <CopyButton text={writeup.flag} label="COPY FLAG" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

interface PhaseAccordionProps {
  phase: { id: number; title: string; icon: React.ReactNode; content: React.ReactNode };
  isOpen: boolean;
  onToggle: () => void;
  isLast: boolean;
}

function PhaseAccordion({ phase, isOpen, onToggle, isLast }: PhaseAccordionProps) {
  return (
    <div className={`overflow-hidden transition-all duration-300 ${isLast ? '' : ''}`}>
      {/* Phase Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 bg-[#FFFDF5] hover:bg-[#141413]/5 flex items-center gap-3 text-left transition-colors"
        style={{ borderTop: '1px solid rgba(20,20,19,0.05)' }}
      >
        <span className="w-8 h-8 flex items-center justify-center bg-[#141413] text-[#BF3511] font-mono text-[11px] font-bold border-2 border-[#141413] shadow-[1px_1px_0_0_#141413] flex-shrink-0">
          {phase.id}
        </span>
        <span className="flex items-center gap-2 text-[#141413]">
          {phase.icon}
        </span>
        <span className="font-['Anton'] text-[11px] uppercase tracking-wider text-[#141413] flex-1">
          {phase.title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#5C574C] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Phase Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-4 pb-4 pt-2 bg-[#EFE9D8]/50">
          {phase.content}
        </div>
      </div>
    </div>
  );
}