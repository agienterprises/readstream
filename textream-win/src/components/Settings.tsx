import React from "react";
import { X, Type, Rabbit, Mic, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ThemeManager } from "./ThemeManager";
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
    <div className="flex flex-col h-full text-foreground bg-background p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Settings</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2">
        {/* Mode Selection */}
        <section>
          <Label className="mb-3 block text-muted-foreground uppercase tracking-wider text-xs font-semibold">
            Scroll Mode
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={mode === "voice" ? "default" : "outline"}
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => setMode("voice")}
            >
              <Mic className="w-6 h-6" />
              <span>Voice</span>
            </Button>
            <Button
              variant={mode === "manual" ? "default" : "outline"}
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => setMode("manual")}
            >
              <MousePointer className="w-6 h-6" />
              <span>Manual</span>
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {mode === "voice"
              ? "Scrolls automatically as you speak."
              : "Scrolls at a constant speed."}
          </p>
        </section>

        {/* Font Size */}
        <section>
          <div className="flex justify-between mb-2">
            <Label className="flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
              <Type className="w-4 h-4" /> Font Size
            </Label>
            <span className="text-sm font-mono text-primary">{fontSize}px</span>
          </div>
          <Slider
            value={[fontSize]}
            min={24}
            max={120}
            step={4}
            onValueChange={(val) => setFontSize(val[0])}
          />
        </section>

        {/* Scroll Speed (Manual Mode Only) */}
        {mode === "manual" && (
          <section className="animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between mb-2">
              <Label className="flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
                <Rabbit className="w-4 h-4" /> Scroll Speed
              </Label>
              <span className="text-sm font-mono text-primary">{scrollSpeed}x</span>
            </div>
            <Slider
              value={[scrollSpeed]}
              min={1}
              max={10}
              step={0.5}
              onValueChange={(val) => setScrollSpeed(val[0])}
            />
          </section>
        )}

        {/* Theme Manager */}
        <ThemeManager />
      </div>

      <div className="mt-auto pt-6 border-t border-border text-xs text-center text-muted-foreground">
        v0.1.0 • Built with Tauri & Rust
      </div>
    </div>
  );
};

export default Settings;
