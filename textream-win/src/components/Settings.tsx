import React from "react";
import { X, Type, Rabbit, Mic, MousePointer } from "lucide-react";
import type { AppMode } from "../App";

interface SettingsProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  scrollSpeed: number;
  setScrollSpeed: (speed: number) => void;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({
  fontSize,
  setFontSize,
  scrollSpeed,
  setScrollSpeed,
  mode,
  setMode,
  onClose,
}) => {
  return (
    <div className="flex flex-col h-full text-neutral-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2">
        {/* Mode Selection */}
        <section>
          <label className="block text-sm font-medium text-neutral-400 mb-3 uppercase tracking-wider">
            Scroll Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode("voice")}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                mode === "voice"
                  ? "bg-blue-600/20 border-blue-500 text-blue-100 shadow-[0_0_15px_-5px_rgba(59,130,246,0.5)]"
                  : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-800/80"
              }`}
            >
              <Mic size={24} />
              <span className="font-medium">Voice</span>
            </button>
            <button
              onClick={() => setMode("manual")}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                mode === "manual"
                  ? "bg-purple-600/20 border-purple-500 text-purple-100 shadow-[0_0_15px_-5px_rgba(168,85,247,0.5)]"
                  : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-800/80"
              }`}
            >
              <MousePointer size={24} />
              <span className="font-medium">Manual</span>
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {mode === "voice"
              ? "Scrolls automatically as you speak."
              : "Scrolls at a constant speed."}
          </p>
        </section>

        {/* Font Size */}
        <section>
          <div className="flex justify-between mb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-400 uppercase tracking-wider">
              <Type size={14} /> Font Size
            </label>
            <span className="text-sm font-mono text-blue-400">{fontSize}px</span>
          </div>
          <input
            type="range"
            min="24"
            max="120"
            step="4"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="w-full accent-blue-500 h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />
        </section>

        {/* Scroll Speed (Manual Mode Only) */}
        {mode === "manual" && (
          <section className="animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-400 uppercase tracking-wider">
                <Rabbit size={14} /> Scroll Speed
              </label>
              <span className="text-sm font-mono text-purple-400">{scrollSpeed}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
              className="w-full accent-purple-500 h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </section>
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-neutral-800 text-xs text-center text-neutral-600">
         v0.1.0 • Built with Tauri & Rust
      </div>
    </div>
  );
};

export default Settings;
