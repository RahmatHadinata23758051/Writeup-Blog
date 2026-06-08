import React from 'react';

interface HackerLayoutProps {
  children: React.ReactNode;
  title?: string;
  showSidebar?: boolean;
}

export const HackerLayout: React.FC<HackerLayoutProps> = ({
  children,
  title,
  showSidebar = true,
}) => {
  return (
    <div className="relative min-h-screen bg-background text-on-background overflow-hidden">
      {/* Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)] opacity-30"></div>

      {/* Grid Background */}
      <div className="fixed inset-0 bg-matrix z-[-1]"></div>

      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-40 flex justify-between items-center px-6 h-16 bg-neutral-950 border-b border-green-950/30 shadow-[0_0_15px_rgba(0,255,65,0.1)]">
        <div className="text-xl font-black text-green-400 tracking-tighter drop-shadow-[0_0_5px_rgba(34,197,94,0.5)] font-headline">
          CORTEX_ARCHIVE
        </div>
        <div className="hidden md:flex space-x-8">
          <a href="#" className="font-headline tracking-[0.05em] uppercase text-xs text-green-900 hover:text-green-300 transition-colors py-5">
            COMPETITIONS
          </a>
          <a href="#" className="font-headline tracking-[0.05em] uppercase text-xs text-green-900 hover:text-green-300 transition-colors py-5">
            ABOUT
          </a>
          <a href="#" className="font-headline tracking-[0.05em] uppercase text-xs text-green-900 hover:text-green-300 transition-colors py-5">
            CONTACT
          </a>
        </div>
        <div className="flex space-x-4">
          <button className="text-green-400 hover:text-green-300 transition-colors">
            <span className="text-sm">⚡</span>
          </button>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        {showSidebar && (
          <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-64px)] bg-neutral-950 border-r border-green-950/20 pt-8 flex-shrink-0 z-30">
            <div className="px-6 mb-8">
              <h2 className="text-green-400 font-bold text-sm tracking-[0.1em] mb-1 font-headline">
                SYSTEM_ROOT
              </h2>
              <p className="text-green-900/60 text-[10px] uppercase font-headline tracking-[0.1em]">
                AUTH_LEVEL: ANALYST
              </p>
            </div>
            <nav className="flex-1 flex flex-col space-y-2">
              <a href="#" className="flex items-center space-x-3 bg-green-500/10 text-green-400 border-l-4 border-green-400 pl-4 py-3 hover:bg-neutral-800 transition-all duration-150 font-headline text-[10px] uppercase tracking-[0.1em]">
                <span>📊</span>
                <span>COMPETITIONS</span>
              </a>
              <a href="#" className="flex items-center space-x-3 text-green-900/60 pl-4 py-3 hover:bg-neutral-800 hover:text-green-400 transition-all duration-150 hover:translate-x-1 font-headline text-[10px] uppercase tracking-[0.1em]">
                <span>📈</span>
                <span>STATISTICS</span>
              </a>
              <a href="#" className="flex items-center space-x-3 text-green-900/60 pl-4 py-3 hover:bg-neutral-800 hover:text-green-400 transition-all duration-150 hover:translate-x-1 font-headline text-[10px] uppercase tracking-[0.1em]">
                <span>🔧</span>
                <span>TOOLS</span>
              </a>
              <a href="#" className="flex items-center space-x-3 text-green-900/60 pl-4 py-3 hover:bg-neutral-800 hover:text-green-400 transition-all duration-150 hover:translate-x-1 font-headline text-[10px] uppercase tracking-[0.1em]">
                <span>📚</span>
                <span>ARCHIVE</span>
              </a>
            </nav>
            <div className="p-4">
              <button className="w-full bg-primary-container text-on-primary-container hover:shadow-[0_0_15px_rgba(0,255,65,0.5)] font-headline uppercase tracking-widest text-xs py-3 transition-all duration-200">
                SCAN_SYSTEM
              </button>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
};
