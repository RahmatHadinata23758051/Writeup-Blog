import { useState, useEffect, useRef } from 'react';
import { BreachProtocol } from './BreachProtocol';
import { CyberMastermind } from './CyberMastermind';
import { Activity, Key, ChevronLeft, Gamepad2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Retro 8-bit animated typing hacker component
function PixelHacker() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sprite resolution (16x16)
    const size = 16;
    const pixelScale = 4.5; // Scale pixels to be crisp and visible
    canvas.width = size * pixelScale;
    canvas.height = size * pixelScale;

    // Rust theme color palette
    const PALETTE: Record<string, string> = {
      '.': 'transparent',
      'H': '#3a2212', // Hair (brown)
      'S': '#fcd2b2', // Skin (peach)
      'T': '#d44d26', // Shirt (accent rust)
      'L': '#2b2b2b', // Laptop body (dark charcoal)
      'G': '#ffe6cc', // Screen glow (warm white)
      'D': '#8a5a36', // Desk (wood brown)
      'W': '#ffb366', // Typing sparks
    };

    // Frame A: Arms resting, screen glow normal
    const FRAME_A = [
      "....HHHH........",
      "...HHHHHH.......",
      "...HSSSSHH......",
      "...HSSSSH.......",
      "....SSSS........",
      "...TTTTTT.......",
      "..TTTTTTTT......",
      ".TTTTTTTTTT.....",
      ".TT......TT.....",
      ".........TT.GG..",
      ".........TTLGG.L",
      "..........LLLLLL",
      "..........LLLL..",
      "DDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDD",
      "................"
    ];

    // Frame B: Left arm typing, sparks rising
    const FRAME_B = [
      "....HHHH........",
      "...HHHHHH.......",
      "...HSSSSHH......",
      "...HSSSSH.......",
      "....SSSS........",
      "...TTTTTT.......",
      "..TTTTTTTT......",
      ".TTTTTTTTTT.....",
      ".TT.T....TT..W..",
      "...T.....TT.GG..",
      ".........TTLGG.L",
      "..........LLLLLL",
      "..........LLLL..",
      "DDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDD",
      "................"
    ];

    // Frame C: Right arm typing, sparks rising
    const FRAME_C = [
      "....HHHH........",
      "...HHHHHH.......",
      "...HSSSSHH......",
      "...HSSSSH.......",
      "....SSSS........",
      "...TTTTTT.......",
      "..TTTTTTTT......",
      ".TTTTTTTTTT.....",
      ".TT......TT.T...",
      ".........TT.GGT.",
      ".........TTLGG.L",
      "..........LLLLLL",
      "..........LLLL..",
      "DDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDD",
      "................"
    ];

    const frames = [FRAME_A, FRAME_B, FRAME_C, FRAME_B];
    let currentFrameIdx = 0;

    const drawFrame = (frame: string[]) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false; // Keep pixels sharp

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const char = frame[r][c];
          const color = PALETTE[char];
          if (color && color !== 'transparent') {
            ctx.fillStyle = color;
            ctx.fillRect(c * pixelScale, r * pixelScale, pixelScale, pixelScale);
          }
        }
      }
    };

    // Cycle through animation frames every 180ms
    const interval = setInterval(() => {
      currentFrameIdx = (currentFrameIdx + 1) % frames.length;
      drawFrame(frames[currentFrameIdx]);
    }, 180);

    // Initial render
    drawFrame(frames[0]);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative p-1 bg-[var(--docs-surface)] border border-[var(--docs-border-soft)] rounded shadow-sm shrink-0 flex items-center justify-center w-20 h-20">
      <canvas ref={canvasRef} className="block" style={{ imageRendering: 'pixelated' }} />
    </div>
  );
}

// HTML5 Canvas Pixel Animation Background Component (Ambient background)
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
        size: Math.floor(Math.random() * 6) + 3,
        speedY: -(Math.random() * 0.8 + 0.3),
        alpha: Math.random() * 0.5 + 0.2,
        decay: Math.random() * 0.002 + 0.001,
      };
    };

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

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speedY;
        p.alpha -= p.decay;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          p.x += (dx / dist) * force * 2;
        }

        ctx.fillStyle = `rgba(212, 77, 38, ${p.alpha})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);

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
            {/* Header Banner with animated pixel-art typing hacker mascot */}
            <div className="flex items-center justify-between border-b border-[var(--docs-border)] pb-4 gap-4">
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
              <PixelHacker />
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
