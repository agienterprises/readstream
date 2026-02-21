import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import Editor from "./components/Editor";
import Settings from "./components/Settings";
import Prompter from "./components/Prompter";
import { Cog, Play } from "lucide-react";

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
    <div className="flex h-screen bg-neutral-900 text-white overflow-hidden">
      <div className="flex-1 flex flex-col p-4 relative">
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Textream Windows
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full hover:bg-neutral-800 transition"
              title="Settings"
            >
              <Cog size={20} />
            </button>
            <button
              onClick={handleStart}
              disabled={!scriptText.trim()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition"
            >
              <Play size={18} fill="currentColor" />
              Start Prompter
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative rounded-xl border border-neutral-800 bg-neutral-950/50">
          <Editor
            value={scriptText}
            onChange={setScriptText}
          />

          {showSettings && (
            <div className="absolute top-0 right-0 h-full w-80 bg-neutral-900/95 backdrop-blur-md border-l border-neutral-800 p-6 shadow-2xl transition-transform duration-300 z-10">
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
