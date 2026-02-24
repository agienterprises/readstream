import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import Editor from "./components/Editor";
import Settings from "./components/Settings";
import Prompter from "./components/Prompter";
import { Cog, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AppMode = "manual" | "voice";

interface SpeechPayload {
  partial: string;
}

function App() {
  const [scriptText, setScriptText] = useState("");
  const [fontSize, setFontSize] = useState(48);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const [mode, setMode] = useState<AppMode>("voice");
  const [isPrompterActive, setIsPrompterActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [speechPartial, setSpeechPartial] = useState("");

  useEffect(() => {
    const unlisten = listen<SpeechPayload>("speech-event", (event) => {
      setSpeechPartial(event.payload.partial);
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const handleStart = () => {
    setIsPrompterActive(true);
  };

  const handleStop = () => {
    setIsPrompterActive(false);
    invoke("stop_listening").catch(console.error);
    setSpeechPartial("");
  };

  if (isPrompterActive) {
    return (
      <Prompter
        text={scriptText}
        fontSize={fontSize}
        scrollSpeed={scrollSpeed}
        mode={mode}
        onClose={handleStop}
        speechPartial={speechPartial}
      />
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <div className="flex-1 flex flex-col p-4 relative">
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-foreground">
            Textream Windows
          </h1>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              <Cog className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleStart}
              disabled={!scriptText.trim()}
              className="gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Prompter
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative rounded-xl border border-border bg-card/50">
          <Editor
            value={scriptText}
            onChange={setScriptText}
          />

          {showSettings && (
            <div className="absolute top-0 right-0 h-full w-80 bg-background/95 backdrop-blur-md border-l border-border shadow-2xl transition-transform duration-300 z-10">
              <Settings
                fontSize={fontSize}
                setFontSize={setFontSize}
                scrollSpeed={scrollSpeed}
                setScrollSpeed={setScrollSpeed}
                mode={mode}
                setMode={setMode}
                onClose={() => setShowSettings(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
