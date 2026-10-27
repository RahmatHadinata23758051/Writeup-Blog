import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Sparkles } from 'lucide-react';

interface TacticalEasterEggProps {
  onNavigateToGame: () => void;
  isGamePage?: boolean;
}

export function TacticalEasterEgg({ onNavigateToGame, isGamePage = false }: TacticalEasterEggProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);
  const dismissedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Check if dismissed in this session
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem('tactical-easter-egg-dismissed');
      if (dismissed === 'true') {
        dismissedRef.current = true;
        setHasBeenDismissed(true);
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  // Appear after 7 seconds of browsing, if not dismissed and not already in game
  useEffect(() => {
    if (isGamePage || hasBeenDismissed) return;

    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 7000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isGamePage, hasBeenDismissed]);

  // Auto-hide after 14 seconds if user doesn't click
  useEffect(() => {
    if (!isVisible) return;
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 14000);
    return () => clearTimeout(hideTimer);
  }, [isVisible]);

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsVisible(false);
    try {
      sessionStorage.setItem('tactical-easter-egg-dismissed', 'true');
    } catch {
      // ignore
    }
    setHasBeenDismissed(true);
    dismissedRef.current = true;
  };

  const handleTriggerGame = () => {
    handleDismiss();
    onNavigateToGame();
  };

  if (isGamePage || hasBeenDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <aside
          aria-label="Secret Game Invitation"
          className="fixed bottom-0 right-0 z-50 pointer-events-none select-none"
        >
          {/* Peeking container sliding in from bottom-right */}
          <motion.div
            initial={{ x: 140, y: 80, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ x: 160, y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            className="relative pointer-events-auto flex flex-col items-end pb-0 pr-0"
          >
            {/* Comic Speech Bubble */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.6, opacity: 0, y: 10 }}
              transition={{ delay: 0.25, type: 'spring', damping: 18, stiffness: 300 }}
              onClick={handleTriggerGame}
              className="mr-14 mb-[-8px] cursor-pointer group"
              title="Click to play Cyber Breach Protocol!"
            >
              <div
                className="relative bg-[#FFFDF5] border-2 border-[#141413] px-3.5 py-2.5 rounded-2xl max-w-[210px] transition-transform group-hover:scale-105 active:scale-95"
                style={{
                  boxShadow: '3px 3px 0 0 #141413',
                }}
              >
                {/* Dismiss X button */}
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-[#141413] text-[#FFFDF5] text-[10px] font-mono font-bold flex items-center justify-center border border-[#141413] hover:bg-[#BF3511] transition-colors cursor-pointer"
                  title="Close"
                  aria-label="Close"
                >
                  ✕
                </button>

                <p className="font-sans text-[12px] font-bold text-[#141413] leading-tight m-0">
                  Psst... hey you,
                </p>
                <p className="font-sans text-[11px] text-[#5C574C] font-semibold leading-tight mt-0.5 mb-1">
                  wanna play some
                </p>
                <div className="flex items-center gap-1.5 bg-[#BF3511] text-[#FFFDF5] px-2 py-0.5 rounded font-mono text-[11px] font-black uppercase tracking-wider shadow-inner">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>GAME?</span>
                  <Sparkles className="w-3 h-3 ml-auto animate-pulse" />
                </div>

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

            {/* Peeking Mascot Character */}
            <motion.div
              onClick={handleTriggerGame}
              className="relative cursor-pointer w-28 h-28 sm:w-32 sm:h-32 translate-x-2 translate-y-2 transition-transform hover:translate-x-0 hover:translate-y-0"
              title="Click me to play!"
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

                {/* Glowing Hacker Visor / Eyes */}
                {/* Left eye (visible) */}
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

                {/* Right eye */}
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

                {/* Peeking Hand holding screen edge */}
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
