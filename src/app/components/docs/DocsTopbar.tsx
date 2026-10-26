import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaSquare, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

interface DocsTopbarProps {
  title?: string;
  onHomeClick?: () => void;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
}

function LofiRadio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/lofi-bgm.mp3');
    audio.loop = true;
    audio.volume = 0.2;
    audio.preload = 'auto';

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    audioRef.current = audio;

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.warn('Audio play prevented by browser policy:', err);
      });
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audio.muted = nextMuted;
  };

  return (
    <div className="flex items-center gap-2 bg-[#141413] border-2 border-[#141413] px-3 py-1.5 select-none">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes retro-bounce-1 { 0%, 100% { height: 20%; } 50% { height: 80%; } }
        @keyframes retro-bounce-2 { 0%, 100% { height: 15%; } 50% { height: 95%; } }
        @keyframes retro-bounce-3 { 0%, 100% { height: 30%; } 50% { height: 70%; } }
        .bar-anim-1 { animation: retro-bounce-1 0.7s ease-in-out infinite; }
        .bar-anim-2 { animation: retro-bounce-2 0.5s ease-in-out infinite; }
        .bar-anim-3 { animation: retro-bounce-3 0.8s ease-in-out infinite; }
      `}} />
      
      {/* Tape label */}
      <span className="font-mono text-[10px] uppercase tracking-widest text-[#F6F0E0]/60">LOFI</span>
      
      {/* Play/Stop Button - tactile keycap */}
      <button
        type="button"
        onClick={togglePlay}
        className="relative px-2 py-1 bg-[#F6F0E0] text-[#141413] font-mono text-[10px] uppercase tracking-wider border-2 border-[#141413] cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        style={{ boxShadow: '2px 2px 0 0 #141413' }}
        title={isPlaying ? "Stop cozy lofi" : "Play cozy lofi"}
      >
        {isPlaying ? <FaSquare className="h-3 w-3" /> : <FaPlay className="h-3 w-3" />}
      </button>

      {/* Mute Button - tactile keycap */}
      <button
        type="button"
        onClick={toggleMute}
        className="relative px-2 py-1 bg-[#F6F0E0] text-[#141413] font-mono text-[10px] uppercase tracking-wider border-2 border-[#141413] cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        style={{ boxShadow: '2px 2px 0 0 #141413' }}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <FaVolumeMute className="h-3 w-3" /> : <FaVolumeUp className="h-3 w-3" />}
      </button>

      {/* Tiny Equalizer Visualizer */}
      <div className="flex items-end gap-[1.5px] h-3 px-0.5 select-none w-4">
        <div className={`w-[2px] bg-[#BF3511] ${isPlaying && !isMuted ? 'bar-anim-1' : ''}`} style={{ height: '30%' }} />
        <div className={`w-[2px] bg-[#BF3511] ${isPlaying && !isMuted ? 'bar-anim-2' : ''}`} style={{ height: '15%' }} />
        <div className={`w-[2px] bg-[#BF3511] ${isPlaying && !isMuted ? 'bar-anim-3' : ''}`} style={{ height: '45%' }} />
      </div>
    </div>
  );
}

export function DocsTopbar({
  title = 'CTF Writeups',
  onHomeClick,
  onMenuClick,
  onSearchClick,
}: DocsTopbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-[#141413] bg-[#F5F1E6]">
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        {/* Left: Brand & Menu Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="relative px-2 py-1 bg-[#F6F0E0] text-[#141413] font-mono text-[10px] uppercase tracking-wider border-2 border-[#141413] cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none lg:hidden"
            style={{ boxShadow: '2px 2px 0 0 #141413' }}
            aria-label="Toggle sidebar"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <button
            onClick={onHomeClick}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src="/logo.png"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const sibling = e.currentTarget.nextElementSibling;
                if (sibling && sibling.classList.contains('emoji-fallback')) {
                  (sibling as HTMLElement).style.display = 'inline-block';
                }
              }}
              className="w-9 h-9 object-contain transition-transform duration-200 group-hover:scale-110"
              alt="Nattt Logo"
            />
            <span className="emoji-fallback text-3xl transition-transform duration-200 group-hover:scale-110" style={{ display: 'none' }}>
              🐤
            </span>
            <span className="font-[Anton] text-[1.5rem] tracking-tighter text-[#141413] uppercase">
              Nattt
            </span>
            </button>
        </div>

        {/* Center: Search - Terminal style */}
        <div className="hidden flex-1 max-w-md sm:flex">
          <button
            onClick={onSearchClick}
            className="w-full flex items-center gap-2 bg-[#141413] border-2 border-[#141413] px-3 py-2 text-left cursor-pointer relative group"
            style={{ boxShadow: '3px 3px 0 0 #141413' }}
          >
            <span className="text-[#BF3511] font-mono text-[12px]">&gt;</span>
            <span className="font-mono text-[#F6F0E0] text-sm">grep archive...</span>
            <kbd className="ml-auto bg-[#F6F0E0] border-2 border-[#141413] text-[10px] px-2 py-0.5 text-[#141413] font-mono font-bold uppercase tracking-wider">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Extras */}
        <div className="flex items-center gap-3">
          <LofiRadio />
          
          <a
            href="https://medium.com/@rsafei731"
            target="_blank"
            rel="noopener noreferrer"
            className="relative px-2 py-1 bg-[#F6F0E0] text-[#141413] border-2 border-[#141413] cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            style={{ boxShadow: '2px 2px 0 0 #141413' }}
            aria-label="Medium"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" fillRule="evenodd" clipRule="evenodd">
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm-2.426 14.741h-3.574v-.202l1.261-1.529c.134-.139.195-.335.162-.526v-5.304c.015-.147-.041-.293-.151-.392l-1.121-1.35v-.201h3.479l2.689 5.897 2.364-5.897h3.317v.201l-.958.919c-.083.063-.124.166-.106.269v6.748c-.018.103.023.206.106.269l.936.919v.201h-4.706v-.201l.969-.941c.095-.095.095-.123.095-.269v-5.455l-2.695 6.844h-.364l-3.137-6.844v4.587c-.026.193.038.387.174.526l1.26 1.529v.202z"/>
            </svg>
          </a>
          <a
            href="https://github.com/RahmatHadinata23758051"
            target="_blank"
            rel="noopener noreferrer"
            className="relative px-2 py-1 bg-[#F6F0E0] text-[#141413] border-2 border-[#141413] cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            style={{ boxShadow: '2px 2px 0 0 #141413' }}
            aria-label="GitHub"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
