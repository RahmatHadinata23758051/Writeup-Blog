import React from 'react';
import type { DocsEventNode } from '../../data/docsTree';
import { InlineWriteup } from '../docs/InlineWriteup';

interface DocsEventPageProps {
  event: DocsEventNode;
}

export function DocsEventPage({ event }: DocsEventPageProps) {
  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="space-y-4 border-b border-[var(--docs-border-soft)] pb-8">
        <h1 className="text-4xl font-bold text-[var(--docs-text)]">{event.name}</h1>
        <p className="text-lg text-[var(--docs-text-muted)]">
          Solutions and notes for this event.
        </p>
        
        <div className="flex gap-6 text-sm">
          <div>
            <div className="font-semibold text-[var(--docs-text)]">{event.totalWriteups}</div>
            <div className="text-[var(--docs-text-soft)]">
              writeup{event.totalWriteups !== 1 ? 's' : ''}
            </div>
          </div>
          <div>
            <div className="font-semibold text-[var(--docs-text)]">{event.categories.length}</div>
            <div className="text-[var(--docs-text-soft)]">
              category{event.categories.length !== 1 ? 'ies' : ''}
            </div>
          </div>
        </div>
      </section>

      {/* Categories and Inline Challenges */}
      <div className="space-y-16">
        {event.categories.map((category) => (
          <section
            key={category.slug}
            id={`category-${category.slug}`}
            className="space-y-8"
          >
            {/* Category Title */}
            <h2 className="text-2xl font-bold text-[var(--docs-text)] border-b border-[var(--docs-border-soft)] pb-2">
              {category.name}
            </h2>

            {/* Challenges list */}
            <div className="space-y-12 divide-y divide-[var(--docs-border-soft)]">
              {category.writeups.map((writeup) => (
                <div key={writeup.id} className="pt-8 first:pt-0">
                  <InlineWriteup writeup={writeup.original} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
