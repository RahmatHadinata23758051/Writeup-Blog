import { useState, useEffect, useRef } from 'react';
import { Terminal, RefreshCw, Volume2, VolumeX, Lock, Unlock, HelpCircle, ArrowLeft, ShieldAlert, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Web Audio API Synthesizer (re-used for Codebreaker)
class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playBeep(freq = 600, duration = 0.08, type: OscillatorType = 'triangle') {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playSuccess() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const playTone = (freq: number, start: number, dur: number) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + dur);
      };

      playTone(587.33, now, 0.1); // D5
      playTone(739.99, now + 0.08, 0.1); // F#5
      playTone(880.00, now + 0.16, 0.1); // A5
      playTone(1174.66, now + 0.24, 0.35); // D6
    } catch (e) {}
  }

  playFailure() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.45);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.45);
    } catch (e) {}
  }
}

const synth = new SoundSynthesizer();

const HEX_CHARS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];

interface Attempt {
  guess: string[];
  exactMatches: number; // correct digit & position
  partialMatches: number; // correct digit, wrong position
}

export function CyberMastermind() {
  const [targetCode, setTargetCode] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [maxAttempts] = useState<number>(8);
  const [gameState, setGameState] = useState<'welcome' | 'playing' | 'success' | 'failure'>('welcome');
  const [isMuted, setIsMuted] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    synth.muted = !isMuted;
    synth.playBeep(440, 0.05);
  };

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString().split(' ')[0];
    setConsoleLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  // Generate a secret 4-digit code (non-repeating for better logical solvability)
  const generateSecretCode = () => {
    const pool = [...HEX_CHARS];
    const code: string[] = [];
    for (let i = 0; i < 4; i++) {
      const randIdx = Math.floor(Math.random() * pool.length);
      code.push(pool[randIdx]);
      pool.splice(randIdx, 1); // Remove to prevent repeats
    }
    setTargetCode(code);
    setAttempts([]);
    setCurrentGuess([]);
    setGameState('playing');
    setConsoleLogs([]);
    
    addLog('CIPHER CRACKER INTRUSION ACTIVE');
    addLog('4-DIGIT UNIQUE HEX KEY DETECTED');
    addLog('FIREWALL WILL TRIGGER AFTER 8 REJECTED GUESSES');
  };

  const startNewGame = () => {
    generateSecretCode();
    synth.playBeep(880, 0.15, 'sine');
  };

  // Keypad click handler
  const handleKeyClick = (char: string) => {
    if (gameState !== 'playing') return;
    if (currentGuess.length >= 4) return;

    synth.playBeep(600, 0.05, 'triangle');
    setCurrentGuess([...currentGuess, char]);
  };

  // Clear last character
  const handleBackspace = () => {
    if (currentGuess.length === 0) return;
    synth.playBeep(450, 0.05, 'sine');
    setCurrentGuess(currentGuess.slice(0, -1));
  };

  // Submit current guess
  const handleSubmitGuess = () => {
    if (gameState !== 'playing') return;
    if (currentGuess.length !== 4) return;

    // Check exact and partial matches
    let exactMatches = 0;
    let partialMatches = 0;

    const targetCopy = [...targetCode];
    const guessCopy = [...currentGuess];

    // Count exact matches
    for (let i = 0; i < 4; i++) {
      if (guessCopy[i] === targetCopy[i]) {
        exactMatches++;
        targetCopy[i] = '_';
        guessCopy[i] = '*';
      }
    }

    // Count partial matches
    for (let i = 0; i < 4; i++) {
      if (guessCopy[i] !== '*') {
        const matchIdx = targetCopy.indexOf(guessCopy[i]);
        if (matchIdx !== -1) {
          partialMatches++;
          targetCopy[matchIdx] = '_';
        }
      }
    }

    const newAttempt: Attempt = {
      guess: currentGuess,
      exactMatches,
      partialMatches
    };

    const nextAttempts = [...attempts, newAttempt];
    setAttempts(nextAttempts);
    setCurrentGuess([]);
    
    addLog(`GUESS SUBMITTED: ${currentGuess.join('')} | MATCHES: ${exactMatches} LOCKS, ${partialMatches} KEY-VALS`);

    // Success condition
    if (exactMatches === 4) {
      setGameState('success');
      synth.playSuccess();
      addLog('ROOT ACCESS OVERRIDE SUCCESSFUL — TERMINAL SECURED');
      return;
    }

    // Failure condition
    if (nextAttempts.length >= maxAttempts) {
      setGameState('failure');
      synth.playFailure();
      addLog(`ACCESS DENIED. LOCKOUT ACTIVATED. CORRECT KEY WAS: ${targetCode.join('')}`);
    } else {
      synth.playBeep(330, 0.2, 'sawtooth');
    }
  };

  // Scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--docs-border)] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-[var(--docs-accent)] animate-pulse" />
            <h1 className="text-xl font-mono tracking-widest font-bold text-[var(--docs-text)]">
              CIPHER_DECRYPTOR.SYS
            </h1>
          </div>
          <p className="text-xs font-mono text-[var(--docs-text-muted)] mt-1">
            Mastermind Hacking Terminal. Deduce the 4-digit unique hexadecimal access key.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 border border-[var(--docs-border-soft)] hover:border-[var(--docs-text)] rounded transition-colors text-[var(--docs-text-muted)] hover:text-[var(--docs-text)] cursor-pointer"
            title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {isMuted ? <VolumeX className="h-4.5 w-4.5 text-red-500" /> : <Volume2 className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {/* STATES */}
      <AnimatePresence mode="wait">
        {gameState === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-8 border border-[var(--docs-border)] bg-[var(--docs-bg-soft)] rounded-lg text-center space-y-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-600 via-amber-900 to-black bg-[size:4px_4px] bg-repeat"></div>
            
            <div className="mx-auto w-16 h-16 rounded-full border-2 border-[var(--docs-accent)] border-dashed flex items-center justify-center animate-spin-slow">
              <Key className="h-8 w-8 text-[var(--docs-accent)]" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-lg font-mono font-bold text-[var(--docs-text)] uppercase tracking-wide">
                DECRYPTION INTERFACE: OFFLINE
              </h2>
              <p className="text-sm text-[var(--docs-text-muted)]">
                Deduce a 4-digit unique hexadecimal code (`0-9` and `A-F`). You have 8 attempts before the database lock overrides.
              </p>
            </div>

            <div className="border border-[var(--docs-border-soft)] rounded-md bg-[var(--docs-bg)] p-4 max-w-md mx-auto text-left space-y-2">
              <h4 className="text-xs font-mono font-bold text-[var(--docs-text)] flex items-center gap-1.5 border-b border-[var(--docs-border-soft)] pb-1.5 mb-2">
                <HelpCircle className="h-3.5 w-3.5" /> PETUNJUK DEKRIPSI:
              </h4>
              <ul className="text-xs font-mono text-[var(--docs-text-muted)] space-y-1.5 list-inside list-decimal">
                <li>Input 4 digit heksadesimal unik.</li>
                <li><span className="font-bold text-amber-700">LOCKS Indicator</span>: Berapa banyak digit yang nilainya benar DAN posisinya pas.</li>
                <li><span className="font-bold text-slate-700">KEYS Indicator</span>: Berapa banyak digit yang nilainya benar tapi posisinya salah.</li>
                <li>Gunakan petunjuk tersebut untuk mempersempit tebakanmu berikutnya!</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={startNewGame}
              className="px-8 py-3 bg-[var(--docs-accent)] hover:bg-[var(--docs-accent)]/90 text-white font-mono rounded tracking-widest text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer uppercase"
            >
              INITIALIZE CIPHER OVERRIDE
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* LEFT AREA: GUESS HISTORY (Col span 7) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between font-mono bg-[var(--docs-bg-soft)] border border-[var(--docs-border-soft)] px-3 py-2 rounded">
                <span className="text-xs text-[var(--docs-text-muted)] uppercase tracking-wider font-bold">GUESS DECRYPTION HISTORY</span>
                <span className="text-xs text-[var(--docs-accent)] font-bold font-mono">
                  ATTEMPT: {attempts.length}/{maxAttempts}
                </span>
              </div>

              {/* Attempt Rows */}
              <div className="border border-[var(--docs-border)] bg-[var(--docs-bg-soft)] rounded-lg p-4 space-y-2 h-76 overflow-y-auto custom-scrollbar">
                {attempts.length === 0 && (
                  <div className="h-full flex items-center justify-center text-xs font-mono text-[var(--docs-text-soft)] italic">
                    NO GUESS ATTEMPTS LODGED YET. INPUT A KEY TO START.
                  </div>
                )}
                {attempts.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[var(--docs-bg)] border border-[var(--docs-border-soft)] rounded-md p-2 font-mono text-xs shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[var(--docs-text-soft)] font-bold">#{idx + 1}</span>
                      <div className="flex gap-1.5">
                        {att.guess.map((char, cIdx) => (
                          <span key={cIdx} className="w-6 h-6 flex items-center justify-center font-bold bg-[var(--docs-bg-soft)] border border-[var(--docs-border-soft)] rounded text-xs">
                            {char}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Feedback markers */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        <Lock className="h-3 w-3 shrink-0 text-amber-700" />
                        <span>{att.exactMatches} LOCKS</span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-500/10 border border-slate-500/20 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        <Key className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                        <span>{att.partialMatches} KEYS</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Current Input Display */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-[var(--docs-text-muted)] font-bold uppercase tracking-wider">
                  CURRENT ACCESS KEY ATTEMPT
                </span>
                <div className="flex gap-3 justify-center p-3 border border-[var(--docs-border-soft)] bg-[var(--docs-bg)] rounded-lg">
                  {Array.from({ length: 4 }).map((_, idx) => {
                    const value = currentGuess[idx];
                    return (
                      <div
                        key={idx}
                        className={`
                          w-12 h-12 flex items-center justify-center font-mono text-base font-bold rounded border
                          ${value
                            ? 'bg-[var(--docs-text)] border-[var(--docs-text)] text-[var(--docs-bg)] scale-105 shadow-md'
                            : 'bg-transparent border-[var(--docs-border-soft)] text-[var(--docs-text-soft)] border-dashed animate-pulse'
                          }
                          transition-all duration-200
                        `}
                      >
                        {value || ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT AREA: INPUT KEYPAD & LOGS (Col span 5) */}
            <div className="lg:col-span-5 space-y-4">
              {/* KEYPAD */}
              <div className="border border-[var(--docs-border)] bg-[var(--docs-bg-soft)] rounded-lg p-4 space-y-3.5">
                <div className="grid grid-cols-4 gap-2">
                  {HEX_CHARS.map(char => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => handleKeyClick(char)}
                      disabled={currentGuess.length >= 4}
                      className="h-10 bg-[var(--docs-bg)] border border-[var(--docs-border-soft)] hover:border-[var(--docs-accent)] hover:bg-[var(--docs-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono font-bold rounded shadow-sm transition-all cursor-pointer"
                    >
                      {char}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleBackspace}
                    disabled={currentGuess.length === 0}
                    className="py-2.5 bg-transparent border border-[var(--docs-border)] text-xs font-mono rounded hover:bg-[var(--docs-surface-hover)] disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    CLEAR
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitGuess}
                    disabled={currentGuess.length !== 4}
                    className="py-2.5 bg-[var(--docs-accent)] text-white font-mono text-xs rounded hover:bg-[var(--docs-accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed shadow transition-colors cursor-pointer"
                  >
                    SUBMIT GUEST
                  </button>
                </div>
              </div>

              {/* CONSOLE TERMINAL LOGS */}
              <div className="border border-[var(--docs-border)] bg-[var(--docs-code-bg)] rounded-lg p-3 space-y-2 text-[var(--docs-accent)] font-mono text-[10.5px] h-38 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                  <span className="flex items-center gap-1.5 text-[var(--docs-accent)] font-bold">
                    <Terminal className="h-3.5 w-3.5" /> SYSTEM LOGS
                  </span>
                  <span className="text-[9px] text-[var(--docs-text-soft)]">LIVE FEED</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {consoleLogs.map((log, lIdx) => (
                    <div key={lIdx} className="leading-tight break-all">
                      {log}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUCCESS */}
        {gameState === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-8 border-2 border-emerald-700 bg-emerald-950/10 rounded-lg text-center space-y-6 max-w-lg mx-auto"
          >
            <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner">
              <Unlock className="h-7 w-7 text-emerald-700" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-mono font-bold text-emerald-800 uppercase tracking-widest">
                DECRYPTION KEY UNLOCKED
              </h2>
              <p className="text-xs font-mono text-[var(--docs-text-muted)]">
                Intrusion node bypassed successfully. System core accessed.
              </p>
            </div>

            <div className="border border-emerald-700/30 rounded-lg bg-[var(--docs-bg)] p-4 text-left space-y-2.5 shadow-sm">
              <div className="text-xs font-mono font-bold text-emerald-800 border-b border-emerald-700/10 pb-1.5">
                EXTRACTED LOGON CREDENTIAL:
              </div>
              <div className="p-2 border.5 border-emerald-600/20 bg-emerald-50/30 text-xs font-mono text-emerald-950 font-bold rounded select-all break-all cursor-pointer flex justify-between items-center group relative">
                <span>FLAG{m4st3rm1nd_h3x_c1ph3r_unl0ck_g0oD}</span>
                <span className="text-[9px] font-normal text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded group-hover:scale-105 transition-transform">
                  COPY
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setGameState('welcome')}
                className="px-6 py-2 border border-[var(--docs-border)] hover:bg-[var(--docs-surface)] text-[var(--docs-text)] font-mono text-xs rounded transition-colors cursor-pointer"
              >
                RETURN HOME
              </button>
              <button
                type="button"
                onClick={startNewGame}
                className="px-6 py-2 bg-[var(--docs-accent)] hover:bg-[var(--docs-accent)]/90 text-white font-mono text-xs rounded shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> DECRYPT AGAIN
              </button>
            </div>
          </motion.div>
        )}

        {/* FAILURE */}
        {gameState === 'failure' && (
          <motion.div
            key="failure"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-8 border border-red-700 bg-red-950/10 rounded-lg text-center space-y-6 max-w-lg mx-auto"
          >
            <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center animate-bounce">
              <ShieldAlert className="h-7 w-7 text-red-600" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-mono font-bold text-red-700 uppercase tracking-widest">
                INTRUDER LOCKOUT ENGAGED
              </h2>
              <p className="text-xs font-mono text-[var(--docs-text-soft)]">
                Exceeded 8 guess attempts. Server core isolated.
              </p>
            </div>

            <div className="border border-red-700/30 rounded-lg bg-[var(--docs-bg)] p-4 text-left space-y-1 shadow-sm font-mono text-xs">
              <span className="text-[var(--docs-text-soft)] uppercase font-bold text-[10px]">CORRECT DECRYPTION KEY WAS:</span>
              <div className="font-bold text-red-900 bg-red-50/40 p-2 rounded border border-red-600/10 tracking-widest text-center text-sm">
                {targetCode.join('')}
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setGameState('welcome')}
                className="px-6 py-2 border border-[var(--docs-border)] hover:bg-[var(--docs-surface)] text-[var(--docs-text)] font-mono text-xs rounded transition-colors cursor-pointer"
              >
                RETURN HOME
              </button>
              <button
                type="button"
                onClick={startNewGame}
                className="px-6 py-2 bg-[var(--docs-accent)] hover:bg-[var(--docs-accent)]/90 text-white font-mono text-xs rounded shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> REBOOT SOCKET
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
