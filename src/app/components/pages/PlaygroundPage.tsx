import { useState, useEffect, useRef } from 'react';
import { BreachProtocol } from './BreachProtocol';
import { CyberMastermind } from './CyberMastermind';
import { Activity, Key, ChevronLeft, Gamepad2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// HTML5 Canvas Pixel Animation Background Component
function PixelBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    // Track mouse positioning
    let mouse = { x: -1000, y: -1000, radius: 80 };

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      alpha: number;
      decay: number;
    }

    let particles: Particle[] = [];
    const maxParticles = 65;

    const createParticle = (yPos = height + 10): Particle => {
      return {
        x: Math.random() * width,
        y: yPos,
        size: Math.floor(Math.random() * 6) + 3, // 3px to 8px pixel blocks
        speedY: -(Math.random() * 0.8 + 0.3),
        alpha: Math.random() * 0.5 + 0.2,
        decay: Math.random() * 0.002 + 0.001,
      };
    };

    // Initialize particles across the canvas height initially
    for (let i = 0; i < maxParticles; i++) {
      particles.push(createParticle(Math.random() * height));
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Render & update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Move particle
        p.y += p.speedY;
        p.alpha -= p.decay;

        // Interaction with mouse (pixels push away slightly)
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          p.x += (dx / dist) * force * 2;
        }

        // Draw pixel block (no rounded arcs, pure retro square pixels)
        ctx.fillStyle = `rgba(212, 77, 38, ${p.alpha})`; // Accent Rust color
        ctx.fillRect(p.x, p.y, p.size, p.size);

        // Reset if transparent or out of bounds
        if (p.alpha <= 0 || p.y < -10) {
          particles[i] = createParticle();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-40" />;
}

export function PlaygroundPage() {
  const [selectedGame, setSelectedGame] = useState<'menu' | 'breach' | 'cipher'>('menu');

  return (
    <div className="space-y-6 relative min-h-[calc(100vh-12rem)] flex flex-col">
      {/* Back button visible only inside a game */}
      {selectedGame !== 'menu' && (
        <button
          type="button"
          onClick={() => setSelectedGame('menu')}
          className="self-start flex items-center gap-1.5 px-3 py-1.5 border border-[var(--docs-border-soft)] hover:border-[var(--docs-text)] text-xs font-mono font-bold uppercase rounded bg-[var(--docs-bg)] hover:bg-[var(--docs-surface-hover)] text-[var(--docs-text-muted)] hover:text-[var(--docs-text)] cursor-pointer transition-all mb-2 shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Arcade</span>
        </button>
      )}

      <AnimatePresence mode="wait">
        {selectedGame === 'menu' ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col justify-between space-y-8 relative"
          >
            {/* Header Banner */}
            <div className="flex items-start justify-between border-b border-[var(--docs-border)] pb-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-6 w-6 text-[var(--docs-accent)]" />
                  <h1 className="text-3xl font-bold font-display text-[var(--docs-text)] tracking-tighter">
                    Hacker Arcade
                  </h1>
                </div>
                <p className="text-sm font-serif text-[var(--docs-text-muted)] italic">
                  Select a sandbox node to override security firewalls.
                </p>
              </div>
            </div>

            {/* Menu Selection Cards Area */}
            <div className="relative flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-6 border border-dashed border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)]/20 rounded-xl overflow-hidden min-h-[22rem]">
              {/* Floating pixels animation background */}
              <PixelBackground />

              {/* Game Card 1: Breach Protocol */}
              <div
                onClick={() => setSelectedGame('breach')}
                className="relative z-10 group border border-[var(--docs-border-soft)] hover:border-[var(--docs-accent)] bg-[var(--docs-bg)] p-6 rounded-lg cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md h-full flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded bg-[var(--docs-accent-soft)] border border-[var(--docs-accent-border)] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Activity className="h-6 w-6 text-[var(--docs-accent)]" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-mono font-bold text-[var(--docs-text)] uppercase tracking-wide group-hover:text-[var(--docs-accent)] transition-colors">
                      Breach Protocol
                    </h3>
                    <p className="text-xs font-serif text-[var(--docs-text-muted)] leading-relaxed">
                      Override firewalls by picking sequences of hex values from an alternating row and column grid.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--docs-accent)] pt-6 mt-auto">
                  <span>BOOT CODENAME: BREACH</span>
                  <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* Game Card 2: Cipher Decryptor */}
              <div
                onClick={() => setSelectedGame('cipher')}
                className="relative z-10 group border border-[var(--docs-border-soft)] hover:border-[var(--docs-accent)] bg-[var(--docs-bg)] p-6 rounded-lg cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md h-full flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded bg-[var(--docs-accent-soft)] border border-[var(--docs-accent-border)] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Key className="h-6 w-6 text-[var(--docs-accent)]" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-mono font-bold text-[var(--docs-text)] uppercase tracking-wide group-hover:text-[var(--docs-accent)] transition-colors">
                      Cipher Decryptor
                    </h3>
                    <p className="text-xs font-serif text-[var(--docs-text-muted)] leading-relaxed">
                      Deduce the 4-digit unique hexadecimal key. Analyze LOCKS and KEYS indicators to break the cipher.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--docs-accent)] pt-6 mt-auto">
                  <span>BOOT CODENAME: CIPHER</span>
                  <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.2 }}
            className="flex-1 rounded-lg border border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)]/10 p-2"
          >
            {selectedGame === 'breach' ? <BreachProtocol /> : <CyberMastermind />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
