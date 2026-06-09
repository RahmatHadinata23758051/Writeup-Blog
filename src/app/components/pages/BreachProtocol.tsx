import { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, RefreshCw, Volume2, VolumeX, Trophy, Lock, Unlock, HelpCircle, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Web Audio API Synthesizer for 8-bit sound effects (Self-contained, zero-asset dependency)
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
    } catch (e) {
      // AudioContext fails silently if blocked
    }
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

      playTone(523.25, now, 0.1); // C5
      playTone(659.25, now + 0.08, 0.1); // E5
      playTone(783.99, now + 0.16, 0.1); // G5
      playTone(1046.50, now + 0.24, 0.25); // C6
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
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.4);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  playLockIn() {
    this.playBeep(900, 0.05, 'sine');
  }

  playSequenceMatched() {
    this.playBeep(1200, 0.15, 'sine');
  }
}

const synth = new SoundSynthesizer();

const HEX_POOL = ['BD', '1C', 'E9', '55', 'FF'];

interface TargetSequence {
  name: string;
  sequence: string[];
  reward: string;
  solved: boolean;
  color: string;
}

export function BreachProtocol() {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [gridSize, setGridSize] = useState<number>(5);
  const [grid, setGrid] = useState<string[][]>([]);
  const [buffer, setBuffer] = useState<string[]>([]);
  const [maxBuffer, setMaxBuffer] = useState<number>(6);
  
  // Selection cursor
  const [selectionMode, setSelectionMode] = useState<'row' | 'col'>('row');
  const [activeIndex, setActiveIndex] = useState<number>(0); // Row index 0 at start
  const [selectedCells, setSelectedCells] = useState<Array<{ r: number; c: number }>>([]);
  
  const [targets, setTargets] = useState<TargetSequence[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameState, setGameState] = useState<'welcome' | 'playing' | 'success' | 'failure'>('welcome');
  const [timeLeft, setTimeLeft] = useState(45);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Sound toggle
  const toggleMute = () => {
    setIsMuted(!isMuted);
    synth.muted = !isMuted;
    synth.playBeep(440, 0.05);
  };

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString().split(' ')[0];
    setConsoleLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  // Generate a random grid and puzzle sequences
  const generatePuzzle = (diff: 'easy' | 'medium' | 'hard') => {
    const size = diff === 'easy' ? 4 : diff === 'medium' ? 5 : 6;
    const bufSize = diff === 'easy' ? 5 : diff === 'medium' ? 6 : 7;
    const timeVal = diff === 'easy' ? 60 : diff === 'medium' ? 45 : 30;
    
    setGridSize(size);
    setMaxBuffer(bufSize);
    setTimeLeft(timeVal);
    
    // Create random grid
    const newGrid: string[][] = [];
    for (let r = 0; r < size; r++) {
      const row: string[] = [];
      for (let c = 0; c < size; c++) {
        row.push(HEX_POOL[Math.floor(Math.random() * HEX_POOL.length)]);
      }
      newGrid.push(row);
    }
    setGrid(newGrid);

    // Generate puzzle sequences that are mathematically solvable based on starting paths
    // Simulating a path to build target sequences
    const simulatedPath: string[] = [];
    let curR = 0;
    let curC = Math.floor(Math.random() * size);
    let selectRow = false; // first move is column selection within first row

    simulatedPath.push(newGrid[curR][curC]);

    const steps = diff === 'easy' ? 4 : diff === 'medium' ? 5 : 7;
    const visited = new Set<string>([`${curR},${curC}`]);

    for (let i = 0; i < steps; i++) {
      let nextIndex = -1;
      let attempts = 0;
      
      while (attempts < 15) {
        const randIdx = Math.floor(Math.random() * size);
        const key = selectRow ? `${curR},${randIdx}` : `${randIdx},${curC}`;
        if (!visited.has(key)) {
          nextIndex = randIdx;
          break;
        }
        attempts++;
      }

      if (nextIndex !== -1) {
        if (selectRow) {
          curC = nextIndex;
        } else {
          curR = nextIndex;
        }
        visited.add(`${curR},${curC}`);
        simulatedPath.push(newGrid[curR][curC]);
        selectRow = !selectRow;
      }
    }

    // Now, slice target sequences from the simulated path
    const sequences: TargetSequence[] = [];
    if (diff === 'easy') {
      sequences.push({
        name: 'DATAMINE_V1.EXE',
        sequence: simulatedPath.slice(0, 2),
        reward: 'FLAG{bRe4cH_e4sy_unl0ck_101}',
        solved: false,
        color: 'text-[var(--docs-accent)] border-[var(--docs-accent)]'
      });
      sequences.push({
        name: 'DATAMINE_V2.EXE',
        sequence: simulatedPath.slice(2, 5).filter(Boolean).length >= 2 ? simulatedPath.slice(2, 5) : [HEX_POOL[0], HEX_POOL[1]],
        reward: 'FLAG{sp1c_m1n1_d4t4_db}',
        solved: false,
        color: 'text-amber-600 border-amber-600'
      });
    } else if (diff === 'medium') {
      sequences.push({
        name: 'BASIC_MINER.SH',
        sequence: simulatedPath.slice(0, 2),
        reward: 'FLAG{n30n_n01s3_h4ck1ng}',
        solved: false,
        color: 'text-amber-700 border-amber-700/40'
      });
      sequences.push({
        name: 'ADVANCED_DATAMINE.PY',
        sequence: simulatedPath.slice(1, 4),
        reward: 'FLAG{m4tr1x_c1ph3r_h4ck_ok}',
        solved: false,
        color: 'text-[var(--docs-accent)] border-[var(--docs-accent)]'
      });
      sequences.push({
        name: 'MILITECH_OVERRIDE.HEX',
        sequence: simulatedPath.slice(2, 6).filter(Boolean).length >= 3 ? simulatedPath.slice(2, 6) : [HEX_POOL[0], HEX_POOL[2], HEX_POOL[4]],
        reward: 'FLAG{bRe4cH_pr0t0c0l_sUcc3ss_1337}',
        solved: false,
        color: 'text-emerald-700 border-emerald-700'
      });
    } else {
      sequences.push({
        name: 'ICEBREAKER.EXE',
        sequence: simulatedPath.slice(0, 3),
        reward: 'FLAG{ice_cr4ck_d3m0_w0rk}',
        solved: false,
        color: 'text-amber-700 border-amber-700/40'
      });
      sequences.push({
        name: 'BLACKWALL_GATEWAY.RAW',
        sequence: simulatedPath.slice(1, 5),
        reward: 'FLAG{l3g3nd4ry_c0mp1l3r_fl4g}',
        solved: false,
        color: 'text-[var(--docs-accent)] border-[var(--docs-accent)]'
      });
      sequences.push({
        name: 'ARASAKA_ROOT.SYS',
        sequence: simulatedPath.slice(2, 7).filter(Boolean).length >= 4 ? simulatedPath.slice(2, 7) : [HEX_POOL[1], HEX_POOL[2], HEX_POOL[3], HEX_POOL[4]],
        reward: 'FLAG{y0u_d3f34t3d_th3_h4rd3st_b0ss_g0oD}',
        solved: false,
        color: 'text-emerald-700 border-emerald-700'
      });
    }

    setTargets(sequences);
    setBuffer([]);
    setSelectedCells([]);
    setSelectionMode('row');
    setActiveIndex(0); // Row 0
    setGameState('playing');
    setIsPlaying(true);
    setConsoleLogs([]);

    addLog(`BREACH MODULE INITIALIZED [SIZE: ${size}x${size}]`);
    addLog(`TARGET DATA BUFFER CAPACITY: ${bufSize} BYTES`);
    addLog('AWAITING NETWORK HANDSHAKE...');
  };

  const startGame = () => {
    generatePuzzle(difficulty);
    synth.playBeep(880, 0.15, 'sine');
  };

  // Timer Effect
  useEffect(() => {
    if (isPlaying && gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeOut();
            return 0;
          }
          // Warn sound at low time
          if (prev <= 10) {
            synth.playBeep(220, 0.04, 'sawtooth');
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, gameState]);

  // Handle game over due to timeout
  const handleTimeOut = () => {
    setIsPlaying(false);
    setGameState('failure');
    synth.playFailure();
    addLog('CONNECTION TERMINATED — BUFFER UNDERFLOW (TIMEOUT)');
  };

  // Scroll console logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  // Check if target sequences match within the active buffer
  const checkSequences = (currentBuffer: string[]) => {
    let updatedTargets = [...targets];
    let matchedAny = false;

    updatedTargets = updatedTargets.map(tgt => {
      if (tgt.solved) return tgt;

      // Find sequence in buffer
      const bufferStr = currentBuffer.join(',');
      const targetStr = tgt.sequence.join(',');

      if (bufferStr.includes(targetStr)) {
        matchedAny = true;
        addLog(`SUCCESS: ${tgt.name} EXPLOITED! DATA EXTRACTED.`);
        synth.playSequenceMatched();
        return { ...tgt, solved: true };
      }
      return tgt;
    });

    setTargets(updatedTargets);

    // Win condition: All target sequences are solved
    const allSolved = updatedTargets.every(t => t.solved);
    if (allSolved) {
      handleWin();
    }
  };

  const handleWin = () => {
    setIsPlaying(false);
    setGameState('success');
    synth.playSuccess();
    addLog('ALL NETWORKS EXPLOITED successfully.');
    addLog('ENCRYPTED FLAGS EXTRACTED TO OUTPUT MODULE BELOW.');
  };

  // Cell Interaction
  const handleCellClick = (r: number, c: number, value: string) => {
    if (gameState !== 'playing') return;

    // Check if cell is valid for current selection mode
    if (selectionMode === 'row' && r !== activeIndex) return;
    if (selectionMode === 'col' && c !== activeIndex) return;

    // Check if cell has already been selected
    const isAlreadySelected = selectedCells.some(cell => cell.r === r && cell.c === c);
    if (isAlreadySelected) return;

    synth.playLockIn();
    
    // Add cell to buffer
    const nextBuffer = [...buffer, value];
    setBuffer(nextBuffer);
    setSelectedCells([...selectedCells, { r, c }]);
    addLog(`BUFFER LOCKIN: CELL [${r + 1},${c + 1}] -> ${value}`);

    // Check sequence status
    checkSequences(nextBuffer);

    // End condition: Buffer full
    if (nextBuffer.length >= maxBuffer && gameState === 'playing') {
      const allSolved = targets.every(t => t.solved);
      if (allSolved) {
        handleWin();
      } else {
        // If not all solved but buffer is full, it's a soft win if at least one target is solved
        const anySolved = targets.some(t => t.solved);
        if (anySolved) {
          handleWin();
        } else {
          setIsPlaying(false);
          setGameState('failure');
          synth.playFailure();
          addLog('CONNECTION TERMINATED — BUFFER FULL. MATRIX SECURED BY SYSADMIN.');
        }
      }
      return;
    }

    // Toggle selection path
    if (selectionMode === 'row') {
      setSelectionMode('col');
      setActiveIndex(c); // column index is the next constraint
    } else {
      setSelectionMode('row');
      setActiveIndex(r); // row index is the next constraint
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--docs-border)] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[var(--docs-accent)] animate-pulse" />
            <h1 className="text-xl font-mono tracking-widest font-bold text-[var(--docs-text)]">
              BREACH_PROTOCOL.SYS
            </h1>
          </div>
          <p className="text-xs font-mono text-[var(--docs-text-muted)] mt-1">
            CTF-Grade Security Override Sandbox. Decrypt the memory cells to extract rewards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound Synthesizer Controls */}
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 border border-[var(--docs-border-soft)] hover:border-[var(--docs-text)] rounded transition-colors text-[var(--docs-text-muted)] hover:text-[var(--docs-text)] cursor-pointer"
            title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {isMuted ? <VolumeX className="h-4.5 w-4.5 text-red-500" /> : <Volume2 className="h-4.5 w-4.5" />}
          </button>

          {/* Difficulty Selection */}
          {gameState === 'welcome' && (
            <div className="flex bg-[var(--docs-surface)] rounded p-0.5 border border-[var(--docs-border-soft)]">
              {(['easy', 'medium', 'hard'] as const).map(diff => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`px-3 py-1 font-mono text-xs uppercase rounded cursor-pointer transition-all ${
                    difficulty === diff
                      ? 'bg-[var(--docs-text)] text-[var(--docs-bg)] font-bold'
                      : 'text-[var(--docs-text-muted)] hover:text-[var(--docs-text)]'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* GAME STATES CAROUSEL */}
      <AnimatePresence mode="wait">
        {gameState === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-8 border border-[var(--docs-border)] bg-[var(--docs-bg-soft)] rounded-lg text-center space-y-6 relative overflow-hidden"
          >
            {/* Visual background noise element */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-600 via-amber-900 to-black bg-[size:4px_4px] bg-repeat"></div>
            
            <div className="mx-auto w-16 h-16 rounded-full border-2 border-[var(--docs-accent)] border-dashed flex items-center justify-center animate-spin-slow">
              <Shield className="h-8 w-8 text-[var(--docs-accent)]" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-lg font-mono font-bold text-[var(--docs-text)] uppercase tracking-wide">
                HACKING MODULE: OFFLINE
              </h2>
              <p className="text-sm text-[var(--docs-text-muted)]">
                Berdasarkan minigame ikonik Cyberpunk 2077. Tugasmu adalah memilih urutan nilai heksadesimal yang benar untuk mencocokkan target sequence di sebelah kanan.
              </p>
            </div>

            <div className="border border-[var(--docs-border-soft)] rounded-md bg-[var(--docs-bg)] p-4 max-w-md mx-auto text-left space-y-2">
              <h4 className="text-xs font-mono font-bold text-[var(--docs-text)] flex items-center gap-1.5 border-b border-[var(--docs-border-soft)] pb-1.5 mb-2">
                <HelpCircle className="h-3.5 w-3.5" /> ATURAN PERMAINAN:
              </h4>
              <ul className="text-xs font-mono text-[var(--docs-text-muted)] space-y-1.5 list-disc list-inside">
                <li>Langkah pertama wajib dimulai dari baris pertama.</li>
                <li>Tiap sel yang kamu pilih akan membatasi langkah berikutnya pada kolom yang sama.</li>
                <li>Langkah setelahnya akan berpindah constraint ke baris yang sama, bergantian terus-menerus.</li>
                <li>Dapatkan Flag bonus dengan mencocokkan seluruh target data!</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={startGame}
              className="px-8 py-3 bg-[var(--docs-accent)] hover:bg-[var(--docs-accent)]/90 text-white font-mono rounded tracking-widest text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer uppercase"
            >
              INITIALIZE BREACH OVERRIDE
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* LEFT SIDE: MATRIX GRID */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between font-mono bg-[var(--docs-bg-soft)] border border-[var(--docs-border-soft)] px-3 py-2 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-amber-600 rounded-full animate-ping" />
                  <span className="text-xs text-[var(--docs-text-muted)]">DECRYPTION MATRIX</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    TIME LEFT: <span className={`font-bold font-mono ${timeLeft <= 10 ? 'text-red-600 animate-pulse font-extrabold text-sm' : 'text-[var(--docs-accent)]'}`}>{timeLeft}s</span>
                  </div>
                  <div className="text-[var(--docs-text-soft)]">|</div>
                  <div>
                    CONSTRAINT: <span className="font-bold uppercase text-[var(--docs-text)]">{selectionMode === 'row' ? `ROW ${activeIndex + 1}` : `COL ${activeIndex + 1}`}</span>
                  </div>
                </div>
              </div>

              {/* Grid Box */}
              <div className="relative border border-[var(--docs-border)] bg-[var(--docs-bg-soft)] rounded-lg p-4 overflow-hidden select-none">
                {/* CRT Scanline Retro Vibes */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.06)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.03),_rgba(0,255,0,0.01),_rgba(0,0,255,0.03))] bg-[size:100%_4px,_6px_100%]"></div>
                
                <div
                  className="grid gap-2 relative z-10"
                  style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
                >
                  {grid.map((row, rIdx) =>
                    row.map((val, cIdx) => {
                      const isSelected = selectedCells.some(cell => cell.r === rIdx && cell.c === cIdx);
                      const isRowActive = selectionMode === 'row' && rIdx === activeIndex;
                      const isColActive = selectionMode === 'col' && cIdx === activeIndex;
                      const isInteractable = (isRowActive || isColActive) && !isSelected;

                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          onClick={() => isInteractable && handleCellClick(rIdx, cIdx, val)}
                          className={`
                            h-14 flex items-center justify-center rounded font-mono text-base font-bold tracking-wider transition-all duration-200
                            ${isSelected 
                              ? 'bg-[var(--docs-border-soft)] text-[var(--docs-text-soft)] border-dashed border border-[var(--docs-border-soft)] cursor-not-allowed'
                              : isInteractable
                                ? 'bg-[var(--docs-bg)] border border-[var(--docs-accent)] text-[var(--docs-text)] shadow-sm hover:bg-[var(--docs-accent)] hover:text-white cursor-pointer scale-102 hover:shadow-md'
                                : 'bg-[var(--docs-bg)]/40 border border-transparent text-[var(--docs-text-muted)]/40 cursor-not-allowed'
                            }
                            ${(isRowActive || isColActive) && !isSelected ? 'ring-1 ring-amber-500/30' : ''}
                          `}
                        >
                          {isSelected ? '--' : val}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* BUFFER ROW */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-[var(--docs-text-muted)] font-bold uppercase tracking-wider">
                  Data Buffer Sequence ({buffer.length}/{maxBuffer})
                </span>
                <div className="flex gap-2 p-3 border border-[var(--docs-border-soft)] bg-[var(--docs-bg)] rounded-lg min-h-14 overflow-x-auto">
                  {Array.from({ length: maxBuffer }).map((_, idx) => {
                    const value = buffer[idx];
                    return (
                      <div
                        key={idx}
                        className={`
                          w-10 h-10 flex items-center justify-center font-mono text-xs font-bold rounded border
                          ${value
                            ? 'bg-[var(--docs-text)] border-[var(--docs-text)] text-[var(--docs-bg)] scale-105'
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

            {/* RIGHT SIDE: TARGETS & CONSOLE */}
            <div className="space-y-4">
              {/* TARGET SEQUENCES */}
              <div className="border border-[var(--docs-border)] bg-[var(--docs-bg-soft)] rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--docs-text)] uppercase border-b border-[var(--docs-border-soft)] pb-2">
                  <Shield className="h-4 w-4 text-[var(--docs-accent)]" /> TARGET DATA SEQUENCES
                </div>

                <div className="space-y-2.5">
                  {targets.map((tgt, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 border rounded-lg bg-[var(--docs-bg)] flex flex-col gap-1.5 transition-all ${
                        tgt.solved
                          ? 'border-emerald-700 bg-emerald-50/20 opacity-70'
                          : 'border-[var(--docs-border-soft)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[var(--docs-text)]">{tgt.name}</span>
                        {tgt.solved ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/40 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                            <Unlock className="h-3 w-3" /> Overridden
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-[var(--docs-text-soft)] bg-[var(--docs-surface-hover)] px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Locked
                          </span>
                        )}
                      </div>

                      {/* Sequence Blocks */}
                      <div className="flex gap-1">
                        {tgt.sequence.map((seq, sIdx) => (
                          <span
                            key={sIdx}
                            className={`px-1.5 py-0.5 font-mono text-xs font-bold rounded ${
                              tgt.solved
                                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                : 'bg-[var(--docs-bg-soft)] text-[var(--docs-text)] border border-[var(--docs-border-soft)]'
                            }`}
                          >
                            {seq}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CONSOLE TERMINAL LOGS */}
              <div className="border border-[var(--docs-border)] bg-[var(--docs-code-bg)] rounded-lg p-3 space-y-2 text-[var(--docs-accent)] font-mono text-[10.5px] h-48 flex flex-col justify-between overflow-hidden">
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

        {/* SUCCESS STATE */}
        {gameState === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-8 border-2 border-emerald-700 bg-emerald-950/10 rounded-lg text-center space-y-6 max-w-lg mx-auto"
          >
            <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner">
              <Trophy className="h-7 w-7 text-emerald-700" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-mono font-bold text-emerald-800 uppercase tracking-widest">
                BREACH OVERRIDE SUCCESSFUL
              </h2>
              <p className="text-xs font-mono text-[var(--docs-text-muted)]">
                Network access secured. Security flags recovered from unlocked datamines.
              </p>
            </div>

            <div className="border border-emerald-700/30 rounded-lg bg-[var(--docs-bg)] p-4 text-left space-y-3.5 shadow-sm">
              <div className="text-xs font-mono font-bold text-emerald-800 border-b border-emerald-700/10 pb-1.5 flex items-center gap-1.5">
                <Unlock className="h-4 w-4" /> UNLOCKED REWARD FLAGS:
              </div>

              <div className="space-y-2">
                {targets.map((tgt, tIdx) => (
                  <div key={tIdx} className="space-y-1">
                    <div className="text-[10px] font-mono text-[var(--docs-text-soft)] uppercase font-bold tracking-wider">
                      {tgt.name}
                    </div>
                    <div className="p-2 border border-emerald-600/20 bg-emerald-50/30 text-xs font-mono text-emerald-950 font-bold rounded select-all break-all cursor-pointer flex justify-between items-center group relative">
                      <span>{tgt.solved ? tgt.reward : 'LOCK_BYPASS_FAILED'}</span>
                      <span className="text-[9px] font-normal text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded group-hover:scale-105 transition-transform">
                        COPY
                      </span>
                    </div>
                  </div>
                ))}
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
                onClick={startGame}
                className="px-6 py-2 bg-[var(--docs-accent)] hover:bg-[var(--docs-accent)]/90 text-white font-mono text-xs rounded shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> RUN AGAIN
              </button>
            </div>
          </motion.div>
        )}

        {/* FAILURE STATE */}
        {gameState === 'failure' && (
          <motion.div
            key="failure"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-8 border border-red-700 bg-red-950/10 rounded-lg text-center space-y-6 max-w-lg mx-auto"
          >
            <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center animate-bounce">
              <Shield className="h-7 w-7 text-red-600" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-mono font-bold text-red-700 uppercase tracking-widest">
                BREACH ATTEMPT FAILED
              </h2>
              <p className="text-xs font-mono text-[var(--docs-text-soft)]">
                Intrusion countermeasure activated. Network node locked down.
              </p>
            </div>

            <p className="text-xs text-[var(--docs-text-muted)] font-mono max-w-sm mx-auto">
              Kamu kehabisan waktu atau memilih buffer yang tidak menyelesaikan target datamine apa pun. Silakan coba lagi untuk mereset firewall target.
            </p>

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
                onClick={startGame}
                className="px-6 py-2 bg-[var(--docs-accent)] hover:bg-[var(--docs-accent)]/90 text-white font-mono text-xs rounded shadow transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> REBOOT & RETRY
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
