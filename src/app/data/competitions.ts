import { WriteUp } from './writeups';

export interface ChallengeNode {
  id: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  solved: boolean;
  points: number;
}

export interface CategoryNode {
  name: string;
  color: string;
  challenges: ChallengeNode[];
  icon: string;
}

export interface CompetitionEvent {
  id: string;
  name: string;
  ctfName: string;
  year?: number;
  date: string;
  description: string;
  place?: string;
  teamName?: string;
  categories: Map<string, CategoryNode>;
  totalSolves: number;
  totalPoints: number;
}

/**
 * Category color scheme for hacker aesthetic
 */
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  'Web': { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: 'language' },
  'Crypto': { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: 'lock' },
  'Pwn': { bg: 'bg-red-500/10', text: 'text-red-400', icon: 'bug_report' },
  'Forensics': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: 'search' },
  'Reverse': { bg: 'bg-orange-500/10', text: 'text-orange-400', icon: 'settings' },
  'OSINT': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', icon: 'public' },
  'Misc': { bg: 'bg-green-500/10', text: 'text-green-400', icon: 'extension' }
};

/**
 * Build competition events from flat writeup list
 */
export function buildCompetitionStructure(writeups: WriteUp[]): CompetitionEvent[] {
  const competitionMap = new Map<string, CompetitionEvent>();

  writeups.forEach((writeup) => {
    if (!competitionMap.has(writeup.ctfName)) {
      competitionMap.set(writeup.ctfName, {
        id: writeup.ctfName.toLowerCase().replace(/\s+/g, '-'),
        name: writeup.ctfName,
        ctfName: writeup.ctfName,
        date: writeup.date,
        description: `CTF competition - ${writeup.ctfName}`,
        categories: new Map(),
        totalSolves: 0,
        totalPoints: 0,
      });
    }

    const competition = competitionMap.get(writeup.ctfName)!;

    if (!competition.categories.has(writeup.category)) {
      const categoryColor = CATEGORY_COLORS[writeup.category] || CATEGORY_COLORS['Misc'];
      competition.categories.set(writeup.category, {
        name: writeup.category,
        color: categoryColor.bg,
        challenges: [],
        icon: categoryColor.icon,
      });
    }

    const category = competition.categories.get(writeup.category)!;
    category.challenges.push({
      id: writeup.id,
      title: writeup.title,
      category: writeup.category,
      difficulty: writeup.difficulty,
      solved: true,
      points: writeup.points,
    });

    competition.totalSolves += 1;
    competition.totalPoints += writeup.points;
  });

  return Array.from(competitionMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
