import React, { useMemo } from 'react';
import { writeups } from '../../data/writeups';
import { buildCompetitionStructure } from '../../data/competitions';
import { HackerLayout } from '../HackerLayout';

interface CompetitionListPageProps {
  onSelectCompetition: (ctfName: string) => void;
}

export const CompetitionListPage: React.FC<CompetitionListPageProps> = ({
  onSelectCompetition,
}) => {
  const competitions = useMemo(() => buildCompetitionStructure(writeups), []);

  return (
    <HackerLayout title="CTF Competition Archive">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="space-y-6">
          <div className="relative">
            <h1 className="font-headline text-5xl md:text-6xl font-bold text-primary-container tracking-[0.05em] text-glow uppercase">
              CTF Archive
            </h1>
            <p className="text-on-surface-variant mt-4 text-lg">
              Explore competitions, categories, and challenges
            </p>
          </div>
        </header>

        {/* Competition Grid */}
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.map((competition) => {
              const categoryCount = competition.categories.size;
              const challengeCount = Array.from(competition.categories.values()).reduce(
                (sum, cat) => sum + cat.challenges.length,
                0
              );

              return (
                <div
                  key={competition.id}
                  onClick={() => onSelectCompetition(competition.ctfName)}
                  className="bg-surface-container border border-outline-variant/15 hover:border-primary-container/50 hover:shadow-[0_0_20px_rgba(0,255,65,0.2)] transition-all duration-300 cursor-pointer group overflow-hidden"
                >
                  {/* Decorative corners */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary-container opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary-container opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  {/* Header */}
                  <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/15">
                    <h2 className="font-headline text-lg font-bold text-primary-container group-hover:text-green-300 transition-colors uppercase tracking-wider">
                      {competition.name}
                    </h2>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <div className="space-y-2 text-sm text-on-surface-variant">
                      <div className="flex justify-between">
                        <span>Categories:</span>
                        <span className="text-primary-fixed-dim font-bold">{categoryCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Challenges:</span>
                        <span className="text-primary-fixed-dim font-bold">{challengeCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Points:</span>
                        <span className="text-primary-fixed-dim font-bold">{competition.totalPoints}</span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="pt-4 border-t border-outline-variant/15">
                      <p className="text-xs text-primary-fixed-dim font-headline tracking-widest uppercase">
                        Date: {new Date(competition.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-surface-container-low px-6 py-3 border-t border-outline-variant/15">
                    <button className="w-full font-headline text-xs text-primary-fixed-dim hover:text-primary-container uppercase tracking-widest transition-colors text-center">
                      EXPLORE →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-surface-container border border-outline-variant/15 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-2xl font-bold text-primary-container font-headline">
                {competitions.length}
              </div>
              <p className="text-sm text-on-surface-variant uppercase font-headline tracking-widest">
                Competitions
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-container font-headline">
                {writeups.length}
              </div>
              <p className="text-sm text-on-surface-variant uppercase font-headline tracking-widest">
                Writeups
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-container font-headline">
                {competitions.reduce((sum, c) => sum + c.totalPoints, 0)}
              </div>
              <p className="text-sm text-on-surface-variant uppercase font-headline tracking-widest">
                Total Points
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-container font-headline">
                {new Set(writeups.map(w => w.category)).size}
              </div>
              <p className="text-sm text-on-surface-variant uppercase font-headline tracking-widest">
                Categories
              </p>
            </div>
          </div>
        </section>
      </div>
    </HackerLayout>
  );
};
