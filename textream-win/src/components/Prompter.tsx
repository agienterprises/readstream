import React, { useEffect, useRef, useState } from "react";
import { X, Play, Pause, Maximize, Minimize, Pin, PinOff } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PrompterProps {
  text: string;
  fontSize: number;
  scrollSpeed: number;
  mode: "manual" | "voice";
  onClose: () => void;
  speechPartial: string;
}

const Prompter: React.FC<PrompterProps> = ({
  text,
  fontSize,
  scrollSpeed,
  mode,
  onClose,
  speechPartial,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [highlightEndIndex, setHighlightEndIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);

  const lastStableIndex = useRef(0);
  const lastPartial = useRef("");

  const toggleFullScreen = async () => {
    const win = getCurrentWindow();
    const newState = !isFullScreen;
    await win.setFullscreen(newState);
    setIsFullScreen(newState);
  };

  const toggleAlwaysOnTop = async () => {
    const win = getCurrentWindow();
    const newState = !isAlwaysOnTop;
    await win.setAlwaysOnTop(newState);
    setIsAlwaysOnTop(newState);
  };

  useEffect(() => {
      if (mode === "voice") {
          if (isPlaying) {
              invoke("start_listening").catch(console.error);
          } else {
              invoke("stop_listening").catch(console.error);
          }
      }
  }, [isPlaying, mode]);

  useEffect(() => {
    if (mode !== "voice" || !isPlaying) return;

    const currentPartial = speechPartial.trim().toLowerCase();

    if (!currentPartial) {
        if (highlightEndIndex > lastStableIndex.current) {
            lastStableIndex.current = highlightEndIndex;
        }
        lastPartial.current = "";
        return;
    }

    if (currentPartial.length < lastPartial.current.length && !lastPartial.current.startsWith(currentPartial)) {
         if (highlightEndIndex > lastStableIndex.current) {
            lastStableIndex.current = highlightEndIndex;
        }
    }

    lastPartial.current = currentPartial;

    const originalLower = text.toLowerCase();
    const searchStart = lastStableIndex.current;
    const searchEnd = Math.min(originalLower.length, searchStart + 1000);
    const searchSpace = originalLower.substring(searchStart, searchEnd);

    const matchRelative = searchSpace.indexOf(currentPartial);

    if (matchRelative !== -1) {
         const matchAbsolute = searchStart + matchRelative;
         setHighlightEndIndex(matchAbsolute + currentPartial.length);
    }

  }, [speechPartial, mode, isPlaying, text, highlightEndIndex]);

  const tokens = React.useMemo(() => {
      return text.split(/(\s+)/);
  }, [text]);

  const renderedTokens = tokens.reduce<{ components: React.ReactNode[], count: number }>((acc, token, i) => {
      const start = acc.count;
      const end = acc.count + token.length;

      const isHighlighted = end <= highlightEndIndex;
      const isCurrent = start <= highlightEndIndex && end > highlightEndIndex;
      const isWord = token.trim().length > 0;

      acc.components.push(
        <span
            key={i}
            className={cn(
                "transition-opacity duration-300",
                isHighlighted ? "opacity-100 text-white" : "opacity-40 text-neutral-400",
                isCurrent && "text-blue-400 opacity-100"
            )}
            id={isWord ? `char-${start}` : undefined}
        >
            {token}
        </span>
      );

      acc.count = end;
      return acc;
  }, { components: [], count: 0 }).components;

  useEffect(() => {
      if (mode === "voice" && highlightEndIndex > 0 && isPlaying) {
          const el = containerRef.current?.querySelector(`.text-blue-400`);
          if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
      }
  }, [highlightEndIndex, mode, isPlaying]);

  useEffect(() => {
      if (mode !== "manual" || !isPlaying) return;

      let animationFrameId: number;
      const scroll = () => {
          if (containerRef.current) {
              containerRef.current.scrollTop += scrollSpeed * 0.5;
          }
          animationFrameId = requestAnimationFrame(scroll);
      };
      scroll();
      return () => cancelAnimationFrame(animationFrameId);
  }, [mode, isPlaying, scrollSpeed]);

  return (
    <div className="fixed inset-0 bg-black/95 text-white flex flex-col z-50">
      <div
        className="flex justify-between items-center p-4 bg-neutral-900/90 backdrop-blur select-none border-b border-white/10"
        data-tauri-drag-region
      >
        <div className="flex items-center gap-4">
            <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Close Prompter"
            >
                <X size={24} />
            </button>
            <div className="h-6 w-px bg-white/20" />
            <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>

            <button
                onClick={toggleAlwaysOnTop}
                className={cn("p-2 hover:bg-white/10 rounded-full transition-colors", isAlwaysOnTop && "text-blue-400")}
                title={isAlwaysOnTop ? "Unpin from Top" : "Pin on Top"}
            >
                {isAlwaysOnTop ? <Pin size={24} fill="currentColor" /> : <PinOff size={24} />}
            </button>

             <button
                onClick={toggleFullScreen}
                className={cn("p-2 hover:bg-white/10 rounded-full transition-colors", isFullScreen && "text-blue-400")}
                title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
                {isFullScreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>

            {mode === "voice" && (
                <div className="ml-2 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <div className={cn("w-2 h-2 rounded-full transition-colors", speechPartial ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                    <span className="text-xs font-medium text-neutral-300">
                        {speechPartial ? "Listening..." : "Waiting..."}
                    </span>
                </div>
            )}
        </div>
        <div className="text-sm font-medium text-neutral-500 uppercase tracking-widest hidden md:block">
            {mode === "voice" ? "Voice Tracking" : "Manual Scroll"}
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto w-full h-full scrollbar-hide outline-none relative"
        style={{
            scrollBehavior: "auto"
        }}
      >
        <div
            className="max-w-5xl mx-auto px-8 md:px-16 py-[50vh] whitespace-pre-wrap font-sans font-semibold text-center leading-relaxed"
            style={{ fontSize: `${fontSize}px` }}
        >
            {renderedTokens}
        </div>
      </div>

      {speechPartial && mode === "voice" && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
              <div className="bg-black/70 backdrop-blur px-4 py-2 rounded-full text-sm text-white/80 border border-white/10 shadow-xl max-w-xl truncate">
                  {speechPartial}
              </div>
          </div>
      )}
    </div>
  );
};

export default Prompter;
