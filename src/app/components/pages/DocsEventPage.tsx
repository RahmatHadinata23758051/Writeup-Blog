import React from 'react';
import type { DocsEventNode } from '../../data/docsTree';
import { InlineWriteup } from '../docs/InlineWriteup';
import { Calendar, FolderOpen, Award, Hash } from 'lucide-react';

interface DocsEventPageProps {
  event: DocsEventNode;
}

export function DocsEventPage({ event }: DocsEventPageProps) {

  return (
    <div className="space-y-10 pt-2">
      {/* ===== MISSION BRIEFING HEADER ===== */}
      <header className="relative space-y-6 border-b-2 border-[var(--hp-ink,#141413)] pb-8 bg-[#EFE9D8]/30 rounded-xl p-6 md:p-8">
        {/* Classification Watermark */}
        <div className="absolute top-4 right-4 md:top-6 md:right-8 opacity-10 select-none pointer-events-none">
          <span className="font-['Anton'] text-5xl md:text-7xl uppercase tracking-widest text-[#BF3511]">
            OPERATION
          </span>
        </div>

        {/* Event Title */}
        <div className="relative z-10 space-y-3">
          <p className="font-['Anton'] text-3xl md:text-4xl lg:text-5xl text-[#141413] uppercase tracking-wider leading-tight">
            {event.name}
          </p>

          {/* CTFtime link */}
          {event.ctftimeUrl && (
            <a
              href={event.ctftimeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FFFDF5] border-2 border-[#141413] text-[#141413] font-mono text-[10px] uppercase tracking-wider hover:bg-[#141413] hover:text-[#FFFDF5] transition-all shadow-[2px_2px_0_0_#141413] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <Hash className="w-3.5 h-3.5" />
              <span>CTFTIME RECORD</span>
            </a>
          )}
        </div>

        {/* Intel Bar */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-[#141413]/30">
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#5C574C]">TOTAL OBJECTIVES</p>
            <p className="font-['Anton'] text-2xl md:text-3xl text-[#141413]">{event.totalWriteups}</p>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#5C574C]">SECTORS</p>
            <p className="font-['Anton'] text-2xl md:text-3xl text-[#141413]">{event.categories.length}</p>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#5C574C]">OPERATION DATE</p>
            <p className="font-mono text-sm md:text-lg text-[#141413]">{event.date || 'CLASSIFIED'}</p>
          </div>
        </div>
      </header>

      {/* ===== SECTORS (Categories) ===== */}
      <div className="space-y-12">
        {event.categories.map((category, catIdx) => (
          <section
            key={category.slug}
            id={`category-${category.slug}`}
            className="space-y-6 scroll-mt-20"
          >
            {/* Sector Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-[#141413]/20" />
              </div>
              <div className="relative flex items-center justify-center gap-4">
                <span className="bg-[#EFE9D8] px-4 py-1 font-['Anton'] text-[11px] md:text-[12px] uppercase tracking-wider text-[#141413] border-2 border-[#141413] shadow-[2px_2px_0_0_#141413]">
                  SECTOR {String(catIdx + 1).padStart(2, '0')}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#BF3511] bg-[#EFE9D8] px-3 py-1 border-2 border-[#BF3511] shadow-[2px_2px_0_0_#BF3511]">
                  {category.name.toUpperCase()}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#5C574C] bg-[#EFE9D8] px-3 py-1 border-2 border-[#141413]/30">
                  {category.writeups.length} TARGETS
                </span>
              </div>
            </div>

            {/* Targets List */}
            <div className="space-y-6">
              {category.writeups.map((writeup) => (
                <div key={writeup.id} className="animate-fade-in-up">
                  <InlineWriteup writeup={writeup.original} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ===== CASE CLOSURE FOOTER ===== */}
      <footer className="relative mt-12 pt-8 border-t-2 border-[#141413] bg-[#EFE9D8]/30 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3 text-[#141413]">
            <FolderOpen className="w-5 h-5 text-[#BF3511] flex-shrink-0" />
            <span className="font-mono text-[11px] uppercase tracking-wider">
              Operation {event.name} archived. {event.totalWriteups} objectives secured.
            </span>
          </div>
          <div className="flex items-center gap-4 text-[#5C574C]">
            <span className="font-mono text-[10px] uppercase tracking-wider">NEXT OPERATION</span>
            <Award className="w-4 h-4 text-[#BF3511]" />
          </div>
        </div>
      </footer>
    </div>
  );
}