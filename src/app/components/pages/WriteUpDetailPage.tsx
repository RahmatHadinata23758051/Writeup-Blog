import { BsArrowLeft, BsCalendarEvent, BsTrophy, BsTools, BsFlag, BsEye, BsEyeSlash, BsListCheck, BsShield, BsLightbulb, BsPerson, BsFileText, BsClipboard, BsCheck } from 'react-icons/bs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { writeups } from '../../data/writeups';
import { useState, useEffect, useRef } from 'react';

interface WriteUpDetailPageProps {
  writeupId: string;
  onBack: () => void;
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

export function WriteUpDetailPage({ writeupId, onBack }: WriteUpDetailPageProps) {
  const [flagVisible, setFlagVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('challenge-info');
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const writeup = writeups.find((w) => w.id === writeupId);

  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    Object.values(sectionsRef.current).forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = sectionsRef.current[sectionId];
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  if (!writeup) {
    return (
      <div className="min-h-screen py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-muted-foreground">Write-up not found.</p>
        </div>
      </div>
    );
  }

  const tableOfContents = [
    { id: 'challenge-info', label: 'Challenge Information' },
    { id: 'tools', label: 'Tools Used' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'solution', label: 'Exploitation & Solution' },
    { id: 'flag', label: 'Flag' },
    { id: 'lessons', label: 'Lessons Learned' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Button
            onClick={onBack}
            variant="ghost"
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <BsArrowLeft className="mr-2 h-4 w-4" />
            Back to Write-Ups
          </Button>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={categoryColors[writeup.category]}>
              {writeup.category}
            </Badge>
            <Badge variant="outline" className={difficultyColors[writeup.difficulty]}>
              {writeup.difficulty}
            </Badge>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <BsPerson className="mr-1 h-3 w-3" />
              Official Write-Up
            </Badge>
          </div>

          <h1 className="mb-4 text-foreground">{writeup.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="text-primary/80">{writeup.ctfName}</span>
            <span className="flex items-center gap-1">
              <BsCalendarEvent className="h-4 w-4" />
              {new Date(writeup.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1">
              <BsTrophy className="h-4 w-4" />
              {writeup.points} points
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Author:</span>
            <span className="text-primary font-mono">{writeup.author}</span>
          </div>

          <div className="mt-4 rounded-md border border-border/50 bg-secondary/30 px-4 py-2">
            <p className="text-xs text-muted-foreground italic flex items-center gap-2">
              <BsFileText className="h-3 w-3" /> Published manually by the author • Read-only archive
            </p>
          </div>
        </div>
      </div>

      {/* Content with Sidebar */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Sticky Table of Contents - Desktop Only */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-4 text-sm text-foreground flex items-center gap-2">
                  <BsListCheck className="h-4 w-4 text-primary" />
                  Table of Contents
                </h3>
                <nav className="space-y-1">
                  {tableOfContents.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`block w-full text-left rounded px-3 py-2 text-sm transition-colors ${
                        activeSection === item.id
                          ? 'bg-primary/10 text-primary border-l-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 max-w-4xl">
            {/* Challenge Information */}
            <section
              id="challenge-info"
              ref={(el) => (sectionsRef.current['challenge-info'] = el)}
              className="mb-12 scroll-mt-24"
            >
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-foreground flex items-center gap-2">
                  <BsShield className="h-5 w-5 text-primary" />
                  Challenge Description
                </h2>
                <p className="text-foreground/90 leading-relaxed">{writeup.problemDescription}</p>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Event</p>
                      <p className="text-foreground">{writeup.ctfName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Category</p>
                      <p className="text-foreground">{writeup.category}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Difficulty</p>
                      <p className="text-foreground">{writeup.difficulty}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Points</p>
                      <p className="text-foreground">{writeup.points}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Tools Used */}
            <section
              id="tools"
              ref={(el) => (sectionsRef.current['tools'] = el)}
              className="mb-12 scroll-mt-24"
            >
              <h2 className="mb-4 text-foreground flex items-center gap-2">
                <BsTools className="h-5 w-5 text-primary" />
                Tools Used
              </h2>
              <div className="flex flex-wrap gap-2">
                {writeup.tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground font-mono hover:border-primary/50 transition-colors"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </section>

            {/* Analysis */}
            <section
              id="analysis"
              ref={(el) => (sectionsRef.current['analysis'] = el)}
              className="mb-12 scroll-mt-24"
            >
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-foreground">Analysis</h2>
                <p className="text-foreground/90 leading-relaxed">{writeup.analysis}</p>
              </div>
            </section>

            {/* Solution Steps */}
            <section
              id="solution"
              ref={(el) => (sectionsRef.current['solution'] = el)}
              className="mb-12 scroll-mt-24"
            >
              <h2 className="mb-6 text-foreground">Exploitation & Solution Steps</h2>
              <div className="space-y-6">
                {writeup.solution.map((step, index) => (
                  <div key={index} className="rounded-lg border border-border bg-card p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                        <span className="text-sm text-primary">{index + 1}</span>
                      </div>
                      <h3 className="text-foreground pt-0.5">{step.title}</h3>
                    </div>
                    <p className="mb-4 text-foreground/90 ml-10 leading-relaxed">{step.content}</p>
                    {step.code && (
                      <div className="ml-10">
                        <div className="rounded-lg border border-border bg-secondary/50 p-4 overflow-x-auto relative">
                          <button
                            onClick={() => handleCopyCode(step.code || '', index)}
                            className="absolute top-2 right-2 p-2 rounded-md bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
                            title="Copy code"
                          >
                            {copiedCodeIndex === index ? (
                              <BsCheck className="h-4 w-4 text-primary" />
                            ) : (
                              <BsClipboard className="h-4 w-4 text-primary" />
                            )}
                          </button>
                          <pre className="text-sm text-foreground/90">
                            <code className="font-mono">{step.code}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Flag */}
            <section
              id="flag"
              ref={(el) => (sectionsRef.current['flag'] = el)}
              className="mb-12 scroll-mt-24"
            >
              <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6">
                <h2 className="mb-4 text-foreground flex items-center gap-2">
                  <BsFlag className="h-5 w-5 text-primary" />
                  Flag
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    {flagVisible ? (
                      <code className="block rounded-md border border-border bg-secondary px-4 py-3 font-mono text-sm text-primary">
                        {writeup.flag}
                      </code>
                    ) : (
                      <div className="rounded-md border border-border bg-secondary px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          Flag hidden - click to reveal
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => setFlagVisible(!flagVisible)}
                    variant="outline"
                    size="icon"
                    className="border-primary/20 hover:border-primary hover:bg-primary hover:text-primary-foreground shrink-0"
                  >
                    {flagVisible ? (
                      <BsEyeSlash className="h-4 w-4" />
                    ) : (
                      <BsEye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </section>

            {/* Lessons Learned */}
            <section
              id="lessons"
              ref={(el) => (sectionsRef.current['lessons'] = el)}
              className="mb-12 scroll-mt-24"
            >
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-foreground flex items-center gap-2">
                  <BsLightbulb className="h-5 w-5 text-primary" />
                  Lessons Learned
                </h2>
                <p className="text-foreground/90 leading-relaxed">{writeup.lessonsLearned}</p>
              </div>
            </section>

            {/* Footer Attribution */}
            <div className="rounded-lg border border-border/50 bg-secondary/20 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                This write-up was curated and published by{' '}
                <span className="text-primary font-mono">{writeup.author}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
