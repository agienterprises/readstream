import React, { useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Download } from "lucide-react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

const Editor: React.FC<EditorProps> = ({ value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];

    if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
       const text = await file.text();
       if (file.name.endsWith(".md")) {
           try {
               const clean = await invoke<string>("parse_markdown", { content: text });
               onChange(clean);
           } catch (err) {
               console.error("Markdown parse error:", err);
               onChange(text);
           }
       } else {
           onChange(text);
       }
    } else if (file.name.endsWith(".pptx")) {
        alert("Please drag and drop the PPTX file anywhere on the window to import.");
    }
  };

  React.useEffect(() => {
      import("@tauri-apps/api/event").then(({ listen }) => {
          const unlisten = listen<string[]>("tauri://file-drop", async (event) => {
              const paths = event.payload;
              if (paths && paths.length > 0) {
                  const path = paths[0];
                  if (path.endsWith(".pptx")) {
                      try {
                          const notes = await invoke<string>("extract_pptx_notes", { path });
                          onChange(notes);
                      } catch (e) {
                          alert("Failed to extract notes: " + e);
                      }
                  }
              }
          });
          return () => {
              unlisten.then(f => f());
          };
      });
  }, [onChange]);

  return (
    <div
      className={`relative w-full h-full flex flex-col ${isDragging ? "bg-blue-900/20" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <textarea
        ref={textareaRef}
        className="flex-1 w-full h-full bg-transparent text-lg p-4 resize-none focus:outline-none font-mono text-neutral-300 placeholder-neutral-600"
        placeholder="Paste your script here, or drop a .txt, .md, or .pptx file..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />

      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/50 backdrop-blur-sm rounded-xl border-2 border-dashed border-blue-500">
           <div className="text-center">
              <Download className="w-12 h-12 mx-auto text-blue-400 mb-2" />
              <p className="text-xl font-medium text-blue-200">Drop file to import</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
