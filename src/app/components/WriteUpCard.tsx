import { BsCalendarEvent, BsTrophy, BsArrowRight } from 'react-icons/bs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { WriteUp } from '../data/writeups';

interface WriteUpCardProps {
  writeup: WriteUp;
  onSelect: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  Web: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Crypto: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Pwn: 'bg-red-500/10 text-red-400 border-red-500/20',
  Forensics: 'bg-green-500/10 text-green-400 border-green-500/20',
  Reverse: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  OSINT: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Misc: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const difficultyColors: Record<string, string> = {
  Easy: 'bg-green-500/10 text-green-400 border-green-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Hard: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function WriteUpCard({ writeup, onSelect }: WriteUpCardProps) {
  return (
    <div className="group rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      {/* Header with badges */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={categoryColors[writeup.category]}
        >
          {writeup.category}
        </Badge>
        <Badge
          variant="outline"
          className={difficultyColors[writeup.difficulty]}
        >
          {writeup.difficulty}
        </Badge>
        <div className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
          <BsTrophy className="h-4 w-4" />
          <span>{writeup.points} pts</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="mb-2 text-foreground group-hover:text-primary transition-colors">
        {writeup.title}
      </h3>

      {/* CTF Name and Date */}
      <div className="mb-3 flex items-center gap-4 text-sm text-muted-foreground">
        <span className="text-primary/80">{writeup.ctfName}</span>
        <span className="flex items-center gap-1">
          <BsCalendarEvent className="h-3.5 w-3.5" />
          {new Date(writeup.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Description */}
      <p className="mb-4 text-muted-foreground line-clamp-2">
        {writeup.description}
      </p>

      {/* Author Badge */}
      <div className="mb-3">
        <span className="inline-flex items-center text-xs text-muted-foreground/70">
          <span className="font-mono">by {writeup.author}</span>
        </span>
      </div>

      {/* Tools */}
      <div className="mb-4 flex flex-wrap gap-2">
        {writeup.tools.slice(0, 3).map((tool) => (
          <span
            key={tool}
            className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground"
          >
            {tool}
          </span>
        ))}
        {writeup.tools.length > 3 && (
          <span className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">
            +{writeup.tools.length - 3} more
          </span>
        )}
      </div>

      {/* Read button */}
      <Button
        onClick={() => onSelect(writeup.id)}
        variant="outline"
        className="group/btn w-full border-primary/20 hover:border-primary hover:bg-primary hover:text-primary-foreground"
      >
        Read Write-Up
        <BsArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
      </Button>
    </div>
  );
}