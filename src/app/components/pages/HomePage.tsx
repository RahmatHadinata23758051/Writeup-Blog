import { Hero } from '../Hero';
import { WriteUpCard } from '../WriteUpCard';
import { writeups } from '../../data/writeups';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

interface HomePageProps {
  onNavigate: (page: string) => void;
  onSelectWriteUp: (id: string) => void;
}

export function HomePage({ onNavigate, onSelectWriteUp }: HomePageProps) {
  const recentWriteUps = writeups.slice(0, 3);

  return (
    <div>
      <Hero onNavigate={onNavigate} />

      {/* Recent Write-Ups Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-foreground">Recent Write-Ups</h2>
            <p className="text-muted-foreground">
              Latest CTF challenges and solutions
            </p>
          </div>
          <Button
            onClick={() => onNavigate('writeups')}
            variant="outline"
            className="hidden sm:flex border-primary/20 hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentWriteUps.map((writeup) => (
            <WriteUpCard
              key={writeup.id}
              writeup={writeup}
              onSelect={onSelectWriteUp}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-center sm:hidden">
          <Button
            onClick={() => onNavigate('writeups')}
            variant="outline"
            className="w-full border-primary/20 hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            View All Write-Ups
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Categories Section */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-foreground">Categories</h2>
            <p className="text-muted-foreground">
              Explore write-ups by challenge type
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {['Web', 'Crypto', 'Pwn', 'Forensics', 'Reverse', 'OSINT'].map(
              (category) => {
                const count = writeups.filter(
                  (w) => w.category === category
                ).length;
                return (
                  <div
                    key={category}
                    className="rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                  >
                    <h3 className="mb-1 text-foreground">{category}</h3>
                    <p className="text-sm text-muted-foreground">
                      {count} {count === 1 ? 'write-up' : 'write-ups'}
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
