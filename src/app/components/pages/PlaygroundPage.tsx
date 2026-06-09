import { useState } from 'react';
import { BreachProtocol } from './BreachProtocol';
import { CyberMastermind } from './CyberMastermind';
import { Activity, Key } from 'lucide-react';
import { motion } from 'motion/react';

export function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState<'breach' | 'cipher'>('breach');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between border-b border-[var(--docs-border)] pb-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold font-display text-[var(--docs-text)] tracking-tighter">
            Hacker Arcade
          </h1>
          <p className="text-sm font-serif text-[var(--docs-text-muted)] italic">
            Interactive hacking sandboxes & cryptographic overrides.
          </p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-[var(--docs-bg-soft)] p-1 rounded-lg border border-[var(--docs-border-soft)] max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('breach')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded font-mono text-xs uppercase font-bold cursor-pointer transition-all ${
            activeTab === 'breach'
              ? 'bg-[var(--docs-text)] text-[var(--docs-bg)] shadow'
              : 'text-[var(--docs-text-muted)] hover:text-[var(--docs-text)]'
          }`}
        >
          <Activity className="h-4.5 w-4.5 shrink-0" />
          <span>Breach Protocol</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cipher')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded font-mono text-xs uppercase font-bold cursor-pointer transition-all ${
            activeTab === 'cipher'
              ? 'bg-[var(--docs-text)] text-[var(--docs-bg)] shadow'
              : 'text-[var(--docs-text-muted)] hover:text-[var(--docs-text)]'
          }`}
        >
          <Key className="h-4.5 w-4.5 shrink-0" />
          <span>Cipher Decryptor</span>
        </button>
      </div>

      {/* Active Game Container */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-lg border border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)]/10 p-2"
      >
        {activeTab === 'breach' ? <BreachProtocol /> : <CyberMastermind />}
      </motion.div>
    </div>
  );
}
