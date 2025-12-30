import { useState } from 'react';
import { WriteUpCard } from '../WriteUpCard';
import { writeups, Category } from '../../data/writeups';
import { ListFilter } from 'lucide-react';

interface WriteUpsPageProps {
  onSelectWriteUp: (id: string) => void;
}

export function WriteUpsPage({ onSelectWriteUp }: WriteUpsPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');

  const categories: (Category | 'All')[] = ['All', 'Web', 'Crypto', 'Pwn', 'Forensics', 'Reverse', 'OSINT'];

  const filteredWriteUps =
    selectedCategory === 'All'
      ? writeups
      : writeups.filter((w) => w.category === selectedCategory);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="mb-2 text-foreground">All Write-Ups</h1>
          <p className="text-muted-foreground">
            Browse all CTF challenges and solutions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ListFilter className="h-4 w-4" />
              <span>Filter:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-md border px-4 py-2 text-sm transition-all ${
                    selectedCategory === category
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {category}
                  {category !== 'All' && (
                    <span className="ml-2 text-xs opacity-70">
                      ({writeups.filter((w) => w.category === category).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Write-ups grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {filteredWriteUps.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredWriteUps.map((writeup) => (
              <WriteUpCard
                key={writeup.id}
                writeup={writeup}
                onSelect={onSelectWriteUp}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              No write-ups found for this category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}