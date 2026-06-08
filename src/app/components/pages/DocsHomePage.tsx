import React from 'react';
import type { DocsEventNode } from '../../data/docsTree';
import { getEventEmoji } from '../docs/DocsSidebar';
import type { CtftimeTeamProfile } from '../../data/ctftimeTypes';
import { findCtftimeEvent } from '../../data/eventMeta';

interface DocsHomePageProps {
  tree: DocsEventNode[];
  totalWriteups: number;
  totalCategories: number;
  onEventClick?: (eventSlug: string) => void;
  onWriteupClick?: (writeupId: string) => void;
  ctftimeProfile?: CtftimeTeamProfile;
}

const EVENT_PLACES: Record<string, string> = {
  'INTECHFEST': 'Participant',
  'VuwCTF 2025': 'Participant',
  'Lake CTF 2025': 'Participant',
  'FlagYard': 'Participant',
  'HackTheBox': 'Participant',
  'JerseyCTF': 'Participant'
};

export function DocsHomePage({
  tree,
  totalWriteups,
  totalCategories,
  onEventClick,
  onWriteupClick,
  ctftimeProfile,
}: DocsHomePageProps) {
  // Get featured writeups (first 6 from all events)
  const featuredWriteups = tree
    .flatMap((event) =>
      event.categories.flatMap((cat) =>
        cat.writeups.map((wu) => ({
          ...wu,
          eventName: event.name,
          categoryName: cat.name,
        }))
      )
    )
    .slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex items-start justify-between border-b border-[var(--docs-border)] pb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🚩</span>
          <h1 className="text-3xl font-bold font-display text-[var(--docs-text)] tracking-tighter">Home</h1>
        </div>
      </div>

      {/* Subtitle / desc */}
      <p className="text-lg font-serif text-[var(--docs-text-muted)] leading-relaxed max-w-2xl italic font-light">
        A collection of CTF challenge writeups and notes, aimed towards cybersecurity education and technical walk-throughs.
      </p>

      {/* Intro details */}
      <div className="space-y-4 pt-1 text-sm leading-relaxed text-[var(--docs-text)] font-serif">
        <p>
          Welcome to the write-up catalog. Here, we document solutions for various categories including Cryptography, Reverse Engineering, Binary Exploitation, Web Security, Forensics, and more.
        </p>

        <p className="text-[var(--docs-text-soft)] italic font-light text-xs font-sans">
          (This archive is regularly updated as new events are completed and analyzed)
        </p>

      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3 pt-4">
        <div className="rounded border border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)]/30 p-5">
          <div className="text-2xl font-bold font-mono text-[var(--docs-accent)]">{tree.length}</div>
          <p className="text-xs font-sans text-[var(--docs-text-soft)] uppercase tracking-wider font-semibold">CTF Events</p>
        </div>
        <div className="rounded border border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)]/30 p-5">
          <div className="text-2xl font-bold font-mono text-[var(--docs-success)]">{totalWriteups}</div>
          <p className="text-xs font-sans text-[var(--docs-text-soft)] uppercase tracking-wider font-semibold">Total Solves</p>
        </div>
        <div className="rounded border border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)]/30 p-5">
          <div className="text-2xl font-bold font-mono text-[var(--docs-danger)]">{totalCategories}</div>
          <p className="text-xs font-sans text-[var(--docs-text-soft)] uppercase tracking-wider font-semibold">Categories</p>
        </div>
      </div>

      {/* HISTORICAL STATS TABLE */}
      <div id="stats-table-section" className="pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold tracking-widest text-[var(--docs-text-soft)] uppercase font-sans">
            CTF Performance & Solves
          </h3>
          {ctftimeProfile?.teamUrl && (
            <a
              href={ctftimeProfile.teamUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--docs-accent)] hover:underline font-mono"
            >
              CTFtime team profile →
            </a>
          )}
        </div>

        <div className="overflow-x-auto rounded border border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)]/20 shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--docs-bg-soft)] border-b border-[var(--docs-border-soft)] text-[var(--docs-text-muted)] uppercase tracking-widest text-[9px] font-bold font-sans">
                <th className="p-3">Event Name</th>
                <th className="p-3">Solves</th>
                <th className="p-3">Categories</th>
                <th className="p-3">Latest Solved</th>
                <th className="p-3">Rank/Place</th>
                <th className="p-3">Points</th>
                <th className="p-3">Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--docs-border-soft)]">
              {tree.map((event) => {
                const emoji = getEventEmoji(event.name);

                // Find matching CTFtime metadata
                const ctftimeEvent = ctftimeProfile
                  ? findCtftimeEvent(event.name, ctftimeProfile)
                  : undefined;

                 // Determine Rank/Place with EVENT_PLACES fallback (case-insensitive lookup)
                 let place: string | number = '—';
                 if (ctftimeEvent?.place !== undefined && ctftimeEvent?.place !== null) {
                   place = ctftimeEvent.place;
                 } else {
                   const matchedKey = Object.keys(EVENT_PLACES).find(
                     (k) => k.toLowerCase() === event.name.toLowerCase()
                   );
                   if (matchedKey) {
                     place = EVENT_PLACES[matchedKey];
                   }
                 }

                 // Determine Points with local writeups sum fallback
                 let points: string | number = '—';
                 if (ctftimeEvent?.points !== undefined && ctftimeEvent?.points !== null) {
                   points = ctftimeEvent.points;
                 } else {
                   const totalLocalPoints = event.categories.reduce((sum, cat) => {
                     return sum + cat.writeups.reduce((catSum, w) => {
                       const pts = Number(w.points);
                       return catSum + (isNaN(pts) ? 0 : pts);
                     }, 0);
                   }, 0);
                   if (totalLocalPoints > 0) {
                     points = totalLocalPoints;
                   }
                 }
                 const team = ctftimeEvent?.team || ctftimeProfile?.teamName || 'Personal';

                // Find latest writeup date
                const dates = event.categories
                  .flatMap((cat) => cat.writeups.map((w) => w.date))
                  .filter(Boolean) as string[];
                const latestDate = dates.length > 0
                  ? dates.sort().reverse()[0]
                  : '—';

                return (
                  <tr
                    key={event.slug}
                    onClick={() => {
                      onEventClick?.(event.slug);
                      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:bg-[var(--docs-bg-soft)]/60 transition cursor-pointer group"
                  >
                    <td className="p-3 font-semibold text-[var(--docs-accent)] group-hover:underline font-serif text-sm">
                      <span className="mr-2 text-sm">{emoji}</span>
                      {event.name}
                    </td>
                    <td className="p-3 text-[var(--docs-text-muted)] font-mono">
                      {event.totalWriteups}
                    </td>
                    <td className="p-3 text-[var(--docs-text-muted)] font-mono">
                      {event.categories.length}
                    </td>
                    <td className="p-3 text-[var(--docs-text-muted)] font-mono">
                      {latestDate}
                    </td>
                    <td className="p-3 font-bold text-[var(--docs-text)]">
                      {place}
                    </td>
                    <td className="p-3 font-mono text-[var(--docs-text-muted)]">
                      {points}
                    </td>
                    <td className="p-3 text-[var(--docs-text-soft)] font-sans uppercase tracking-wider text-[10px] font-medium">
                      {team}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Featured Writeups */}
      {featuredWriteups.length > 0 && (
        <section id="featured-writeups" className="space-y-4 pt-4">
          <h3 className="text-[10px] font-bold tracking-widest text-[var(--docs-text-soft)] uppercase font-sans">
            Featured Solutions
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {featuredWriteups.map((writeup) => (
              <button
                key={writeup.id}
                onClick={() => onWriteupClick?.(writeup.id)}
                className="rounded border border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)]/10 p-5 text-left transition-all hover:border-[var(--docs-border)] hover:bg-[var(--docs-bg-soft)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--docs-accent-border)] cursor-pointer group"
              >
                <div className="space-y-2">
                  <h4 className="font-bold text-sm font-serif text-[var(--docs-text)] group-hover:underline">
                    {writeup.title}
                  </h4>
                  <div className="space-y-1">
                    <p className="text-xs text-[var(--docs-text-soft)]">{writeup.eventName}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="rounded bg-[var(--docs-bg-soft)] px-2 py-0.5 text-[10px] font-mono text-[var(--docs-text-muted)] border border-[var(--docs-border-soft)]">
                        {writeup.categoryName}
                      </span>
                      {writeup.difficulty && (
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-sans font-semibold border ${writeup.difficulty === 'Easy'
                            ? 'bg-[var(--docs-success)]/10 text-[var(--docs-success)] border-[var(--docs-success)]/20'
                            : writeup.difficulty === 'Medium'
                              ? 'bg-[var(--docs-accent)]/10 text-[var(--docs-accent)] border-[var(--docs-accent)]/20'
                              : 'bg-[var(--docs-danger)]/10 text-[var(--docs-danger)] border-[var(--docs-danger)]/20'
                            }`}
                        >
                          {writeup.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
