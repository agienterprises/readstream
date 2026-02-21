# Textream Windows

A Windows version of Textream built with Rust and Tauri.

## Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Download Vosk Model:**
   - Download a lightweight English model (e.g., `vosk-model-small-en-us-0.15`) from [Vosk Models](https://alphacephei.com/vosk/models).
   - Extract the downloaded archive.
   - Rename the folder to `model`.
   - Place the `model` folder inside `src-tauri/resources/`.
     - Create `src-tauri/resources/` if it doesn't exist.
   - Ensure `tauri.conf.json` includes the resource:
     ```json
     "bundle": {
       "resources": ["resources/**/*"]
     }
     ```

3. **Run Development:**
   ```bash
   npm run tauri dev
   ```

## Features

- **Voice Tracking:** Scrolls automatically as you speak using offline Vosk speech recognition.
- **Manual Mode:** Standard teleprompter auto-scroll with speed control.
- **File Support:** Import .txt, .md (strips syntax), and .pptx (extracts notes).
- **Floating Mode:** Always-on-top window for use over other apps (e.g., Zoom).

## Architecture

- **Frontend:** React + TypeScript + TailwindCSS.
- **Backend:** Rust (Tauri) handling file parsing and speech recognition.
- **Speech Engine:** Vosk (Offline, Local).

## Building for Windows

```bash
npm run tauri build
```

Note: You need to have the `vosk.dll` (or `libvosk.so` on Linux) available in your library path or bundled. The `vosk` crate usually handles linking, but for distribution, ensure the dynamic library is included.
