import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, Skull, Bot, Flag, Compass, Flame, TrendingDown } from 'lucide-react';

interface TacticalEasterEggProps {
  onNavigateToGame: () => void;
  isGamePage?: boolean;
}

type EggMood = 'opening' | 'roast' | 'hygiene' | 'game';

interface EggDialogue {
  id: string;
  mood: EggMood;
  greeting: string;
  body: string;
  badge: string;
  badgeBg: string;
  isGameAction?: boolean;
  reaction: string;
  icon?: React.ReactNode;
}

const OPENING_DIALOGUE: EggDialogue = {
  id: 'opening-coffee',
  mood: 'opening',
  greeting: 'Hey, good to see you.',
  body: 'Grab some coffee and take what you need.',
  badge: 'COFFEE BREAK',
  badgeBg: '#BF3511',
  isGameAction: false,
  reaction: '',
  icon: <Coffee className="w-3.5 h-3.5" />,
};

const ROAST_DIALOGUES: EggDialogue[] = [
  // 2. Reality check
  {
    id: 'roast-touch-grass',
    mood: 'roast',
    greeting: 'Touch grass.',
    body: 'The flag isn\'t worth this.',
    badge: 'GO OUTSIDE',
    badgeBg: '#141413',
    reaction: 'Fresh air compiles faster than caffeine.',
    icon: <Compass className="w-3.5 h-3.5" />,
  },
  // 3. AI roast
  {
    id: 'roast-chatgpt',
    mood: 'roast',
    greeting: 'Did ChatGPT write that exploit for you?',
    body: 'Be honest.',
    badge: 'PROMPT ENGINEER',
    badgeBg: '#BF3511',
    reaction: 'No shame. Even the best LLMs hallucinate offsets.',
    icon: <Bot className="w-3.5 h-3.5" />,
  },
  // 4. Hygiene - 48h CTF
  {
    id: 'hygiene-48h',
    mood: 'hygiene',
    greeting: '48 hours of CTF.',
    body: '0 showers. 0 solves. Wash up, bro.',
    badge: 'SWEATLORD',
    badgeBg: '#141413',
    reaction: 'Your keyboard will thank you.',
    icon: <Flame className="w-3.5 h-3.5" />,
  },
  // 8. Flag shower
  {
    id: 'hygiene-flag',
    mood: 'hygiene',
    greeting: 'The flag is `CTF{shower_first}`.',
    body: 'You missed the easiest solve of the weekend.',
    badge: 'FREE FLAG',
    badgeBg: '#BF3511',
    reaction: 'Zero exploitation required. Just water and soap.',
    icon: <Flag className="w-3.5 h-3.5" />,
  },
  // 12. Rank delusion
  {
    id: 'roast-rank',
    mood: 'roast',
    greeting: 'Rank 842.',
    body: '\'We almost had it.\' Sure.',
    badge: 'DELUSIONAL',
    badgeBg: '#141413',
    reaction: 'Participation trophy energy. Touch grass.',
    icon: <TrendingDown className="w-3.5 h-3.5" />,
  },
  // 13. Game taunt
  {
    id: 'game-segfault',
    mood: 'game',
    greeting: 'Your exploit segfaults.',
    body: 'The minigame doesn\'t. Go play.',
    badge: 'WORKING CODE',
    badgeBg: '#BF3511',
    isGameAction: true,
    reaction: 'Initiating Breach Protocol... ⚡',
    icon: null,
  },
];

// All dialogues combined for rotation (opening is handled separately)
const ALL_DIALOGUES = [...ROAST_DIALOGUES];

export function TacticalEasterEgg({ onNavigateToGame, isGamePage = false }: TacticalEasterEggProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [reactedText, setReactedText] = useState<string | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const currentDialogue = useMemo(() => ALL_DIALOGUES[currentIdx % ALL_DIALOGUES.length], [currentIdx]);

  // Check if first visit this session
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem('tactical-easter-egg-dismissed');
      const hasVisited = sessionStorage.getItem('tactical-easter-egg-visited');
      if (dismissed === 'true') {
        setIsFirstVisit(false);
      }
      if (hasVisited === 'true') {
        setIsFirstVisit(false);
      } else {
        sessionStorage.setItem('tactical-easter-egg-visited', 'true');
        setIsFirstVisit(true);
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  // Initial delay & periodic loop
  useEffect(() => {
    if (isGamePage) return;

    if (isFirstVisit) {
      // First visit: show opening after 8s
      timerRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 8000);
    } else {
      // Subsequent: random roast after 40-60s
      const nextDelay = 40000 + Math.random() * 20000;
      timerRef.current = setTimeout(() => {
        setCurrentIdx(Math.floor(Math.random() * ALL_DIALOGUES.length));
        setIsVisible(true);
      }, nextDelay);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isGamePage, isFirstVisit]);

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
    setIsFirstVisit(false);

    // Schedule next appearance in 40-60 seconds with a DIFFERENT dialogue
    if (!isGamePage) {
      const nextDelay = 40000 + Math.random() * 20000;
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1 + Math.floor(Math.random() * (ALL_DIALOGUES.length - 1))) % ALL_DIALOGUES.length);
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
      if (!isGamePage) {
        setCurrentIdx((prev) => (prev + 1) % ALL_DIALOGUES.length);
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

    // Show reaction for 2.5s then hide
    if (currentDialogue.reaction) {
      setReactedText(currentDialogue.reaction);
      setTimeout(() => {
        handleHide();
      }, 2800);
    } else {
      handleHide();
    }
  };

  // Determine which dialogue to render
  const dialogueToShow = isFirstVisit ? OPENING_DIALOGUE : currentDialogue;
  const isOpening = isFirstVisit;

  if (isGamePage) return null;

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
              title={dialogueToShow.isGameAction ? 'Klik untuk main minigame!' : 'Klik untuk merespon!'}
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
                        style={{ backgroundColor: dialogueToShow.badgeBg }}
                      >
                        {dialogueToShow.icon && <span>{dialogueToShow.icon}</span>}
                        <span>{dialogueToShow.badge}</span>
                      </span>

                      {dialogueToShow.isGameAction && (
                        <span className="text-[9px] font-mono text-[#BF3511] font-bold animate-pulse">
                          [CLICK]
                        </span>
                      )}
                    </div>

                    <p className="font-sans text-[12px] font-bold text-[#141413] leading-tight m-0">
                      {dialogueToShow.greeting}
                    </p>

                    <p className="font-sans text-[11px] text-[#5C574C] font-semibold leading-relaxed mt-1 mb-1.5">
                      {dialogueToShow.body}
                    </p>

                    {dialogueToShow.isGameAction ? (
                      <div className="flex items-center justify-between bg-[#BF3511] text-[#FFFDF5] px-2.5 py-1 rounded font-mono text-[10.5px] font-black uppercase tracking-wider shadow-inner group-hover:bg-[#d63d15] transition-colors">
                        <span>KLIK UNTUK MAIN GAME</span>
                        <span className="font-mono text-[10px] opacity-80">►</span>
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
                {isOpening ? (
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
                ) : dialogueToShow.mood === 'roast' ? (
                  /* Smug / Mocking Eyes */
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
                ) : dialogueToShow.mood === 'hygiene' ? (
                  /* Disappointed / Tired Eyes - half closed */
                  <g>
                    <rect
                      x="92"
                      y="73"
                      width="11"
                      height="5"
                      rx="2"
                      fill="#BF3511"
                    />
                    <rect
                      x="108"
                      y="73"
                      width="11"
                      height="5"
                      rx="2"
                      fill="#BF3511"
                    />
                    {/* Frown line */}
                    <path
                      d="M100 87 Q106 84 112 87"
                      stroke="#BF3511"
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
