import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Download, Music, Disc, Sparkles, Volume2, VolumeX, Repeat } from 'lucide-react';
import { cn } from '../lib/utils';

interface MusicGenerationEffectProps {
  isGenerating: boolean;
  audioUrl?: string;
  prompt?: string;
  lyrics?: string;
}

export const MusicGenerationEffect: React.FC<MusicGenerationEffectProps> = ({
  isGenerating,
  audioUrl,
  prompt,
  lyrics
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [showLyrics, setShowLyrics] = React.useState(false);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.warn('[OTIVO] Audio play error:', err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `otivo-lyria-music-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative w-full max-w-2xl rounded-3xl overflow-hidden bg-[#121215] border border-pink-500/20 shadow-2xl p-6 my-4 backdrop-blur-xl">
      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="generating-music"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8 px-4 text-center relative overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0.5, 0.2],
                  rotate: [0, 90, 0]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-10 -left-10 w-64 h-64 bg-pink-500/20 blur-[100px] rounded-full"
              />
              <motion.div
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.2, 0.5, 0.2],
                  rotate: [0, -90, 0]
                }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-10 -right-10 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full"
              />
            </div>

            {/* Spinning Disc / Vinyl Record */}
            <div className="relative mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="w-24 h-24 rounded-full bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 p-1 shadow-[0_0_30px_rgba(236,72,153,0.4)]"
              >
                <div className="w-full h-full rounded-full bg-[#121215] flex items-center justify-center border border-white/20">
                  <Disc className="w-10 h-10 text-pink-400 animate-pulse" />
                </div>
              </motion.div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-inner" />
            </div>

            {/* Lyria 3 Pro Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
              <span className="text-xs font-mono font-bold text-pink-300 uppercase tracking-widest">
                Lyria 3 Pro Engine
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mb-1">Synthesizing Full Music Track</h3>
            <p className="text-xs text-white/50 max-w-md italic mb-6">
              {prompt ? `"${prompt}"` : 'Composing arrangement, instruments, and vocal harmony...'}
            </p>

            {/* Animated Waveform Spectrum */}
            <div className="flex items-center gap-1.5 h-10">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: ['20%', '100%', '30%', '80%', '20%']
                  }}
                  transition={{
                    duration: 0.8 + (i % 5) * 0.2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                    delay: i * 0.05
                  }}
                  className="w-1.5 bg-gradient-to-t from-pink-500 to-purple-400 rounded-full"
                />
              ))}
            </div>
          </motion.div>
        ) : audioUrl ? (
          <motion.div
            key="audio-player"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-5"
          >
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Top Info Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <motion.div
                    animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center p-0.5 shadow-lg shadow-pink-500/20"
                  >
                    <div className="w-full h-full rounded-[14px] bg-[#1a1a20] flex items-center justify-center">
                      <Music className="w-6 h-6 text-pink-400" />
                    </div>
                  </motion.div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Full AI Generated Song</span>
                    <span className="text-[10px] px-2 py-0.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-full font-mono uppercase tracking-wider font-bold">
                      lyria-3-pro-preview
                    </span>
                  </div>
                  <p className="text-xs text-white/50 truncate max-w-sm mt-0.5">
                    {prompt || 'Full Mastered Track'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all border border-white/10"
                  title="Download MP3"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Visualizer bars when playing */}
            <div className="flex items-center justify-between gap-1 h-8 bg-black/30 rounded-xl px-4 border border-white/5">
              {[...Array(32)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={isPlaying ? {
                    height: [
                      `${Math.max(15, Math.sin(i + currentTime) * 80)}%`,
                      `${Math.max(25, Math.cos(i + currentTime * 2) * 100)}%`,
                      '20%'
                    ]
                  } : { height: '15%' }}
                  transition={{ duration: 0.3, repeat: isPlaying ? Infinity : 0, repeatType: 'reverse' }}
                  className={cn(
                    "w-1 rounded-full transition-colors",
                    isPlaying ? "bg-gradient-to-t from-pink-500 to-purple-400" : "bg-white/20"
                  )}
                />
              ))}
            </div>

            {/* Player Controls & Scrubber */}
            <div className="flex flex-col gap-2">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:bg-white/20 transition-all"
              />

              <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={toggleMute}
                className="p-2 text-white/40 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>

              {lyrics ? (
                <button
                  onClick={() => setShowLyrics(!showLyrics)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-full transition-all border",
                    showLyrics ? "bg-pink-500/20 border-pink-500/40 text-pink-300" : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                  )}
                >
                  Lyrics
                </button>
              ) : <div className="w-8" />}
            </div>

            {/* Optional Lyrics Dropdown */}
            {lyrics && showLyrics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-4 bg-black/40 border border-white/10 rounded-2xl text-xs text-white/80 font-mono leading-relaxed max-h-48 overflow-y-auto custom-scrollbar"
              >
                <div className="text-[10px] text-pink-400 uppercase tracking-widest font-bold mb-2">Song Lyrics</div>
                <pre className="whitespace-pre-wrap font-sans">{lyrics}</pre>
              </motion.div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
