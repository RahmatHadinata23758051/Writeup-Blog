import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { DocsEventNode } from '../../data/docsTree';
import type { CtftimeTeamProfile } from '../../data/ctftimeTypes';
import { findCtftimeEvent } from '../../data/eventMeta';
import './home-page.css';

interface DocsHomePageProps {
  tree: DocsEventNode[];
  totalWriteups: number;
  totalCategories: number;
  onEventClick?: (eventSlug: string) => void;
  onWriteupClick?: (writeupId: string) => void;
  ctftimeProfile?: CtftimeTeamProfile;
}

const EVENTS_PER_PAGE = 10;

const EVENT_PLACES: Record<string, string> = {
  INTECHFEST: 'Participant',
  'VuwCTF 2025': 'Participant',
  'Lake CTF 2025': 'Participant',
  FlagYard: 'Participant',
  HackTheBox: 'Participant',
  JerseyCTF: 'Participant',
};

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const pad = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length));

/** Fade + rise when the block enters the viewport. Content stays visible without JS. */
function Reveal({
  children,
  delay = 0,
  mode = 'self',
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  mode?: 'self' | 'rows';
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const base = mode === 'rows' ? 'hp-reveal-rows' : 'hp-reveal';

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;

    // Already on screen at load: leave it visible, no flash.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.85 && r.bottom > 0) return;

    el.classList.add(base);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('hp-in');
          io.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [base]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ '--hp-d': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/** Counts from 0 to `to` once, when it becomes visible. Final value is always in the DOM. */
function CountUp({ to, decimals = 0, prefix = '' }: { to: number; decimals?: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(to);
  const finalText = `${prefix}${to.toFixed(decimals)}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setVal(to);
      return;
    }
    setVal(0);
    let raf = 0;
    let started = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1200;
        const tick = (now: number) => {
          const p = Math.min((now - t0) / dur, 1);
          setVal(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) raf = requestAnimationFrame(tick);
          else setVal(to);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);

  return (
    <>
      <span className="hp-sr">{finalText}</span>
      <span ref={ref} aria-hidden="true">
        {prefix}
        {val.toFixed(decimals)}
      </span>
    </>
  );
}

type TabId = 'ls' | 'rank' | 'stats';
type TermLine = { text: string; prompt?: boolean };

/* ------------------------------------------------------------------ */
/* component                                                           */
/* ------------------------------------------------------------------ */

export function DocsHomePage({
  tree,
  totalWriteups,
  totalCategories,
  onEventClick,
  ctftimeProfile,
}: DocsHomePageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const marqueeAnimRef = useRef<Animation | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('ls');
  const [eventsExpanded, setEventsExpanded] = useState(false);

  /* ---------- data ---------- */
  const sortedEvents = [...tree].sort((a, b) => (b.latestDate || '').localeCompare(a.latestDate || ''));
  const displayEvents = eventsExpanded ? sortedEvents : sortedEvents.slice(0, EVENTS_PER_PAGE);
  const latestEvents = sortedEvents.slice(0, 3);
  const latestEventName = sortedEvents[0]?.name || 'HITCON CTF 2026';
  const eventCount = tree.length;

  const categoryStats = tree
    .flatMap((event) => event.categories)
    .reduce((acc, cat) => {
      acc[cat.name] = (acc[cat.name] || 0) + cat.writeups.length;
      return acc;
    }, {} as Record<string, number>);

  const categoryEntries = Object.entries(categoryStats).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );
  const topCategories = categoryEntries.slice(0, 3);

  const countryRank = ctftimeProfile?.countryRank ?? 1;
  const globalRank = ctftimeProfile?.globalRank ?? 71;
  const ratingPoints = Number(ctftimeProfile?.ratingPoints ?? 441.04);
  const totalCtfEvents = ctftimeProfile?.events.length ?? 157;

  const marqueeEvents = tree.map((e) => e.name.toUpperCase());

  const terminal: Record<TabId, TermLine[]> = {
    ls: [
      { text: '$ ls writeups/ --latest', prompt: true },
      ...latestEvents.map((ev) => ({
        text: `${pad(ev.latestDate || '----------', 12)}${pad(`${ev.slug}/`, 32)}${ev.totalWriteups}`,
      })),
    ],
    rank: [
      { text: '$ cat rank.txt', prompt: true },
      { text: `indonesia   #${countryRank}` },
      { text: `worldwide   #${globalRank}` },
      { text: `points      ${ratingPoints.toFixed(2)}` },
      { text: `events      ${totalCtfEvents}` },
    ],
    stats: [
      { text: '$ ./stats --all', prompt: true },
      { text: `events      ${tree.length}` },
      { text: `writeups    ${totalWriteups}` },
      { text: `categories  ${totalCategories}` },
      ...topCategories.map(([name, n]) => ({ text: `  ${pad(name.toLowerCase(), 16)}${n}` })),
    ],
  };

  /* ---------- actions ---------- */
  const scrollToWriteups = () => {
    document.getElementById('performance-table')?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  };
  const openLatestEvent = () => {
    const slug = sortedEvents[0]?.slug;
    if (slug) onEventClick?.(slug);
  };

  /* ---------- hero mouse parallax (CSS vars, no re-render) ---------- */
  const onHeroPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || !artRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
    const ny = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
    artRef.current.style.setProperty('--mx', nx.toFixed(3));
    artRef.current.style.setProperty('--my', ny.toFixed(3));
  }, []);
  const onHeroPointerLeave = useCallback(() => {
    artRef.current?.style.setProperty('--mx', '0');
    artRef.current?.style.setProperty('--my', '0');
  }, []);

  /* ---------- marquee: seamless loop via Web Animations API ---------- */
  useEffect(() => {
    const track = trackRef.current;
    if (!track || prefersReducedMotion() || typeof track.animate !== 'function') return;
    const half = track.scrollWidth / 2;
    if (!half) return;
    const anim = track.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }],
      { duration: (half / 70) * 1000, iterations: Infinity, easing: 'linear' }
    );
    marqueeAnimRef.current = anim;
    return () => {
      anim.cancel();
      marqueeAnimRef.current = null;
    };
  }, [marqueeEvents.length]);

  /* ---------- scroll: hero parallax progress + marquee speed ----------
     One capture listener on document, so it works whether the page scrolls
     on window or inside a layout container. Position is derived from the
     root's bounding rect, so sidebar scrolling does not count. */
  useEffect(() => {
    const root = rootRef.current;
    const hero = heroRef.current;
    if (!root || !hero || prefersReducedMotion()) return;

    const posY = () => -root.getBoundingClientRect().top;
    let lastY = posY();
    let vel = 0;
    let rate = 1;
    let raf = 0;

    const setRate = (r: number) => {
      const a = marqueeAnimRef.current;
      if (!a) return;
      if (typeof a.updatePlaybackRate === 'function') a.updatePlaybackRate(r);
      else a.playbackRate = r;
    };
    const applyProgress = (y: number) => {
      const h = hero.offsetHeight || 1;
      hero.style.setProperty('--sy', clamp(y / h, 0, 1).toFixed(4));
    };

    const frame = () => {
      const y = posY();
      const dy = y - lastY;
      lastY = y;
      vel = vel * 0.85 + dy * 0.15; // smoothed px per frame, signed
      applyProgress(y);

      const target = clamp(1 + vel * 0.12, -4, 5); // scroll down = faster, scroll up = reverses
      rate += (target - rate) * 0.1;
      setRate(rate);

      const active = Math.abs(vel) > 0.05 || Math.abs(rate - 1) > 0.02;
      if (active) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = 0;
        rate = 1;
        setRate(1);
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    applyProgress(lastY);
    document.addEventListener('scroll', kick, { passive: true, capture: true });
    window.addEventListener('resize', kick);
    return () => {
      document.removeEventListener('scroll', kick, true);
      window.removeEventListener('resize', kick);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* ---------- render ---------- */
  return (
    <div className="hp-root" ref={rootRef}>
      {/* ===== HERO ===== */}
      <section
        className="hp-hero"
        ref={heroRef}
        aria-labelledby="hp-title"
        onPointerMove={onHeroPointerMove}
        onPointerLeave={onHeroPointerLeave}
      >
        <div className="hp-inner">
          <div className="hp-hero-grid">
            <div>
              <h1
                id="hp-title"
                className="hp-display hp-h1 hp-rise"
                style={{ '--hp-d': '0ms' } as React.CSSProperties}
              >
                <span>CTF</span> <span>Writeups</span> <span>That Teach.</span>
              </h1>

              <p className="hp-tag hp-rise" style={{ '--hp-d': '200ms' } as React.CSSProperties}>
                A collection of CTF challenge writeups and notes, aimed towards cybersecurity
                education and technical walk-throughs.
              </p>

              <div className="hp-cta hp-rise" style={{ '--hp-d': '300ms' } as React.CSSProperties}>
                <button type="button" className="hp-btn hp-btn--solid" onClick={scrollToWriteups}>
                  Browse writeups
                </button>
                <button type="button" className="hp-btn hp-btn--ghost" onClick={openLatestEvent}>
                  Latest: {latestEventName}
                </button>
              </div>

              {/* terminal */}
              <div className="hp-term hp-rise" style={{ '--hp-d': '400ms' } as React.CSSProperties}>
                <div className="hp-term-tabs" role="tablist" aria-label="Archive summary">
                  {(
                    [
                      ['ls', '$ ls'],
                      ['rank', '$ cat rank'],
                      ['stats', '$ ./stats'],
                    ] as [TabId, string][]
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      id={`hp-tab-${id}`}
                      aria-selected={activeTab === id}
                      aria-controls="hp-term-panel"
                      className="hp-tab"
                      onClick={() => setActiveTab(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div
                  className="hp-term-body"
                  role="tabpanel"
                  id="hp-term-panel"
                  aria-labelledby={`hp-tab-${activeTab}`}
                >
                  {terminal[activeTab].map((line, i) => (
                    <div key={`${activeTab}-${i}`} className={`hp-line${line.prompt ? ' hp-line--prompt' : ''}`}>
                      {line.text}
                    </div>
                  ))}
                  <div className="hp-line hp-line--prompt">
                    {'$ '}
                    <span className="hp-cursor" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>

            {/* illustration: transparent PNG, so no blend mode is needed */}
            <div className="hp-art hp-rise" ref={artRef} style={{ '--hp-d': '200ms' } as React.CSSProperties}>
              <div className="hp-rays" aria-hidden="true" />
              <div className="hp-fig">
                <picture>
                  <source srcSet="/images/PenjagaBerjubahEnamTangan-ink.webp" type="image/webp" />
                  <img
                    src="/images/PenjagaBerjubahEnamTangan-ink.png"
                    alt="Hooded six-armed guardian holding a key, a bug, a gear, a magnifying glass, a skull and a flag, symbolizing CTF skills across disciplines"
                    width={520}
                    height={520}
                    decoding="async"
                    loading="eager"
                    fetchPriority="high"
                    draggable={false}
                  />
                </picture>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <section className="hp-marquee" aria-label="Events played">
        <div className="hp-track" ref={trackRef} aria-hidden="true">
          {[0, 1].map((copy) => (
            <div className="hp-mq-group" key={copy}>
              {marqueeEvents.map((name, i) => (
                <React.Fragment key={`${copy}-${i}`}>
                  <span className="hp-mq-item">{name}</span>
                  <span className="hp-mq-dot" />
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="hp-stats" id="stats-block" aria-label="CTFtime ranking">
        <div className="hp-inner">
          <div className="hp-stats-head">
            <span className="hp-label">CTFtime ranking 2026</span>
            <a
              className="hp-stats-link"
              href="https://ctftime.org/team/408130"
              target="_blank"
              rel="noopener noreferrer"
            >
              ctftime.org →
            </a>
          </div>

          <div className="hp-stats-row">
            <div className="hp-origin">
              <div className="hp-flag" role="img" aria-label="Indonesian flag" />
              <div>
                <div className="hp-label">Asal</div>
                <div className="hp-origin-name">Indonesia</div>
              </div>
            </div>

            <div className="hp-stats-grid">
              <div className="hp-stat-item">
                <div className="hp-display hp-big hp-big--hot">
                  <CountUp to={countryRank} prefix="#" />
                </div>
                <div className="hp-big-cap">Indonesia</div>
              </div>
              <div className="hp-stat-item">
                <div className="hp-display hp-big">
                  <CountUp to={globalRank} prefix="#" />
                </div>
                <div className="hp-big-cap">Worldwide</div>
              </div>
              <div className="hp-stat-item">
                <div className="hp-display hp-big hp-big--mint">
                  <CountUp to={ratingPoints} decimals={2} />
                </div>
                <div className="hp-big-cap">Points</div>
              </div>
              <div className="hp-stat-item">
                <div className="hp-display hp-big">
                  <CountUp to={totalCtfEvents} />
                </div>
                <div className="hp-big-cap">Events</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TABLE ===== */}
      <section className="hp-section hp-section--table" id="performance-table">
        <div className="hp-inner">
          <Reveal className="hp-table-head">
            <h2 className="hp-display hp-h2">CTF Performance &amp; Writeups</h2>
            <span className="hp-count">
              {eventsExpanded ? `All ${tree.length} events` : `Showing ${Math.min(EVENTS_PER_PAGE, tree.length)} of ${tree.length} events`} · {totalWriteups} writeups
            </span>
          </Reveal>

          <Reveal mode="rows" className="hp-tablewrap">
            <table className="hp-table">
              <thead>
                <tr>
                  <th scope="col">Event name</th>
                  <th scope="col" className="r">Writeups</th>
                  <th scope="col" className="r">Categories</th>
                  <th scope="col">Latest solved</th>
                  <th scope="col" className="r">Rank / Place</th>
                  <th scope="col" className="r">Points</th>
                  <th scope="col" className="r">Team</th>
                </tr>
              </thead>
              <tbody>
                {displayEvents.map((event, rowIndex) => {
                  const ctftimeEvent = ctftimeProfile
                    ? findCtftimeEvent(event.name, ctftimeProfile)
                    : undefined;

                  let place: string | number = '—';
                  if (ctftimeEvent?.place !== undefined && ctftimeEvent?.place !== null) {
                    place = ctftimeEvent.place;
                  } else {
                    const matchedKey = Object.keys(EVENT_PLACES).find(
                      (k) => k.toLowerCase() === event.name.toLowerCase()
                    );
                    if (matchedKey) place = EVENT_PLACES[matchedKey];
                  }

                  let points: string | number = '—';
                  if (ctftimeEvent?.points !== undefined && ctftimeEvent?.points !== null) {
                    points = ctftimeEvent.points;
                  } else {
                    const totalLocalPoints = event.categories.reduce(
                      (sum, cat) =>
                        sum +
                        cat.writeups.reduce((catSum, w) => {
                          const pts = Number(w.points);
                          return catSum + (isNaN(pts) ? 0 : pts);
                        }, 0),
                      0
                    );
                    if (totalLocalPoints > 0) points = totalLocalPoints;
                  }

                  const team = ctftimeEvent?.team || ctftimeProfile?.teamName || 'Personal';

                  const dates = event.categories
                    .flatMap((cat) => cat.writeups.map((w) => w.date))
                    .filter(Boolean) as string[];
                  const latestDate = dates.length > 0 ? [...dates].sort().reverse()[0] : '—';

                  return (
                    <tr
                      key={event.slug}
                      className="hp-row"
                      style={{ '--hp-d': `${Math.min(rowIndex, 10) * 60}ms` } as React.CSSProperties}
                      onClick={() => onEventClick?.(event.slug)}
                    >
                      <td>
                        <button type="button" className="hp-name">
                          {event.name}
                        </button>
                      </td>
                      <td className="r">{event.totalWriteups}</td>
                      <td className="r">{event.categories.length}</td>
                      <td>{latestDate}</td>
                      <td className="r hp-strong">{typeof place === 'number' ? `#${place}` : place}</td>
                      <td className="r">
                        {typeof points === 'number' ? points.toLocaleString('en-US') : points}
                      </td>
                      <td className="r hp-team">{team}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Reveal>

          {tree.length > EVENTS_PER_PAGE && (
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={() => setEventsExpanded((prev) => !prev)}
                className="group relative inline-flex items-center gap-3 px-6 py-3 bg-[#FFFDF5] text-[#141413] border-2 border-[#141413] font-mono text-xs uppercase tracking-widest font-bold shadow-[3px_3px_0_0_#141413] hover:shadow-[5px_5px_0_0_#141413] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#141413] transition-all cursor-pointer"
              >
                <span className="w-2 h-2 bg-[#BF3511] transition-transform duration-200 group-hover:scale-125" />
                <span>
                  {eventsExpanded
                    ? '[-] COLLAPSE ARCHIVE (SHOW 10 RECENT)'
                    : `[+] EXTEND ARCHIVE — SHOW ALL ${tree.length} EVENTS`}
                </span>
                <span className="text-[10px] text-[#BF3511] transition-transform duration-200">
                  {eventsExpanded ? '▲' : '▼'}
                </span>
              </button>
            </div>
          )}
        </div>
      </section>

      <p className="hp-foot">
        (This archive is regularly updated as new events are completed and analyzed)
      </p>
    </div>
  );
}
