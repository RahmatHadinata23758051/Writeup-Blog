import React, { useEffect, useId, useRef, useState } from 'react';

interface MermaidDiagramProps {
  code: string;
  className?: string;
  title?: string;
}

/**
 * Checks if a code snippet is a Mermaid diagram definition.
 * Uses word boundaries to avoid false positives like `pie_base = ...`
 */
export function isMermaidCode(raw: string): boolean {
  if (!raw) return false;
  const trimmed = raw.trimStart();
  return /^(flowchart(\s+[A-Za-z]{2})?|graph\s+[A-Za-z]{2}|sequenceDiagram|classDiagram|stateDiagram(-v2)?|erDiagram|journey|gantt|pie(\s+title|\s+showData|\s*\n)|gitGraph|mindmap|quadrantChart|timeline|sankey-beta|block-beta|architecture(-beta)?)\b/i.test(
    trimmed
  );
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  code,
  className = '',
  title,
}) => {
  const [svgHtml, setSvgHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, '_');

  const cleanCode = code.trim();

  useEffect(() => {
    let isCancelled = false;

    async function renderDiagram() {
      try {
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default;

        mermaid.initialize({
          startOnLoad: false,
          // Prevent Mermaid from injecting its own "Syntax error in text" SVG
          // into document.body when a diagram is invalid. We render our own
          // compact fallback below instead.
          suppressErrorRendering: true,
          securityLevel: 'loose',
          fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
          theme: 'base',
          themeVariables: {
            darkMode: false,
            background: 'transparent',
            primaryColor: '#E9E6DC',
            primaryBorderColor: 'rgba(26, 26, 26, 0.22)',
            primaryTextColor: '#1A1A1A',
            secondaryColor: '#DFDCD2',
            secondaryBorderColor: 'rgba(26, 26, 26, 0.22)',
            secondaryTextColor: '#1A1A1A',
            tertiaryColor: '#F2F0E9',
            tertiaryBorderColor: 'rgba(26, 26, 26, 0.15)',
            tertiaryTextColor: '#1A1A1A',
            lineColor: '#D44D26', // Terracotta accent line
            textColor: '#1A1A1A',
            nodeBorder: 'rgba(26, 26, 26, 0.25)',
            clusterBkg: 'rgba(233, 230, 220, 0.4)',
            clusterBorder: 'rgba(26, 26, 26, 0.15)',
            edgeLabelBackground: '#F2F0E9',
            fontSize: '12px',
          },
        });

        // Parse first so Mermaid syntax failures use our compact raw-code fallback
        // instead of injecting Mermaid's large error SVG into the article.
        await mermaid.parse(cleanCode);

        const id = `mermaid_${reactId}_${Date.now()}`;
        const { svg: rawSvg } = await mermaid.render(id, cleanCode);
        const cleanSvg = rawSvg
          .replace(/<svg\s+[^>]*id="[^"]*"/, `<svg id="${id}"`)
          .replace(/#dmermaid/g, `#${id}`);

        // Clean up any stray error SVGs that Mermaid may have appended
        // to document.body even with suppressErrorRendering=true.
        document.querySelectorAll('svg[id^="mermaid-"][style*="display: none"]')
          .forEach(el => el.remove());

        if (!isCancelled) {
          setSvgHtml(cleanSvg);
          setError(null);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('Mermaid rendering failed:', err);
          setError(err?.message || 'Failed to render diagram');
        }
      }
    }

    renderDiagram();

    return () => {
      isCancelled = true;
    };
  }, [cleanCode, reactId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      ref={containerRef}
      className={`my-4 rounded border border-[var(--docs-border-soft)] bg-[var(--docs-bg)] overflow-hidden shadow-xs ${className} ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-auto bg-[var(--docs-bg)] p-6 shadow-2xl border-[var(--docs-border)]' : ''
      }`}
    >
      {/* Header bar matching krauq bookish aesthetic */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[var(--docs-bg-soft)]/60 border-b border-[var(--docs-border-soft)] text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-[var(--docs-accent)]/15 text-[var(--docs-accent)] border border-[var(--docs-accent)]/30">
            Diagram
          </span>
          {title && (
            <span className="font-serif font-medium text-[var(--docs-text)] text-xs truncate max-w-xs">
              {title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 font-sans">
          <button
            type="button"
            onClick={() => setShowRaw(!showRaw)}
            className="px-2 py-0.5 rounded text-[10px] font-mono text-[var(--docs-text-muted)] hover:text-[var(--docs-text)] hover:bg-[var(--docs-surface)] transition cursor-pointer"
            title="Toggle between SVG diagram and raw mermaid text"
          >
            {showRaw ? 'Show Diagram' : 'View Code'}
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-2 py-0.5 rounded text-[10px] font-mono text-[var(--docs-text-muted)] hover:text-[var(--docs-text)] hover:bg-[var(--docs-surface)] transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? 'Exit' : 'Zoom'}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-0.5 rounded text-[10px] font-mono text-[var(--docs-text-muted)] hover:text-[var(--docs-text)] hover:bg-[var(--docs-surface)] transition cursor-pointer"
            title="Copy diagram source"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      {showRaw || error ? (
        <div className="p-3 bg-[var(--docs-code-bg)] text-[var(--docs-code-text)]">
          {error && (
            <div className="mb-2 text-[11px] font-mono text-[var(--docs-danger)] bg-[var(--docs-danger)]/10 px-2 py-1 rounded">
              Rendering error: fallback to raw code
            </div>
          )}
          <pre className="overflow-x-auto text-[11.5px] font-mono leading-relaxed whitespace-pre font-light">
            <code>{cleanCode}</code>
          </pre>
        </div>
      ) : svgHtml ? (
        <div
          className="p-4 md:p-6 overflow-x-auto flex justify-center items-center bg-[var(--docs-bg)] select-none [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:transition-transform"
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      ) : (
        <div className="p-8 flex items-center justify-center text-[var(--docs-text-soft)] text-xs font-mono">
          <span className="inline-block animate-pulse">Rendering diagram...</span>
        </div>
      )}
    </div>
  );
};
