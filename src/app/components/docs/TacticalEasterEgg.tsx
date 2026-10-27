import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Sparkles, Skull, Coffee, Zap, MessageSquareQuote, Flame, Eye } from 'lucide-react';

interface TacticalEasterEggProps {
  onNavigateToGame: () => void;
  isGamePage?: boolean;
}

type EggMood = 'greet' | 'tease' | 'troll' | 'game';

interface EggDialogue {
  id: string;
  mood: EggMood;
  greeting: string;
  body: string;
  badge: string;
  badgeBg: string;
  isGameAction?: boolean;
  reaction: string;
}

const DIALOGUES: EggDialogue[] = [
  // 1. Ngejek / Teasing
  {
    id: 'tease-skill-issue',
    mood: 'tease',
    greeting: 'Muka tegang amat bang...',
    body: 'Pasti flag-nya gak submit-submit ya? Skill issue detected 💀',
    badge: 'SKILL ISSUE',
    badgeBg: '#141413',
    reaction: 'Wkwkwk canda bang, gas terus pantang mundur! ✌️',
  },
  {
    id: 'tease-copas',
    mood: 'tease',
    greeting: 'Lagi copas script ya?',
    body: 'Ctrl+C, Ctrl+V... ngaku lu, jangan pura-pura paham kodenya! 😜',
    badge: 'KETAHUAN',
    badgeBg: '#BF3511',
    reaction: 'Hahaha gapapa copas dulu, besok baru paham! 🤡',
  },
  {
    id: 'tease-overthinking',
    mood: 'tease',
    greeting: 'Otak lu berasap tuh...',
    body: 'Pwn gak dapet shell? Makanya offset diitung, bukan dikira-kira! 💥',
    badge: 'SEGFAULT 139',
    badgeBg: '#141413',
    reaction: 'GDB and pwntools are your true besties bro! 🛠️',
  },

  // 2. Say Hai / Gaul
  {
    id: 'greet-ngab',
    mood: 'greet',
    greeting: 'Woi ngab! Santai dulu...',
    body: 'Udah ngopi belum hari ini? Begadang CTF mulu ntar tipes lho! ☕',
    badge: 'NGOPI DULU',
    badgeBg: '#4A3425',
    reaction: 'Mantap, seduh kopi dulu biar payload-nya tembus! ☕🔥',
  },
  {
    id: 'greet-suhu',
    mood: 'greet',
    greeting: 'Sungkem suhu CTF! 👋',
    body: 'Lagi cari inspirasi exploit atau mau evaluasi strategi nih bos?',
    badge: 'SUNGKEM',
    badgeBg: '#BF3511',
    reaction: 'Respect! Semoga dapat First Blood di next event! 🏆',
  },
  {
    id: 'greet-classified',
    mood: 'greet',
    greeting: 'Psst... agen rahasia!',
    body: 'Arsip intelijen ini level CONFIDENTIAL. Baca pelan-pelan, jangan cepu!',
    badge: 'CLASSIFIED',
    badgeBg: '#141413',
    reaction: 'Info aman di tangan kita berdua, agen. 🕵️‍♂️📁',
  },

  // 3. Trolling / Lucu
  {
    id: 'troll-life-advice',
    mood: 'troll',
    greeting: 'Tips heker pro:',
    body: 'Kalo pusing gak solve-solve: tutup laptop, tidur. Besok intip writeup.',
    badge: 'PRO HACKER TIPS',
    badgeBg: '#141413',
    reaction: 'Tidur adalah exploit paling efektif merefresh otak! 🛌💤',
  },
  {
    id: 'troll-jodoh',
    mood: 'troll',
    greeting: 'Nyari flag apa nyari jodoh?',
    body: 'Dua-duanya sama-sama susah didapet ya bang? Yang sabar ya... 💔',
    badge: 'CURHAT HEKER',
    badgeBg: '#BF3511',
    reaction: 'Tenang, flag lebih setia daripada dia! 🚩❤️',
  },

  // 4. Ajak Game
  {
    id: 'game-invite-1',
    mood: 'game',
    greeting: 'Psst... hey you!',
    body: 'Otak lu udah jenuh baca tulisan? Wanna play some cyber game?',
    badge: 'PLAY GAME?',
    badgeBg: '#BF3511',
    isGameAction: true,
    reaction: 'Meluncur ke Breach Protocol Simulator! 🚀🎮',
  },
  {
    id: 'game-invite-2',
    mood: 'game',
    greeting: 'Bosen baca teks melulu?',
    body: 'Tes kecepatan reflek heker lu di Breach Protocol Cyberpunk sekarang!',
    badge: 'MINIGAME',
    badgeBg: '#BF3511',
    isGameAction: true,
    reaction: 'Initiating Cyber Breach sequence... ⚡🕹️',
  },
];

export function TacticalEasterEgg({ onNavigateToGame, isGamePage = false }: TacticalEasterEggProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [reactedText, setReactedText] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const currentDialogue = useMemo(() => DIALOGUES[currentIdx % DIALOGUES.length], [currentIdx]);

  // Initial delay & periodic loop
  useEffect(() => {
    if (isGamePage || isMuted) return;

    // Pick random starting index
    setCurrentIdx(Math.floor(Math.random() * DIALOGUES.length));

    // First appearance after 8 seconds
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 8000);

    return () => clearTimeout(initialTimer);
  }, [isGamePage, isMuted]);

  // Auto-hide after 12 seconds if not interacted
  useEffect(() => {
    if (!isVisible) return;

    const hideTimer = setTimeout(() => {
      handleHide();
    }, 12000);

    return () => clearTimeout(hideTimer);
  }, [isVisible, currentIdx]);

  const handleHide = () => {
    setIsVisible(false);
    setReactedText(null);

    // Schedule next appearance in 40-60 seconds with a DIFFERENT dialogue
    if (!isMuted) {
      const nextDelay = 40000 + Math.random() * 20000;
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1 + Math.floor(Math.random() * (DIALOGUES.length - 1))) % DIALOGUES.length);
        setIsVisible(true);
      }, nextDelay);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setReactedText(null);
    // Snooze next appearance for 90 seconds
    setTimeout(() => {
      if (!isMuted) {
        setCurrentIdx((prev) => (prev + 1) % DIALOGUES.length);
        setIsVisible(true);
      }
    }, 90000);
  };

  const handleClickInteraction = () => {
    if (currentDialogue.isGameAction) {
      setIsVisible(false);
      onNavigateToGame();
      return;
    }

    // If it's a teasing or greeting quote, show funny reaction for 2.5s then duck down
    setReactedText(currentDialogue.reaction);
    setTimeout(() => {
      handleHide();
    }, 2800);
  };

  if (isGamePage || isMuted) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <aside
          aria-label="Tactical Mascot Companion"
          className="fixed bottom-0 right-0 z-50 pointer-events-none select-none"
        >
          <motion.div
            initial={{ x: 150, y: 90, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ x: 160, y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 220 }}
            className="relative pointer-events-auto flex flex-col items-end pb-0 pr-0"
          >
            {/* Comic Speech Bubble */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 15 }}
              transition={{ delay: 0.2, type: 'spring', damping: 18, stiffness: 280 }}
              onClick={handleClickInteraction}
              className="mr-14 mb-[-10px] cursor-pointer group"
              title={currentDialogue.isGameAction ? 'Klik untuk main minigame!' : 'Klik untuk merespon!'}
            >
              <div
                className="relative bg-[#FFFDF5] border-2 border-[#141413] px-3.5 py-2.5 rounded-2xl max-w-[230px] sm:max-w-[260px] transition-all group-hover:scale-105 active:scale-95"
                style={{
                  boxShadow: '3.5px 3.5px 0 0 #141413',
                }}
              >
                {/* Close X Button */}
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-[#141413] text-[#FFFDF5] text-[10px] font-mono font-bold flex items-center justify-center border border-[#141413] hover:bg-[#BF3511] transition-colors cursor-pointer"
                  title="Tutup (Snooze)"
                  aria-label="Tutup"
                >
                  ✕
                </button>

                {reactedText ? (
                  /* Reaction State */
                  <div className="py-1">
                    <p className="font-mono text-[11px] font-bold text-[#BF3511] leading-snug animate-pulse">
                      {reactedText}
                    </p>
                  </div>
                ) : (
                  /* Standard Dialogue State */
                  <>
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase tracking-wider text-white flex items-center gap-1 shadow-sm"
                        style={{ backgroundColor: currentDialogue.badgeBg }}
                      >
                        {currentDialogue.mood === 'tease' && <Skull className="w-2.5 h-2.5 text-[#FFFDF5]" />}
                        {currentDialogue.mood === 'troll' && <Flame className="w-2.5 h-2.5 text-[#FFFDF5]" />}
                        {currentDialogue.mood === 'greet' && <Coffee className="w-2.5 h-2.5 text-[#FFFDF5]" />}
                        {currentDialogue.mood === 'game' && <Gamepad2 className="w-2.5 h-2.5 text-[#FFFDF5]" />}
                        <span>{currentDialogue.badge}</span>
                      </span>

                      {currentDialogue.isGameAction && (
                        <span className="text-[9px] font-mono text-[#BF3511] font-bold animate-pulse">
                          [CLICK]
                        </span>
                      )}
                    </div>

                    <p className="font-sans text-[12px] font-bold text-[#141413] leading-tight m-0">
                      {currentDialogue.greeting}
                    </p>

                    <p className="font-sans text-[11px] text-[#5C574C] font-semibold leading-relaxed mt-1 mb-1.5">
                      {currentDialogue.body}
                    </p>

                    {currentDialogue.isGameAction ? (
                      <div className="flex items-center gap-1.5 bg-[#BF3511] text-[#FFFDF5] px-2 py-0.5 rounded font-mono text-[10.5px] font-black uppercase tracking-wider shadow-inner group-hover:bg-[#d63d15] transition-colors">
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>KLIK UNTUK MAIN GAME</span>
                        <Sparkles className="w-3 h-3 ml-auto animate-pulse" />
                      </div>
                    ) : (
                      <div className="text-[9.5px] font-mono text-[#5C574C] flex items-center gap-1 group-hover:text-[#BF3511] transition-colors">
                        <span>💬 Klik untuk bales</span>
                      </div>
                    )}
                  </>
                )}

                {/* Speech Bubble Tail */}
                <div
                  className="absolute -bottom-2 right-6 w-0 h-0"
                  style={{
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderTop: '9px solid #141413',
                  }}
                />
                <div
                  className="absolute -bottom-[6px] right-6 w-0 h-0"
                  style={{
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '7px solid #FFFDF5',
                  }}
                />
              </div>
            </motion.div>

            {/* Peeking Mascot Character with mood-responsive facial expression */}
            <motion.div
              onClick={handleClickInteraction}
              className="relative cursor-pointer w-28 h-28 sm:w-32 sm:h-32 translate-x-2 translate-y-2 transition-transform hover:translate-x-0 hover:translate-y-0"
              title="Klik saya!"
            >
              <svg
                viewBox="0 0 128 128"
                className="w-full h-full drop-shadow-[2px_2px_0px_rgba(20,20,19,0.3)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Body / Shoulders leaning from bottom right */}
                <path
                  d="M128 128 L80 128 C80 100 88 88 108 80 L128 88 Z"
                  fill="#141413"
                />
                <path
                  d="M82 128 C84 104 94 92 112 84"
                  stroke="#BF3511"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Cyber Hood / Head Peeking */}
                <path
                  d="M128 40 C100 40 76 60 76 90 C76 108 84 120 92 128 L128 128 Z"
                  fill="#141413"
                />

                {/* Hood Rim Accent */}
                <path
                  d="M128 44 C104 44 82 62 82 90 C82 105 88 118 96 128"
                  stroke="#BF3511"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Dark Face Mask Shadow */}
                <ellipse cx="106" cy="78" rx="18" ry="22" fill="#0D0D0C" />

                {/* Eyes / Visor Expression based on mood */}
                {currentDialogue.mood === 'tease' || currentDialogue.mood === 'troll' ? (
                  /* Smug / Winking / Mocking Eyes */
                  <g>
                    {/* Left Eye: Smug Wink `^` */}
                    <path
                      d="M93 76 Q97.5 70 102 76"
                      stroke="#BF3511"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Right Eye: Open Glowing Dot */}
                    <rect
                      x="108"
                      y="71"
                      width="10"
                      height="8"
                      rx="2"
                      fill="#BF3511"
                      className="animate-pulse"
                    />
                    <circle cx="113" cy="75" r="1.5" fill="#FFFDF5" />
                    {/* Smug Smirk line */}
                    <path
                      d="M102 88 Q108 92 114 87"
                      stroke="#BF3511"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </g>
                ) : currentDialogue.mood === 'greet' ? (
                  /* Friendly Wide Curious Eyes */
                  <g>
                    <rect
                      x="92"
                      y="70"
                      width="11"
                      height="9"
                      rx="2.5"
                      fill="#22C55E"
                      className="animate-pulse"
                    />
                    <circle cx="97.5" cy="74.5" r="2" fill="#FFFDF5" />

                    <rect
                      x="108"
                      y="70"
                      width="11"
                      height="9"
                      rx="2.5"
                      fill="#22C55E"
                      className="animate-pulse"
                    />
                    <circle cx="113.5" cy="74.5" r="2" fill="#FFFDF5" />
                    {/* Friendly Smile */}
                    <path
                      d="M100 87 Q106 91 112 87"
                      stroke="#22C55E"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </g>
                ) : (
                  /* Cyber Visor Glowing (Game mode) */
                  <g>
                    <rect
                      x="92"
                      y="72"
                      width="11"
                      height="7"
                      rx="2"
                      fill="#BF3511"
                      className="animate-pulse"
                    />
                    <circle cx="97.5" cy="75.5" r="1.5" fill="#FFFDF5" />

                    <rect
                      x="108"
                      y="72"
                      width="11"
                      height="7"
                      rx="2"
                      fill="#BF3511"
                      className="animate-pulse"
                    />
                    <circle cx="113.5" cy="75.5" r="1.5" fill="#FFFDF5" />
                  </g>
                )}

                {/* Peeking Hand on screen border */}
                <rect
                  x="70"
                  y="88"
                  width="10"
                  height="18"
                  rx="5"
                  fill="#141413"
                  stroke="#BF3511"
                  strokeWidth="2"
                  transform="rotate(-20 70 88)"
                />
                <rect
                  x="66"
                  y="94"
                  width="9"
                  height="16"
                  rx="4.5"
                  fill="#141413"
                  stroke="#BF3511"
                  strokeWidth="1.8"
                  transform="rotate(-20 66 94)"
                />
              </svg>
            </motion.div>
          </motion.div>
        </aside>
      )}
    </AnimatePresence>
  );
}
