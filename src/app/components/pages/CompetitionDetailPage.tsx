import React, { useMemo } from 'react';
import { writeups } from '../../data/writeups';
import { buildCompetitionStructure, CATEGORY_COLORS } from '../../data/competitions';
import { HackerLayout } from '../HackerLayout';

interface CompetitionDetailPageProps {
  ctfName: string;
  onSelectCategory: (category: string) => void;
  onBack: () => void;
}

export const CompetitionDetailPage: React.FC<CompetitionDetailPageProps> = ({
  ctfName,
  onSelectCategory,
  onBack,
}) => {
  const competitions = useMemo(() => buildCompetitionStructure(writeups), []);
  const competition = competitions.find((c) => c.ctfName === ctfName);

  if (!competition) {
    return (
      <HackerLayout>
        <div className="text-center py-12">
          <p className="text-red-400 font-headline">Competition not found</p>
        </div>
      </HackerLayout>
    );
  }

  const categories = Array.from(competition.categories.values());

  return (
    <HackerLayout>
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="space-y-6 border-b border-outline-variant/20 pb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary-fixed-dim hover:text-primary-container transition-colors font-headline text-sm uppercase tracking-widest"
          >
            ← Back to Competitions
          </button>
          <div>
            <h1 className="font-headline text-5xl md:text-6xl font-bold text-primary-container tracking-[0.05em] text-glow uppercase">
              {competition.name}
            </h1>
            <p className="text-on-surface-variant mt-4">
              {categories.length} categories • {competition.totalSolves} challenges solved
            </p>
          </div>
        </header>

        {/* Categories Grid */}
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const categoryColor =
                CATEGORY_COLORS[category.name] || CATEGORY_COLORS['Misc'];

              const getColorClasses = () => {
                switch (category.name) {
                  case 'Web':
                    return 'bg-blue-500/10 border-blue-400/30 hover:border-blue-400';
                  case 'Crypto':
                    return 'bg-purple-500/10 border-purple-400/30 hover:border-purple-400';
                  case 'Pwn':
                    return 'bg-red-500/10 border-red-400/30 hover:border-red-400';
                  case 'Forensics':
                    return 'bg-yellow-500/10 border-yellow-400/30 hover:border-yellow-400';
                  case 'Reverse':
                    return 'bg-orange-500/10 border-orange-400/30 hover:border-orange-400';
                  case 'OSINT':
                    return 'bg-cyan-500/10 border-cyan-400/30 hover:border-cyan-400';
                  default:
                    return 'bg-green-500/10 border-green-400/30 hover:border-green-400';
                }
              };

              const getCategoryTextClass = () => {
                switch (category.name) {
                  case 'Web':
                    return 'text-blue-400';
                  case 'Crypto':
                    return 'text-purple-400';
                  case 'Pwn':
                    return 'text-red-400';
                  case 'Forensics':
                    return 'text-yellow-400';
                  case 'Reverse':
                    return 'text-orange-400';
                  case 'OSINT':
                    return 'text-cyan-400';
                  default:
                    return 'text-green-400';
                }
              };

              return (
                <div
                  key={category.name}
                  onClick={() => onSelectCategory(category.name)}
                  className={`${getColorClasses()} border transition-all duration-300 cursor-pointer group overflow-hidden relative`}
                >
                  {/* Decorative corners */}
                  <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${getCategoryTextClass()} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${getCategoryTextClass()} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                  {/* Header */}
                  <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/15">
                    <h2 className={`font-headline text-lg font-bold ${getCategoryTextClass()} group-hover:text-green-300 transition-colors uppercase tracking-wider`}>
                      {category.name}
                    </h2>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <div className="space-y-3">
                      {category.challenges.slice(0, 5).map((challenge) => (
                        <div
                          key={challenge.id}
                          className="flex justify-between items-center text-sm text-on-surface-variant hover:text-on-surface transition-colors"
                        >
                          <span className="truncate">{challenge.title}</span>
                          <span className="text-xs font-bold px-2 py-1 rounded bg-surface-container/50">
                            {challenge.difficulty}
                          </span>
                        </div>
                      ))}
                      {category.challenges.length > 5 && (
                        <div className="text-xs text-primary-fixed-dim pt-2">
                          +{category.challenges.length - 5} more challenges
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-surface-container-low px-6 py-3 border-t border-outline-variant/15">
                    <button className={`w-full font-headline text-xs ${getCategoryTextClass()} hover:text-green-300 uppercase tracking-widest transition-colors text-center`}>
                      VIEW {category.challenges.length} CHALLENGES →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </HackerLayout>
  );
};
