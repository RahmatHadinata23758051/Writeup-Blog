import React, { useMemo } from 'react';
import { writeups } from '../../data/writeups';
import { buildCompetitionStructure, CATEGORY_COLORS } from '../../data/competitions';
import { HackerLayout } from '../HackerLayout';

interface CategoryDetailPageProps {
  ctfName: string;
  category: string;
  onSelectChallenge: (id: string) => void;
  onBack: () => void;
}

export const CategoryDetailPage: React.FC<CategoryDetailPageProps> = ({
  ctfName,
  category,
  onSelectChallenge,
  onBack,
}) => {
  const competitions = useMemo(() => buildCompetitionStructure(writeups), []);
  const competition = competitions.find((c) => c.ctfName === ctfName);
  const categoryData = competition?.categories.get(category);

  if (!competition || !categoryData) {
    return (
      <HackerLayout>
        <div className="text-center py-12">
          <p className="text-red-400 font-headline">Category not found</p>
        </div>
      </HackerLayout>
    );
  }

  const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS['Misc'];
  const challenges = categoryData.challenges;

  return (
    <HackerLayout>
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="space-y-6 border-b border-outline-variant/20 pb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary-fixed-dim hover:text-primary-container transition-colors font-headline text-sm uppercase tracking-widest"
          >
            ← Back to {competition.name}
          </button>
          <div>
            <h1 className={`font-headline text-5xl md:text-6xl font-bold ${categoryColor.text} tracking-[0.05em] text-glow uppercase`}>
              {category}
            </h1>
            <p className="text-on-surface-variant mt-4">
              {challenges.length} challenges • {challenges.reduce((sum, c) => sum + c.points, 0)} total points
            </p>
          </div>
        </header>

        {/* Challenges Grid */}
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {challenges.map((challenge) => {
              const writeup = writeups.find((w) => w.id === challenge.id);
              const getColorClasses = () => {
                switch (category) {
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
                switch (category) {
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
                  key={challenge.id}
                  onClick={() => onSelectChallenge(challenge.id)}
                  className={`${getColorClasses()} border transition-all duration-300 cursor-pointer group overflow-hidden relative`}
                >
                  {/* Decorative corners */}
                  <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${getCategoryTextClass()} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${getCategoryTextClass()} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                  {/* Header */}
                  <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/15">
                    <h2 className={`font-headline text-lg font-bold ${getCategoryTextClass()} group-hover:text-green-300 transition-colors uppercase tracking-wider`}>
                      {challenge.title}
                    </h2>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Description */}
                    {writeup && (
                      <p className="text-sm text-on-surface-variant line-clamp-2">
                        {writeup.description || writeup.problemDescription.substring(0, 100)}...
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-on-surface-variant text-xs">Difficulty</span>
                        <p className="text-primary-fixed-dim font-bold uppercase">
                          {challenge.difficulty}
                        </p>
                      </div>
                      <div>
                        <span className="text-on-surface-variant text-xs">Points</span>
                        <p className="text-primary-fixed-dim font-bold">
                          {challenge.points || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Solved Badge */}
                    <div className="pt-2 border-t border-outline-variant/15">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span className="text-xs text-green-400 font-bold uppercase">Solved</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-surface-container-low px-6 py-3 border-t border-outline-variant/15">
                    <button className={`w-full font-headline text-xs ${getCategoryTextClass()} hover:text-green-300 uppercase tracking-widest transition-colors text-center`}>
                      READ WRITEUP →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Category Info */}
        {challenges.length > 0 && (
          <section className="bg-surface-container border border-outline-variant/15 p-6">
            <h3 className="font-headline text-lg font-bold text-primary-container uppercase mb-4">
              Category Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-2xl font-bold text-primary-container font-headline">
                  {challenges.length}
                </div>
                <p className="text-sm text-on-surface-variant uppercase font-headline tracking-widest">
                  Challenges
                </p>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-container font-headline">
                  {challenges.filter((c) => c.difficulty === 'Easy').length}
                </div>
                <p className="text-sm text-on-surface-variant uppercase font-headline tracking-widest">
                  Easy
                </p>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-container font-headline">
                  {challenges.filter((c) => c.difficulty === 'Medium').length}
                </div>
                <p className="text-sm text-on-surface-variant uppercase font-headline tracking-widest">
                  Medium
                </p>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-container font-headline">
                  {challenges.filter((c) => c.difficulty === 'Hard').length}
                </div>
                <p className="text-sm text-on-surface-variant uppercase font-headline tracking-widest">
                  Hard
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </HackerLayout>
  );
};
