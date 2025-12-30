import { BsArrowRight, BsLightningCharge } from 'react-icons/bs';
import { Button } from './ui/button';

interface HeroProps {
  onNavigate: (page: string) => void;
}

export function Hero({ onNavigate }: HeroProps) {
  return (
    <div className="relative overflow-hidden border-b border-border bg-card">
      {/* Grid background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="text-center">
          {/* Terminal icon accent */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
              <BsLightningCharge className="h-12 w-12 text-primary" />
            </div>
          </div>

          {/* Main heading */}
          <h1 className="mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-4xl sm:text-5xl lg:text-6xl tracking-tight text-transparent">
            CTF Write-Ups &<br />
            Cybersecurity Notes
          </h1>

          {/* Team Badge */}
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
              <BsLightningCharge className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono text-primary">by RBLX-Labs Segfault</span>
            </div>
          </div>

          {/* Subtitle */}
          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground text-lg sm:text-xl">
            Curated CTF write-ups and security research from our team. 
            Explore detailed solutions, exploitation techniques, and technical insights 
            from competitions worldwide.
          </p>

          {/* CTA Button */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => onNavigate('writeups')}
              className="group bg-primary text-primary-foreground hover:bg-primary/90"
            >
              View Write-Ups
              <BsArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-8">
            <div className="rounded-lg border border-border bg-card/50 p-4">
              <div className="text-2xl sm:text-3xl text-primary">6</div>
              <div className="mt-1 text-sm text-muted-foreground">Write-Ups</div>
            </div>
            <div className="rounded-lg border border-border bg-card/50 p-4">
              <div className="text-2xl sm:text-3xl text-primary">6</div>
              <div className="mt-1 text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="rounded-lg border border-border bg-card/50 p-4">
              <div className="text-2xl sm:text-3xl text-primary">1,680</div>
              <div className="mt-1 text-sm text-muted-foreground">Points</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}