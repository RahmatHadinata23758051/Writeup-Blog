import { useState, useEffect, useMemo } from 'react';
import { updateMetaTags } from './utils/seoManager';
import { DocsLayout } from './components/docs/DocsLayout';
import { DocsSidebar } from './components/docs/DocsSidebar';
import { DocsSearch } from './components/docs/DocsSearch';
import { DocsHomePage } from './components/pages/DocsHomePage';
import { DocsEventPage } from './components/pages/DocsEventPage';
import { DocsWriteupPage } from './components/pages/DocsWriteupPage';
import { buildDocsTree } from './data/docsTree';
import { writeups } from './data/writeups';
import { validateWriteups } from './data/validateWriteups';
import { ctftimeProfile } from './data/ctftimeProfile';

// Dev-only writeup validation — warnings appear in browser console only during development
if (import.meta.env.DEV) {
  const warnings = validateWriteups(writeups);
  if (warnings.length > 0) {
    console.groupCollapsed(`[Writeup Validation] ${warnings.length} warning(s)`);
    warnings.forEach((w) => console.warn(w));
    console.groupEnd();
  }
}

// Build the static documentation tree once
const docsTree = buildDocsTree(writeups);

// ===== HELPER FUNCTION FOR WRITEUP TOC =====
function getWriteupTocItems(writeup: typeof writeups[0]) {
  const items: Array<{ id: string; label: string; depth?: number }> = [];

  if (
    (typeof writeup.problemDescription === 'string' &&
      writeup.problemDescription.trim().length > 0) ||
    (typeof writeup.description === 'string' && writeup.description.trim().length > 0)
  ) {
    items.push({ id: 'description', label: 'Challenge Description', depth: 0 });
  }


  if (typeof writeup.analysis === 'string' && writeup.analysis.trim().length > 0) {
    items.push({ id: 'analysis', label: 'Analysis', depth: 0 });
  }

  if (Array.isArray(writeup.solution) && writeup.solution.length > 0) {
    items.push({ id: 'solution', label: 'Solution', depth: 0 });
  }

  if (Array.isArray(writeup.terminalOutputs) && writeup.terminalOutputs.length > 0) {
    items.push({ id: 'terminal-output', label: 'Terminal Output', depth: 0 });
  }

  if (typeof writeup.flag === 'string' && writeup.flag.trim().length > 0) {
    items.push({ id: 'flag', label: 'Flag', depth: 0 });
  }

  if (typeof writeup.lessonsLearned === 'string' && writeup.lessonsLearned.trim().length > 0) {
    items.push({ id: 'lessons-learned', label: 'Lessons Learned', depth: 0 });
  }

  return items;
}

type DocsView = { type: 'home' } | { type: 'event'; eventSlug: string } | { type: 'writeup'; writeupId: string };

export default function App() {
  const [docsView, setDocsView] = useState<DocsView>({ type: 'home' });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

  // Handle Hash Navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\//, '');
      if (!hash) {
        setDocsView({ type: 'home' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const parts = hash.split('/');
      let shouldScrollToTop = true;

      if (parts[0] === 'event' && parts[1]) {
        setDocsView({ type: 'event', eventSlug: parts[1] });
      } else if (parts[0] === 'writeup' && parts[1]) {
        const writeupId = parts.slice(1).join('/');

        // Find the event for this writeup
        let foundEventSlug = '';
        for (const event of docsTree) {
          for (const category of event.categories) {
            if (category.writeups.some((w) => w.id === writeupId)) {
              foundEventSlug = event.slug;
              break;
            }
          }
          if (foundEventSlug) break;
        }

        if (foundEventSlug) {
          setPendingScrollId(`writeup-${writeupId}`);
          setDocsView({ type: 'event', eventSlug: foundEventSlug });
          shouldScrollToTop = false;
        } else {
          setDocsView({ type: 'home' });
        }
      } else {
        setDocsView({ type: 'home' });
      }

      if (shouldScrollToTop) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    // Initial parse
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update URL hash when state changes
  const handleNavigate = (view: DocsView) => {
    if (view.type === 'home') {
      window.location.hash = '#/';
    } else if (view.type === 'event') {
      window.location.hash = `#/event/${view.eventSlug}`;
    } else if (view.type === 'writeup') {
      window.location.hash = `#/writeup/${view.writeupId}`;
    }
  };

  // Scroll to pending element after view renders
  useEffect(() => {
    if (pendingScrollId) {
      const element = document.getElementById(pendingScrollId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setPendingScrollId(null);
      } else {
        const timer = setTimeout(() => {
          const retryElement = document.getElementById(pendingScrollId);
          if (retryElement) {
            retryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          setPendingScrollId(null);
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [docsView, pendingScrollId]);

  // Global keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalWriteups = docsTree.reduce((sum, evt) => sum + evt.totalWriteups, 0);
  const totalCategories = new Set(
    docsTree.flatMap((e) => e.categories.map((c) => c.name))
  ).size;

  // Find active event and writeup
  let activeEvent = undefined;
  let activeWriteupNode = undefined;

  if (docsView.type === 'event') {
    activeEvent = docsTree.find((e) => e.slug === docsView.eventSlug);
    if (!activeEvent) {
      updateMetaTags({ title: 'Event Not Found - Nattt' });
    } else {
      updateMetaTags({ title: `${activeEvent.name} - Nattt` });
    }
  } else if (docsView.type === 'writeup') {
    for (const event of docsTree) {
      for (const category of event.categories) {
        const writeup = category.writeups.find((w) => w.id === docsView.writeupId);
        if (writeup) {
          activeWriteupNode = writeup;
          activeEvent = event;
          break;
        }
      }
      if (activeWriteupNode) break;
    }
    if (activeWriteupNode) {
      updateMetaTags({ title: `${activeWriteupNode.title} - Nattt` });
    } else {
      updateMetaTags({ title: 'Writeup Not Found - Nattt' });
    }
  } else {
    updateMetaTags({ title: 'Nattt', description: 'Nattt CTF Writeups Collection' });
  }

  // Generate TOC based on view
  const tocItems = useMemo(() => {
    if (docsView.type === 'home') {
      return []; // Return empty array so DocsLayout collapses the right side on Home
    } else if (docsView.type === 'event' && activeEvent) {
      const items: Array<{ id: string; label: string; depth?: number }> = [];

      for (const category of activeEvent.categories) {
        items.push({
          id: `category-${category.slug}`,
          label: category.name,
          depth: 1,
        });

        for (const writeup of category.writeups) {
          items.push({
            id: `writeup-${writeup.id}`,
            label: writeup.title,
            depth: 2,
          });
        }
      }
      return items;
    } else if (docsView.type === 'writeup' && activeWriteupNode) {
      return getWriteupTocItems(activeWriteupNode.original);
    }
    return [];
  }, [docsView, activeEvent, activeWriteupNode]);

  // Render content based on view
  const renderDocsContent = () => {
    if (docsView.type === 'event') {
      if (!activeEvent) return <div className="p-8 text-center text-[var(--docs-text)]">Event not found.</div>;
      return (
        <DocsEventPage event={activeEvent} />
      );
    } else if (docsView.type === 'writeup') {
      if (!activeWriteupNode) return <div className="p-8 text-center text-[var(--docs-text)]">Writeup not found.</div>;
      return <DocsWriteupPage writeup={activeWriteupNode.original} />;
    }
    // default to home
    return (
      <DocsHomePage
        tree={docsTree}
        totalWriteups={totalWriteups}
        totalCategories={totalCategories}
        onEventClick={(eventSlug) => handleNavigate({ type: 'event', eventSlug })}
        onWriteupClick={(writeupId) => handleNavigate({ type: 'writeup', writeupId })}
        ctftimeProfile={ctftimeProfile}
      />
    );
  };

  return (
    <>
      <DocsSearch
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        tree={docsTree}
        onWriteupSelect={(writeupId) => {
          handleNavigate({ type: 'writeup', writeupId });
          setIsSearchOpen(false);
        }}
      />
      <DocsLayout
        title="Nattt"
        toc={tocItems}
        sidebar={
          <DocsSidebar
            mode="events-only"
            tree={docsTree}
            activeEventSlug={activeEvent?.slug}
            activeWriteupId={activeWriteupNode?.id}
            onHomeClick={() => handleNavigate({ type: 'home' })}
            onEventClick={(eventSlug) => handleNavigate({ type: 'event', eventSlug })}
            onWriteupClick={(writeupId) => handleNavigate({ type: 'writeup', writeupId })}
          />
        }
        onHomeClick={() => handleNavigate({ type: 'home' })}
        onSearchClick={() => setIsSearchOpen(true)}
      >
        {renderDocsContent()}
      </DocsLayout>
    </>
  );
}
